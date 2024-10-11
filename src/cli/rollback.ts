import * as assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import {
  CloudFormationClient,
  DeleteStackCommand,
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
import { ROLLBACK_PATH } from './deploy';
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

  // SKIP_ROLLBACK_CREATE_STACK = 'SKIP_ROLLBACK_CREATE_STACK',
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
  if (!fs.existsSync(ROLLBACK_PATH)) {
    fs.rmSync(ROLLBACK_PATH, {
      recursive: true,
      force: true,
    });
  }
  fs.mkdirSync(ROLLBACK_PATH, { recursive: true });

  let rollbackStacks: RollbackStack[] = [];
  for (const stackArtifact of stackArtifacts) {
    logger.debug('Saving stack:', stackArtifact.stackId);

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
      fs.writeFileSync(`${ROLLBACK_PATH}/${stackArtifact.stackId}.template.json`, templateDetails.TemplateBody!);
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
      rollbackTemplatePath: `${ROLLBACK_PATH}/${stackArtifact.stackId}.template.json`,
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

/**
 * Print the stack events to the console if the stack exists and while it has events
 * @param printFrom
 * @param cfnClient
 * @param stackName
 * @param currentEventId
 */
async function printStackEvents(printFrom: Date, cfnClient: CloudFormationClient, stackName: string, currentEventId?: string) {

  const widthTimeStamp = 12;
  const widthStatus = 20;

  let lastEventId: string | undefined = currentEventId;
  let nextToken: string | undefined = undefined;
  do {
    let eventsResp: DescribeStackEventsOutput;
    try {
      eventsResp = await cfnClient.send(new DescribeStackEventsCommand({
        StackName: stackName,
        NextToken: nextToken,
      }));
    } catch (err) {
      const errTyped = err as Error;
      if (errTyped.name == 'ValidationError' && errTyped.message.includes('does not exist')) {
        return undefined;
      }
      throw err;
    }


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
type TranslateDeploymentToRollback = {
  status: RollbackStatus | undefined;
  action?: 'update' | 'create';
  rollback: boolean;
}

export function translateDeploymentToRollback(status: DeploymentStatus): TranslateDeploymentToRollback {

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
        status: undefined,
        action: 'create',
        rollback: true,
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
        action: 'update',
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
      region: region,
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

async function deleteStack(stackName: string, cfnClient: CloudFormationClient) {
  let status: 'DELETE_STARTED' | 'DELETE_FAILED';
  let error: Error | undefined;

  try {
    await cfnClient.send(new DeleteStackCommand({
      StackName: stackName,
    }));
    status = 'DELETE_STARTED';
  } catch (err) {
    const errTyped = err as Error;
    status = 'DELETE_FAILED';
    error = errTyped;
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

async function pollStackComplete(cfnClient: CloudFormationClient, stackName: string) {
  let currentEventId: string | undefined = undefined;
  let stackInProgress = true;
  const startDate = new Date();
  let stackStatus: StackStatus | undefined;
  do {
    currentEventId = await printStackEvents(startDate, cfnClient, stackName, currentEventId);

    /* Check if stack is still in progress */
    try {
      const stackResp = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName })); still error? Nout catched debug the fi stagments console .log values see what happens
      stackStatus = stackResp.Stacks?.[0].StackStatus;
      stackInProgress = stackStatus?.endsWith('_IN_PROGRESS') ?? false;
    } catch (err) {
      const errTyped = err as Error;
      if (errTyped.name == 'ValidationError' && errTyped.message.includes('does not exist')) {
        stackInProgress = false;
        stackStatus = 'DELETE_COMPLETE'; /* Can be any _COMPLETE, the only reason a stack can not be found is if it was deleted */
      }
      throw err;
    }

    /* Delay until next check */
    if (stackInProgress) {
      await sleep(3000);
    }
  } while (stackInProgress);
  return stackStatus;
}

export async function rollBack(deployedStackArtifacts: ManifestArtifactDeployed[], rollbackStackTemplates: RollbackStack[], args: OriginalArgs,
  deploymentOrder: DeploymentOrderWave[]):
  Promise<{
    stacksRolledBackStatus: RolledBackStackResult[];
    success: boolean;
  }> {
  const deployedStackArtifactsReversed = deployedStackArtifacts.reverse();

  const stacksRolledBackStatus: RolledBackStackResult[] = [];
  for (const stackArtifact of deployedStackArtifactsReversed) {
    const stackLogIdentifier = `${stackArtifact.stackId} (${stackArtifact.properties.stackName})`;
    logger.log('');
    logger.log(`Stack Rollback: Checking ${stackLogIdentifier}`);

    const {
      stackId,
      stackName,
      region,
      assumeRole,
    } = getManifestStackArtifactProperties(stackArtifact);
    logger.debug('Stack Properties:', stackId, stackName, region, assumeRole);

    const {
      rollback,
      action,
      status,
    } = translateDeploymentToRollback(stackArtifact.status);

    if (!rollback) {
      logger.log(`Stack Rollback: Skipping, DeploymentStatus is ${stackArtifact.status}`);
      /* Do not reprint */
      stacksRolledBackStatus.push({
        stackId: stackArtifact.stackId,
        status: status!,
      });
      continue;
    }


    logger.debug(`Stack Rollback: Preparing ${stackLogIdentifier}`);
    const credentials = await assumeRoleAndGetCredentials(region, args.profile, assumeRole);
    logger.debug('Assumed Role:', assumeRole);
    const cfnClient = new CloudFormationClient({
      region: region,
      credentials,
    });


    let cfnResult: {
      status: 'skip' | 'failed' | 'started';
      error: Error | undefined;
    };
    if (action == 'create') {
      logger.log('Stack Rollback: Delete Started');
      const deleteResult = await deleteStack(stackName, cfnClient);
      logger.debug('Delete Stack result:', deleteResult);
      cfnResult = {
        status: deleteResult.status == 'DELETE_STARTED' ? 'started' : 'failed',
        error: deleteResult.error,
      };
    } else {
      const rollbackStack = rollbackStackTemplates.find((stack) => stack.stackId == stackArtifact.stackId);
      assert.ok(rollbackStack);

      const templateArg = await prepareCfnBody(rollbackStack!, cfnClient, region, credentials, stackArtifact);
      logger.debug('Prepared Stack body:', {
        'Template Body Present': templateArg.templateBody ? 'Yes' : 'No',
        'Template URL Present': templateArg.templateUrl ? 'Yes' : 'No',
      });

      logger.log('Stack Rollback: Update Started ');
      const rollbackResult = await updateStack(stackName, cfnClient, templateArg);
      logger.debug('Update Stack result:', rollbackResult);
      cfnResult = {
        status: rollbackResult.status == 'UPDATE_STARTED' ? 'started' : 'failed',
        error: rollbackResult.error,
      };
    }

    switch (cfnResult.status) {
      case 'skip':
        logger.log('Stack Rollback: No Changes detected, skipping rollback');
        pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
          stackId: stackArtifact.stackId,
          status: RollbackStatus.SKIP_NO_CHANGES,
        });
        break;

      case 'failed':
        logger.log('Stack Rollback: Failed for stack');
        logger.error(cfnResult.error);
        pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
          stackId: stackArtifact.stackId,
          status: RollbackStatus.ROLLBACK_FAILED,
        });
        break;

      case 'started':
        logger.log('Stack Rollback: Waiting for completion..');

        let stackStatus = await pollStackComplete(cfnClient, stackName);

        if (stackStatus?.toString().endsWith('_FAILED')) {
          logger.debug('Stack Status:', stackStatus?.toString());
          logger.debug('Stack Rollback Status:', RollbackStatus.ROLLBACK_FAILED);
          pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
            stackId: stackArtifact.stackId,
            status: RollbackStatus.ROLLBACK_FAILED,
          });
        } else if (stackStatus?.toString().endsWith('_COMPLETE')) {
          logger.debug('Stack Status:', stackStatus?.toString());
          logger.debug('Stack Rollback Status:', RollbackStatus.ROLLBACK_COMPLETE);
          pushAndPrintStackResult(stacksRolledBackStatus, deploymentOrder, {
            stackId: stackArtifact.stackId,
            status: RollbackStatus.ROLLBACK_COMPLETE,
          });
        }
        break;
    }
  }

  const failedStacks = stacksRolledBackStatus.filter(result => result.status === RollbackStatus.ROLLBACK_FAILED); //||    result.status === RollbackStatus.SKIP_ROLLBACK_CREATE_STACK
  if (failedStacks) {
    logger.log(`ROLLBACK FAILED. Some stacks did not rollback: ${failedStacks.map(f => f.stackId).join(', ')} and might require manual rollback.`);
  }

  return {
    stacksRolledBackStatus,
    success: failedStacks.length == 0,
  };
}


