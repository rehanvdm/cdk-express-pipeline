import * as assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {
  CloudFormationClient,
  DescribeStackEventsCommand,
  DescribeStackEventsOutput,
  DescribeStacksCommand,
  GetTemplateCommand,
  StackStatus,
  UpdateStackCommand,
  UpdateStackCommandOutput,
} from '@aws-sdk/client-cloudformation';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as chalk from 'chalk';
import * as yaml from 'yaml';
import * as yaml_types from 'yaml/types';
import { DeploymentStatus, getManifestStackArtifactProperties, ManifestArtifact, ManifestArtifactDeployed } from './manifest';
import { AssumedRoleCredentials, assumeRoleAndGetCredentials, OriginalArgs } from './utils';

type RollbackStack = {
  stackId: string;
  hasRollbackTemplate: boolean;
  rollbackTemplatePath: string;
  rollbackTemplateSize: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(true), ms));


/* ================================================= CDK Related functions ===================================================== */

/**
 * Return the hash of tha data provided. Same as CDK's contentHash function (aws-cdk/lib/util/content-hash)
 * @param data
 */
function contentHash(data: string | Buffer | DataView) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Pad the string to the right with spaces. Same CDK's padRight function
 * @param n
 * @param x
 */
function padRight(n: number, x: string): string {
  return x + ' '.repeat(Math.max(0, n - x.length));
}

/***
 * Transforms a JSON string to YAML. Same as CDK's toYAML function (aws-cdk/lib/serialize)
 * @param json
 * @returns {string}
 */
function toYAML(json: string): string {
  const oldFold = yaml_types.strOptions.fold.lineWidth;
  try {
    yaml_types.strOptions.fold.lineWidth = 0;
    return yaml.stringify(json, { schema: 'yaml-1.1' });
  } finally {
    yaml_types.strOptions.fold.lineWidth = oldFold;
  }
}

/**
 * Return the color based on the status of the stack. Same as CDK's colorFromStatus function
 * @param status
 */
function colorFromStatusResult(status?: string) {
  if (!status) {
    return chalk.reset;
  }

  if (status.indexOf('FAILED') !== -1) {
    return chalk.red;
  }
  if (status.indexOf('ROLLBACK') !== -1) {
    return chalk.yellow;
  }
  if (status.indexOf('COMPLETE') !== -1) {
    return chalk.green;
  }

  return chalk.reset;
}

/* ============================================================================================================================= */


/**
 * Save the current (identified by the cloud assembly before the deployment) CloudFormation templates to the rollback directory
 * @param args
 * @param stackArtifacts
 */
export async function saveCurrentCfnTemplates(args: OriginalArgs, stackArtifacts: ManifestArtifact[]) {

  const rollbackTemplateDir = './.cdk-express-pipeline/rollback';
  if (!fs.existsSync(rollbackTemplateDir)) {
    fs.rmSync(rollbackTemplateDir, {
      recursive: true,
      force: true,
    });
  }
  fs.mkdirSync(rollbackTemplateDir, { recursive: true });

  let rollbackStacks: RollbackStack[] = [];
  for (const stackArtifact of stackArtifacts) {
    const {
      stackName,
      region,
      assumeRole,
    } = getManifestStackArtifactProperties(stackArtifact);
    const credentials = await assumeRoleAndGetCredentials(region, args.profile, assumeRole);
    const client = new CloudFormationClient({
      region: region, //TODO: needed? might be different than the stsclient?
      credentials,
    });

    let hasRollbackTemplate = false;
    let rollbackTemplateSize = 0;
    try {
      const templateDetails = await client.send(new GetTemplateCommand({ StackName: stackName }));
      fs.writeFileSync(`${rollbackTemplateDir}/${stackArtifact.stackId}.template.json`, templateDetails.TemplateBody!);
      hasRollbackTemplate = true;
      rollbackTemplateSize = toYAML(templateDetails.TemplateBody!).length;
    } catch (err) {
      if ((err as any).name == 'ValidationError' && (err as any).message.includes('does not exist')) {
        hasRollbackTemplate = false;
      } else {
        throw err;
      }
    }
    rollbackStacks.push({
      stackId: stackArtifact.stackId,
      hasRollbackTemplate,
      rollbackTemplatePath: `${rollbackTemplateDir}/${stackArtifact.stackId}.template.json`,
      rollbackTemplateSize: rollbackTemplateSize,
    });
  }
  return rollbackStacks;
}


