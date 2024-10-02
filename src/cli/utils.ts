import * as assert from 'assert';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import chalk = /* eslint-disable @typescript-eslint/no-require-imports */ require('chalk');
import { Logger } from './logger';
import { DeploymentStatus, ManifestArtifactDeployed } from './manifest';
import { RollbackStatus, RolledBackStackResult } from './rollback';
import { DeploymentOrderStack, DeploymentOrderStage, DeploymentOrderWave, getStackPatternToFilter, targetIdentifier } from '../utils';

const logger = new Logger();

function extractOriginalArgValue(extractArg: string, arg: string): string | undefined {
  if (!arg.includes(extractArg)) {
    return undefined;
  }
  return arg.split(extractArg)[1].split(/=|\s/)[1].trim();
}

export type OriginalArgs = {
  /**
   * The original string arguments passed to the CLI
   */
  raw: string;

  /**
   The stack selection filter pattern
   */
  pattern?: string;

  /**
   * The --app flag value
   */
  assemblyPath?: string;

  /**
   * The --profile flag value
   */
  profile?: string;

  /**
   * The --require-approval flag value
   */
  requireApproval?: string;


  /**
   * Indicates the presence of the --exclusively flag present
   */
  exclusively?: boolean;

  /**
   * The --concurrency flag value
   */
  concurrency?: number;

  /**
   * The --progress flag value
   */
  progress?: string;
}

/**
 * Extract the original arguments from the extraArgs string passed to the CLI
 * @param originalArgs
 */
export function extractOriginalArgs(pattern: string, originalArgs: string): OriginalArgs {
  return {
    raw: originalArgs,
    pattern: pattern,
    assemblyPath: extractOriginalArgValue('--app', originalArgs),
    profile: extractOriginalArgValue('--profile', originalArgs),
    requireApproval: extractOriginalArgValue('--require-approval', originalArgs),
    exclusively: originalArgs.includes('--exclusively'),
    concurrency: parseInt(extractOriginalArgValue('--concurrency', originalArgs) || '1'),
    progress: extractOriginalArgValue('--progress', originalArgs),
  };
}

export type AssumedRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export async function assumeRoleAndGetCredentials(region: string, profile: string | undefined, roleArn: string): Promise<AssumedRoleCredentials> {
  const stsClient = new STSClient({
    region,
    credentials: profile ? fromIni({ profile: profile }) : undefined,
  });
  // use profile systanics-role-exported
  const stsRole = await stsClient.send(new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: 'cdk-express-pipeline--save-templates',
    DurationSeconds: 3600,
  }));

  if (!stsRole.Credentials || !stsRole.Credentials.AccessKeyId || !stsRole.Credentials.SecretAccessKey || !stsRole.Credentials.SessionToken) {
    throw new Error(`Can not assume role ${roleArn}`);
  }

  return {
    accessKeyId: stsRole.Credentials.AccessKeyId,
    secretAccessKey: stsRole.Credentials.SecretAccessKey,
    sessionToken: stsRole.Credentials.SessionToken,
  };
}

/**
 * Returns the PATH env variable prepended by the local node_modules/.bin directory. This is useful for running packages installed locally
 * before global packages.
 */
export function getLocalPackagesPreferredPath() {
  let pathEnvSeparator = process.platform === 'win32' ? ';' : ':';
  return process.env.PATH = `${process.cwd()}/mode_modules/.bin${pathEnvSeparator}${process.env.PATH}`;
}


