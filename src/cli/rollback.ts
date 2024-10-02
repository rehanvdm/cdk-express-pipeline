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
} from '@aws-sdk/client-cloudformation';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import chalk = /* eslint-disable @typescript-eslint/no-require-imports */ require('chalk');
import * as yaml from 'yaml';
import * as yaml_types from 'yaml/types';
import { Logger } from './logger';
import { DeploymentStatus, getManifestStackArtifactProperties, ManifestArtifact, ManifestArtifactDeployed } from './manifest';
import { AssumedRoleCredentials, assumeRoleAndGetCredentials, OriginalArgs, printWavesRollbackStatus } from './utils';
import { DeploymentOrderWave } from '../utils';

const logger = new Logger();

export type RollbackStack = {
  stackId: string;
  hasRollbackTemplate: boolean;
  rollbackTemplatePath: string;
  /* YML length not JSON length */
  rollbackTemplateSize: number;
}

export enum RollbackStatus {
  ROLLBACK_COMPLETE = 'ROLLBACK_COMPLETE',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',

  SKIP_ROLLBACK_CREATE_STACK = 'SKIP_ROLLBACK_CREATE_STACK',
  SKIP_NOT_DEPLOYED = 'SKIP_NOT_DEPLOYED',
  SKIP_NO_CHANGES = 'SKIP_NO_CHANGES',
  SKIP_CFN_ROLLED_BACK = 'SKIP_CFN_ROLLED_BACK',
}

export type CfnBodyParams = {
  templateBody?: string;
  templateUrl?: string;
}

export type RolledBackStackResult = {
  stackId: string;
  status: RollbackStatus;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(true), ms));


/* ================================================= CDK Related functions ===================================================== */

/**
 * Return the hash of tha data provided. Same as CDK's contentHash function (aws-cdk/lib/util/content-hash)
 * @param data
 */
export function contentHash(data: string | Buffer | DataView) {
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
    logger.log('Saving stack:', stackArtifact.stackId);

    const {
      stackId,
      stackName,
      region,
      assumeRole,
    } = getManifestStackArtifactProperties(stackArtifact);
    logger.debug('Stack Properties:', stackId, stackName, region, assumeRole);

    const credentials = await assumeRoleAndGetCredentials(region, args.profile, assumeRole);
    logger.debug('Assumed Role:', assumeRole);

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
        process.stdout.write(`${stackName} | ${timestamp} | ${status} | ${type} | ${resourceId} ${resourceStatusReason}\r\n`);
      }
      lastEventId = eventsResp.StackEvents[0].EventId;
    }
    nextToken = eventsResp.NextToken;

  } while (nextToken);

  return lastEventId;
}

/**
 * Convert the deployment status to rollback status. DeploymentStatus.SUCCESS_UPDATE_STACK is the only status that does not have a direct rollback
 * status, it will either produce an RollbackStatus.SUCCESS_ROLLED_BACK or RollbackStatus.FAILED_ROLLED_BACK
 * @param status
 */