function formatUtcTime(date?: Date, includeUtcIdentifier: boolean = true) {
  if (!date) {
    return undefined;
  }

  return date.toISOString().replace('T', ' ').slice(11, 19) + (includeUtcIdentifier ? ' UTC' : '');
}

async function printStackEvents(printFrom: Date, cfnClient: CloudFormationClient, stackName: string, currentEventId?: string) {

  const widthTimeStamp = 12;
  const widthStatus = 20;

  let lastEventId: string | undefined = currentEventId;
  let nextToken: string | undefined = undefined;
  do {
    const eventsResp: DescribeStackEventsOutput = await cfnClient.send(new DescribeStackEventsCommand({
      StackName: stackName,
      NextToken: nextToken,
    }));

    if (eventsResp.StackEvents && eventsResp.StackEvents.length > 0) {
      for (const event of eventsResp.StackEvents) {
        if (event.EventId === lastEventId) {
          break;
        }

        if (event.Timestamp && event.Timestamp < printFrom) {
          continue;
        }

        const colorStatus = colorFromStatusResult(event.ResourceStatus);
        const colorStatusReason = chalk.cyan;

        const timestamp = padRight(widthTimeStamp, formatUtcTime(event.Timestamp, true) || '');
        // const timestamp = event.Timestamp?.toISOString() || '';
        const status = colorStatus(padRight(widthStatus, event.ResourceStatus || '').slice(0, widthStatus));
        const type = event.ResourceType;
        const resourceId = colorStatus(event.LogicalResourceId);
        const resourceStatusReason = colorStatusReason(event.ResourceStatusReason ? '| ' + event.ResourceStatusReason : '');
        console.log(`${stackName} | ${timestamp} | ${status} | ${type} | ${resourceId} ${resourceStatusReason}`);
      }

      lastEventId = eventsResp.StackEvents[0].EventId;
    }
    nextToken = eventsResp.NextToken;

  } while (nextToken);

  return lastEventId;
}

export enum RollbackStatus {
  ROLLBACK_COMPLETE = 'ROLLBACK_COMPLETE',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',

  SKIP_ROLLBACK_CREATE_STACK = 'SKIP_ROLLBACK_CREATE_STACK',
  SKIP_NOT_DEPLOYED = 'SKIP_NOT_DEPLOYED',
  SKIP_NO_CHANGES = 'SKIP_NO_CHANGES',
  SKIP_CFN_ROLLED_BACK = 'SKIP_CFN_ROLLED_BACK',
}

// export enum DeploymentStatus {
//   SKIPPED_NO_CHANGES = 'SKIPPED_NO_CHANGES',
//   FAILED_UPDATE_STACK = 'FAILED_UPDATE',
//   FAILED_CREATE_STACK = 'FAILED_CREATE_STACK',
//   SUCCESS_CREATE_STACK = 'SUCCESS_CREATE_STACK',
//   SUCCESS_UPDATE_STACK = 'SUCCESS_UPDATE_STACK',
//   NOT_DEPLOYED = 'NOT_DEPLOYED',
// }

/**
 * Convert the deployment status to rollback status. DeploymentStatus.SUCCESS_UPDATE_STACK is the only status that does not have a direct rollback
 * status, it will either produce an RollbackStatus.SUCCESS_ROLLED_BACK or RollbackStatus.FAILED_ROLLED_BACK
 * @param status
 */