function printDeploymentOrderWaves(waves: DeploymentOrderWave[]) {

  function printStackDependencies(stack: DeploymentOrderStack, indentationLevel: number, targetCharacter: string) {
    const colorStack = stack.deployStatus ? chalk.strikethrough : (noOp: any) => noOp;
    const colorTarget = targetCharacter.trim().length === 0 ? chalk.dim.grey : (noOp: any) => noOp;
    console.log(colorTarget(`${targetCharacter} ${' '.repeat(indentationLevel)} ↳ ` + colorStack(stack.stackName)));

    for (let dependantStack of stack.dependencies) {
      printStackDependencies(dependantStack, indentationLevel + 1, targetCharacter);
    }
  }

  function targetStatusCharacter(deploymentOrderStack: DeploymentOrderStack) {
    if (deploymentOrderStack.rollbackStatus) {
      switch (deploymentOrderStack.rollbackStatus) {
        case RollbackStatus.SKIP_CFN_ROLLED_BACK:
        case RollbackStatus.ROLLBACK_COMPLETE:
          return '✅';

        case RollbackStatus.SKIP_ROLLBACK_CREATE_STACK:
        case RollbackStatus.SKIP_NO_CHANGES:
        case RollbackStatus.SKIP_NOT_DEPLOYED:
          return '〇';

        case RollbackStatus.ROLLBACK_FAILED:
          return '❌';
      }
    }

    if (deploymentOrderStack.deployStatus) {
      switch (deploymentOrderStack.deployStatus) {
        case DeploymentStatus.CREATE_STACK_SUCCESS:
        case DeploymentStatus.UPDATE_STACK_SUCCESS:
          return '✅';

        case DeploymentStatus.SKIPPED_NO_CHANGES:
        case DeploymentStatus.NOT_DEPLOYED:
          return '〇';

        case DeploymentStatus.CREATE_STACK_FAILED:
        case DeploymentStatus.UPDATE_STACK_FAILED:
          return '❌';
      }
    }

    return '  ';
  }

  const patternToFilter = getStackPatternToFilter();
  for (const wave of waves) {
    const targetWave = targetIdentifier(patternToFilter, wave.id);
    const waveTargetCharacter = targetWave ? '|' : ' ';

    const waveTotalStages = wave.stages.length;
    const waveTotalStagesDeployed = wave.stages.filter(stage =>
      (stage.stacks.filter(stack => stack.deployStatus).length == stage.stacks.length)).length;
    const waveProgress = targetWave ? `(${waveTotalStagesDeployed}/${waveTotalStages})` : '';

    const colorWave = targetWave ? chalk.reset : chalk.dim.grey;
    console.log(colorWave(`${waveTargetCharacter} 🌊 ${wave.id} ${waveProgress}`));

    for (const stage of wave.stages) {
      const fullStageId = `${wave.id}${wave.separator}${stage.id}`;
      const targetStage = targetIdentifier(patternToFilter, fullStageId);
      const stageTargetCharacter = targetStage ? '|  ' : '   ';

      const stageTotalStacks = stage.stacks.length;
      const stageTotalStacksDeployed = stage.stacks.filter(stack => stack.deployStatus).length;
      const stageProgress = targetStage ? `(${stageTotalStacksDeployed}/${stageTotalStacks})` : ''; // if stageTargetCharacter empty do not print

      const colorStage = targetStage ? chalk.reset : chalk.dim.grey;
      console.log(colorStage(`${stageTargetCharacter} 🔲 ${stage.id} ${stageProgress}`));

      for (const stack of stage.stacks) {
        const targetStack = targetIdentifier(patternToFilter, stack.id);
        const stackTargetCharacter = targetStack ? '|    ' : '     ';

        const stackStatusCharacter = targetStatusCharacter(stack);
        const colorStack = targetStack ? chalk.reset : chalk.dim.grey;
        console.log(colorStack(`${stackTargetCharacter} ${stackStatusCharacter}` + ` ${stack.stackName} (${stack.id})`));

        for (let dependantStack of stack.dependencies) {
          const originalStack = waves
            .flatMap(waveDep => waveDep.stages)
            .flatMap(stageDep => stageDep.stacks)
            .find(stackDep => stackDep.id === dependantStack.id);
          assert.ok(originalStack);

          printStackDependencies(dependantStack, 2, stackTargetCharacter);
        }
      }
    }
  }
  console.log('');
}

export function printWavesDeployStatus(deploymentOrder: DeploymentOrderWave[], manifestArtifactDeployed: ManifestArtifactDeployed[]) {
  logger.log('==============');
  logger.log('DEPLOY STATUS:');
  logger.log('==============');

  const deploymentOrderResult: DeploymentOrderWave[] = deploymentOrder.map(wave => {
    const stages: DeploymentOrderStage[] = wave.stages.map(stage => {
      const stacks: DeploymentOrderStack[] = stage.stacks.map(stack => {
        const dependencies = stack.dependencies.map(dependantStack => {
          const dependantStackResult = manifestArtifactDeployed.find(result => result.stackId === dependantStack.id);
          return {
            id: dependantStack.id,
            stackName: dependantStack.stackName,
            dependencies: [],
            deployStatus: dependantStackResult?.status,
          };
        });
        const dependantStackResult = manifestArtifactDeployed.find(result => result.stackId === stack.id);
        return {
          id: stack.id,
          stackName: stack.stackName,
          dependencies,
          deployStatus: dependantStackResult?.status,
        };
      });
      return {
        id: stage.id,
        stacks,
      };
    });
    return {
      id: wave.id,
      separator: wave.separator,
      stages,
    };
  });

  printDeploymentOrderWaves(deploymentOrderResult);
}

export function printWavesRollbackStatus(deploymentOrder: DeploymentOrderWave[], rolledBackResults: RolledBackStackResult[]) {
  logger.log('================');
  logger.log('ROLLBACK STATUS:');
  logger.log('================');

  // Enrich the deploymentOrderWave with the rollbackResults
  const deploymentOrderResult: DeploymentOrderWave[] = deploymentOrder.map(wave => {
    const stages: DeploymentOrderStage[] = wave.stages.map(stage => {
      const stacks: DeploymentOrderStack[] = stage.stacks.map(stack => {
        const dependencies = stack.dependencies.map(dependantStack => {
          const dependantStackResult = rolledBackResults.find(result => result.stackId === dependantStack.id);
          return {
            id: dependantStack.id,
            stackName: dependantStack.stackName,
            dependencies: [],
            rollBackStatus: dependantStackResult?.status,
          };
        });
        const dependantStackResult = rolledBackResults.find(result => result.stackId === stack.id);
        return {
          id: stack.id,
          stackName: stack.stackName,
          dependencies,
          rollbackStatus: dependantStackResult?.status,
        };
      });
      return {
        id: stage.id,
        stacks,
      };
    });
    return {
      id: wave.id,
      separator: wave.separator,
      stages,
    };
  });

  printDeploymentOrderWaves(deploymentOrderResult);
  console.log('');
}