function translateDeploymentToRollback(status: DeploymentStatus): { status: RollbackStatus | undefined; rollback: boolean } {

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

async function prepareCfnBody(rollbackStack: RollbackStack, cfnClient: CloudFormationClient, region: string, credentials: AssumedRoleCredentials,
  stackArtifact: ManifestArtifactDeployed): Promise<CfnBodyParams> {

  let returnVal: CfnBodyParams = {
    templateBody: undefined,
    templateUrl: undefined,
  };

  const MAX_TEMPLATE_DIRECT_UPLOAD_BYTE_SIZE = 50_000; //TODO: Increase and see if S3 upload works
  const templateBody = fs.readFileSync(rollbackStack.rollbackTemplatePath, 'utf-8');

  if (rollbackStack.rollbackTemplateSize <= MAX_TEMPLATE_DIRECT_UPLOAD_BYTE_SIZE) {
    returnVal.templateBody = templateBody;
  } else {
    /* Get CDK Toolkit Stack Bucket and BootstrapVersion outputs */


    const cdkToolkitStackName = 'CDKToolkit';
    logger.debug('Getting CDK Assets Bucket name from Bootstrap Stack:', cdkToolkitStackName);
    const cdkToolkitStack = await cfnClient.send(new DescribeStacksCommand({ StackName: cdkToolkitStackName }));
    const cdkAssetsBucket = cdkToolkitStack.Stacks?.[0].Outputs?.find((output) => output.OutputKey == 'BucketName')?.OutputValue;

    /* Upload to S3 */
    const client = new S3Client({
      region: region, //TODO: needed? might be different than the stsclient?
      credentials,
    });

    logger.debug('Uploading template to S3 CDK Asset Bucket:', cdkAssetsBucket);
    const templateHash = contentHash(templateBody);
    const key = `cdk-express-pipeline-rollback-stacks/${stackArtifact.stackId}/${templateHash}.yml`;
    await client.send(new PutObjectCommand({
      Bucket: cdkAssetsBucket,
      Key: key,
      Body: templateBody,
    }));
    const url = `https://${cdkAssetsBucket}.s3.${region}.amazonaws.com/${key}`;
    logger.debug('Uploaded to S3, URL:', url);
    returnVal.templateUrl = url;
  }

  return returnVal;
}

async function updateStack(stackName: string, cfnClient: CloudFormationClient, templateArg: CfnBodyParams) {
  let status: 'SKIP_NO_CHANGES' | 'UPDATE_STARTED' | 'UPDATE_FAILED';
  let error: Error | undefined;

  try {
    await cfnClient.send(new UpdateStackCommand({
      StackName: stackName,
      TemplateBody: templateArg.templateBody,
      TemplateURL: templateArg.templateUrl,
      Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
    }));
    status = 'UPDATE_STARTED';
  } catch (err) {
    const errTyped = err as Error;

    if (errTyped.name == 'ValidationError' && errTyped.message == 'No updates are to be performed.') {
      status = 'SKIP_NO_CHANGES';
    } else {
      status = 'UPDATE_FAILED';
      error = errTyped;
    }
  }
  return {
    status,
    error,
  };
}

function pushAndPrintStackResult(rolledBackStackResults: RolledBackStackResult[],
  deploymentOrder: DeploymentOrderWave[],
  rolledBackStackResult: RolledBackStackResult,
) {
  rolledBackStackResults.push(rolledBackStackResult);
  printWavesRollbackStatus(deploymentOrder, rolledBackStackResults);
}

export async function rollBack(deployedStackArtifacts: ManifestArtifactDeployed[], rollbackStackTemplates: RollbackStack[], args: OriginalArgs,
  deploymentOrder: DeploymentOrderWave[]):
  Promise<RolledBackStackResult[]> {
  const deployedStackArtifactsReversed = deployedStackArtifacts.reverse(); //TODO: Check that in correct reversed order...

  const stacksRolledBackStatus: RolledBackStackResult[] = [];
  for (const stackArtifact of deployedStackArtifactsReversed) {
    const stackLogIdentifier = `${stackArtifact.stackId} (${stackArtifact.properties.stackName})`;
    logger.log(`Checking Stack: ${stackLogIdentifier}`);

    const {
      stackId,
      stackName,
      region,
      assumeRole,
    } = getManifestStackArtifactProperties(stackArtifact);
    logger.debug('Stack Properties:', stackId, stackName, region, assumeRole);

    const {
      rollback,
      status,
    } = translateDeploymentToRollback(stackArtifact.status);

    if (!rollback) {
      logger.log(`Skip Stack Rollback: DeploymentStatus.${stackArtifact.status}`);

      pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
        stackId: stackArtifact.stackId,
        status: status!,
      });
      continue;
    }

    const rollbackStack = rollbackStackTemplates.find((stack) => stack.stackId == stackArtifact.stackId);
    assert.ok(rollbackStack);


    logger.log(`Stack rolling back: ${stackLogIdentifier}`);

    const credentials = await assumeRoleAndGetCredentials(region, args.profile, assumeRole);
    logger.debug('Assumed Role:', assumeRole);

    const cfnClient = new CloudFormationClient({
      region: region, //TODO: needed? might be different than the stsclient?
      credentials,
    });
    const templateArg = await prepareCfnBody(rollbackStack, cfnClient, region, credentials, stackArtifact);
    logger.debug('Prepared Stack body:', {
      'Template Body Present': templateArg.templateBody ? 'Yes' : 'No',
      'Template URL Present': templateArg.templateUrl ? 'Yes' : 'No',
    });

    logger.log(`Stack Rollback: Update started for stack ${stackLogIdentifier}`);
    const rollbackResult = await updateStack(stackName, cfnClient, templateArg);
    logger.debug('Update Stack result:', rollbackResult);

    switch (rollbackResult.status) {
      case 'SKIP_NO_CHANGES':
        logger.log('Stack Rollback: No Changes detected, skipping rollback');
        pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
          stackId: stackArtifact.stackId,
          status: RollbackStatus.SKIP_NO_CHANGES,
        });
        break;
      case 'UPDATE_FAILED':
        logger.log('Stack Rollback: Update failed for stack, CFN rolled back, skipping rollback. Error');
        logger.error(rollbackResult.error);
        pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
          stackId: stackArtifact.stackId,
          status: RollbackStatus.ROLLBACK_FAILED,
        });
        break;

      case 'UPDATE_STARTED':
        logger.log('Stack Rollback: Waiting for completion..');

        let currentEventId: string | undefined = undefined;
        let stackInProgress = true;
        const startDate = new Date();

        let stackStatus: StackStatus | undefined;
        do {
          currentEventId = await printStackEvents(startDate, cfnClient, stackName, currentEventId);

          /* Check if stack is still in progress */
          const stackResp = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
          stackStatus = stackResp.Stacks?.[0].StackStatus;
          stackInProgress = stackStatus?.endsWith('_IN_PROGRESS') ?? false;

          /* Delay until next check */
          await sleep(3000);
        } while (stackInProgress);

        if (stackStatus?.toString().endsWith('_FAILED')) {
          logger.log('Stack Status:', stackStatus?.toString());
          logger.log('Stack Rollback Status:', RollbackStatus.ROLLBACK_FAILED);
          pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
            stackId: stackArtifact.stackId,
            status: RollbackStatus.ROLLBACK_FAILED,
          });
        } else if (stackStatus?.toString().endsWith('_COMPLETE')) {
          logger.log('Stack Status:', stackStatus?.toString());
          logger.log('Stack Rollback Status:', RollbackStatus.ROLLBACK_COMPLETE);
          pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
            stackId: stackArtifact.stackId,
            status: RollbackStatus.ROLLBACK_COMPLETE,
          });
        }
        break;
    }
  }

  return stacksRolledBackStatus;
}