function translateDeploymentToRollback(status: DeploymentStatus): { status: RollbackStatus | undefined; rollback: boolean } {

  // let ret: { status: RollbackStatus | undefined, rollback: boolean };
  // ret = {
  //   status: undefined,
  //   rollback: false,
  // };

  switch (status) {
    case DeploymentStatus.SKIPPED_NO_CHANGES:
      return {
        status: RollbackStatus.SKIP_NO_CHANGES,
        rollback: false,
      };

    case DeploymentStatus.NOT_DEPLOYED:
      return {
        status: RollbackStatus.SKIP_NOT_DEPLOYED,
        rollback: false,
      };

    case DeploymentStatus.CREATE_STACK_SUCCESS:
    case DeploymentStatus.CREATE_STACK_FAILED:
      return {
        status: RollbackStatus.SKIP_ROLLBACK_CREATE_STACK,
        rollback: false,
      };

    /* A DeploymentStatus.FAILED_UPDATE_STACK will always trigger a CFN rollback, assuming that a failed stack rolls back */
    case DeploymentStatus.UPDATE_STACK_FAILED:
      return {
        status: RollbackStatus.SKIP_CFN_ROLLED_BACK,
        rollback: false,
      };

    /* Statuses that should do a Rollback */
    case DeploymentStatus.UPDATE_STACK_SUCCESS:
      return {
        status: undefined,
        rollback: true,
      };
  }
}

export type CfnBodyParams = {
  templateBody?: string;
  templateUrl?: string;
}

async function prepareCfnBody(rollbackStack: RollbackStack, cfnClient: CloudFormationClient, region: string, credentials: AssumedRoleCredentials,
  stackArtifact: ManifestArtifactDeployed): Promise<CfnBodyParams> {

  let returnVal: CfnBodyParams = {
    templateBody: undefined,
    templateUrl: undefined,
  };

  const MAX_TEMPLATE_DIRECT_UPLOAD_BYTE_SIZE = 50_000; //TODO: Lower and see if S3 upload works

  if (rollbackStack.rollbackTemplateSize <= MAX_TEMPLATE_DIRECT_UPLOAD_BYTE_SIZE) {
    returnVal.templateBody = fs.readFileSync(rollbackStack.rollbackTemplatePath, 'utf-8');
  } else {
    /* Get CDK Toolkit Stack Bucket and BootstrapVersion outputs */
    console.log('Getting CDK Assets Bucket name..');
    const cdkToolkitStackName = 'CDKToolkit';
    const cdkToolkitStack = await cfnClient.send(new DescribeStacksCommand({ StackName: cdkToolkitStackName }));
    const cdkAssetsBucket = cdkToolkitStack.Stacks?.[0].Outputs?.find((output) => output.OutputKey == 'BucketName')?.OutputValue;

    /* Upload to S3 */
    const client = new S3Client({
      region: region, //TODO: needed? might be different than the stsclient?
      credentials,
    });

    console.log('Uploading template to S3..');
    const templateBody = fs.readFileSync(rollbackStack.rollbackTemplatePath, 'utf-8');
    const templateHash = contentHash(templateBody);
    const key = `cdk-express-pipeline-rollback-stacks/${stackArtifact.stackId}/${templateHash}.yml`;
    await client.send(new PutObjectCommand({
      Bucket: cdkAssetsBucket,
      Key: key,
      Body: templateBody,
    }));
    const url = `https://${cdkAssetsBucket}.s3.${region}.amazonaws.com/${key}`;
    console.log('Uploaded to S3:', url);
    returnVal.templateUrl = url;
  }

  return returnVal;
}

async function updateStack(stackArtifact: ManifestArtifactDeployed, stackName: string, cfnClient: CloudFormationClient, templateArg: CfnBodyParams) {

  let rollbackResult: UpdateStackCommandOutput | undefined;
  let status: RollbackStatus | undefined;
  let error: Error | undefined;

  try {
    console.log(`Rolling back stack: ${stackArtifact.stackId} (${stackName})`);
    rollbackResult = await cfnClient.send(new UpdateStackCommand({
      StackName: stackName,
      TemplateBody: templateArg.templateBody,
      TemplateURL: templateArg.templateUrl,
      Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
    }));
    status = RollbackStatus.ROLLBACK_COMPLETE;
  } catch (err) {
    const errTyped = err as Error;

    if (errTyped.name == 'ValidationError' && errTyped.message == 'No updates are to be performed.') {
      status = RollbackStatus.SKIP_NO_CHANGES;
    } else {
      status = RollbackStatus.ROLLBACK_FAILED;
      error = errTyped;
    }
  }
  return {
    rollbackResult,
    status,
    error,
  };
}

