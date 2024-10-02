#!/usr/bin/env node
import * as fs from 'fs';
import { Command } from 'commander';
import { deploy } from './deploy';
import { Logger, LogLevel } from './logger';
import { getManifestStackArtifacts } from './manifest';
import { rollBack, RollbackStatus, saveCurrentCfnTemplates } from './rollback';
import { synth } from './synth';
import { extractOriginalArgs, printWavesDeployStatus, printWavesRollbackStatus } from './utils';
import { DeploymentOrderWave } from '../utils';

const logger = new Logger();


function getDeploymentOrder(): DeploymentOrderWave[] {
  if (!fs.existsSync('.cdk-express-pipeline/deployment-order.json')) {
    throw new Error('Deployment order file at `.cdk-express-pipeline/deployment-order.json` does not exist. Run `synth` first.');
  }
  const wavesFile = fs.readFileSync('.cdk-express-pipeline/deployment-order.json', 'utf8');
  return JSON.parse(wavesFile) as DeploymentOrderWave[];
}

async function main() {
  const program = new Command();
  program
    .command('deploy <pattern> [extraArgs...]')
    .description('Deploy command with pattern and extra arguments')
    .option('--debug')
    .action(async (pattern: string, extraArgs: string[], opts: { [optName: string]: any }) => {

      if (opts.debug === true) {
        logger.init(LogLevel.DEBUG);
      } else {
        logger.init(LogLevel.DEFAULT);
      }

      let rawArgs = extraArgs.join(' ');
      if (rawArgs.includes('--all')) {
        pattern = '**';
      }

      const argsOriginal = extractOriginalArgs(pattern, rawArgs);
      if (!argsOriginal.requireApproval || argsOriginal.requireApproval != 'never') {
        throw new Error('CDK Express Pipeline `deploy` requires argument `--require-approval never`');
      }

      if (!argsOriginal.exclusively) {
        throw new Error('CDK Express Pipeline `deploy` requires argument `--exclusively`');
      }

      if (argsOriginal.progress && argsOriginal.progress != 'events') {
        throw new Error('CDK Express Pipeline `deploy` requires argument `--progress events`');
      } else if (!argsOriginal.progress) {
        argsOriginal.progress = 'events';
        argsOriginal.raw += ' --progress events';
      }

      logger.log('Synthesizing CDK app');
      const args = await synth(argsOriginal);
      const deploymentOrder = getDeploymentOrder();
      logger.debug('args:', args);
      logger.debug('deploymentOrder:', deploymentOrder);

      logger.log('Getting stack artifacts from manifest');
      const stackArtifacts = getManifestStackArtifacts(args);
      logger.debug('stackArtifacts:', stackArtifacts);

      logger.log('Saving CloudFormation templates before deployment');
      const rollbackStackTemplates = await saveCurrentCfnTemplates(args, stackArtifacts);
      logger.debug('rollbackStackTemplates:', rollbackStackTemplates);

      logger.log('Deploying CDK stacks');
      const deployedStackArtifacts = await deploy(args, stackArtifacts, rollbackStackTemplates, deploymentOrder);
      logger.debug('deployedStackArtifacts:', deployedStackArtifacts);
      printWavesDeployStatus(deploymentOrder, deployedStackArtifacts);

      logger.log('Checking for failed stacks and rolling back if necessary');
      const stacksRolledBackStatus = await rollBack(deployedStackArtifacts, rollbackStackTemplates, args, deploymentOrder);
      logger.log('Rollback complete');
      printWavesRollbackStatus(deploymentOrder, stacksRolledBackStatus);

      const failedStacks = stacksRolledBackStatus.filter(result => result.status === RollbackStatus.ROLLBACK_FAILED ||
        result.status === RollbackStatus.SKIP_CFN_ROLLED_BACK);
      if (failedStacks) {
        logger.log('Some stacks failed to rollback. Please check the logs above and manually rollback the stacks that failed.');
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main().catch(err => console.error(err));