export async function rollBack(deployedStackArtifacts: ManifestArtifactDeployed[], rollbackStackTemplates: RollbackStack[], args: OriginalArgs) {
  const deployedStackArtifactsReversed = deployedStackArtifacts.reverse(); //TODO: Check that in correct reversed order...
  // console.log("deployedStackArtifactsReversed", deployedStackArtifactsReversed)


  const stacksRolledBackStatus: { stackId: string; status: RollbackStatus }[] = [];
  for (const stackArtifact of deployedStackArtifactsReversed) {

    const {
      rollback,
      status,
    } = translateDeploymentToRollback(stackArtifact.status);
    if (!rollback) {
      console.log(`Stack: ${stackArtifact.stackId} - ${stackArtifact.status}, skipping rollback..`);

      stacksRolledBackStatus.push({
        stackId: stackArtifact.stackId,
        status: status!,
      });
      continue;
    }


    console.log(`Stack: ${stackArtifact.stackId} - ${stackArtifact.status}, rolling back..`);
    const rollbackStack = rollbackStackTemplates.find((stack) => stack.stackId == stackArtifact.stackId);
    assert.ok(rollbackStack);

    const {
      stackName,
      region,
      assumeRole,
    } = getManifestStackArtifactProperties(stackArtifact);
    const credentials = await assumeRoleAndGetCredentials(region, args.profile, assumeRole);
    const cfnClient = new CloudFormationClient({
      region: region, //TODO: needed? might be different than the stsclient?
      credentials,
    });

    const templateArg = await prepareCfnBody(rollbackStack, cfnClient, region, credentials, stackArtifact);
    const rollbackResult = await updateStack(stackArtifact, stackName, cfnClient, templateArg);


    switch (rollbackResult.status) {
      case RollbackStatus.SKIP_NO_CHANGES:
        console.log('Rollback: No changes, not rolling back for stack:', stackArtifact.stackId);
        stacksRolledBackStatus.push({
          stackId: stackArtifact.stackId,
          status: RollbackStatus.SKIP_NO_CHANGES,
        });
        break;
      case RollbackStatus.ROLLBACK_FAILED:
        console.log('Rollback: Rollback failed for stack:', stackArtifact.stackId);
        console.error(rollbackResult.error);
        stacksRolledBackStatus.push({
          stackId: stackArtifact.stackId,
          status: RollbackStatus.ROLLBACK_FAILED,
        });
        break;

      case RollbackStatus.ROLLBACK_COMPLETE:
        console.log('Rollback: Rolling back for stack:', stackArtifact.stackId);
        /* Wait for the stack to be updated, show the events */
        let currentEventId: string | undefined = undefined;
        let stackInProgress = true;
        const startDate = new Date();

        let stackStatus: StackStatus | undefined; // TODO: get the stack status Type
        do {

          currentEventId = await printStackEvents(startDate, cfnClient, stackName, currentEventId);

          /* Check and continue polling only if the stack is still in progress */
          await sleep(3000);
          const stackResp = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
          stackStatus = stackResp.Stacks?.[0].StackStatus;
          stackInProgress = stackStatus?.endsWith('_IN_PROGRESS') ?? false;
        } while (stackInProgress);

        if (stackStatus?.toString().endsWith('_FAILED')) {
          console.log('Rollback: Rollback failed for stack:', stackArtifact.stackId);
          stacksRolledBackStatus.push({
            stackId: stackArtifact.stackId,
            status: RollbackStatus.ROLLBACK_FAILED,
          });
        } else if (stackStatus?.toString().endsWith('_COMPLETE')) {
          console.log('Rollback: Complete for stack:', stackArtifact.stackId);
          stacksRolledBackStatus.push({
            stackId: stackArtifact.stackId,
            status: RollbackStatus.ROLLBACK_COMPLETE,
          });
        }
        break;
    }

    console.log('Rollback: Stacks rollback status:', JSON.stringify(stacksRolledBackStatus, null, 2));
  }


}


