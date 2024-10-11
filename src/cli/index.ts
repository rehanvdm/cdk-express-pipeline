#!/usr/bin/env node
import * as fs from 'fs';
import { Command } from 'commander';
import { deploy, deploySynth } from './deploy';
import { diff } from './diff';
import { Logger, LogLevel } from './logger';
import { getManifestStackArtifacts } from './manifest';
import { rollBack, saveCurrentCfnTemplates, translateDeploymentToRollback } from './rollback';
import { synth } from './synth';
import { extractOriginalArgs } from './utils';
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
    .command('diff')
    .description('The standard `cdk diff` command, added for convenience and consistency')
    .usage(' \'**\' --diff -- --profile OPTIONAL_YOUR_AWS_PROFILE')
    .argument('<pattern>', 'The CDK pattern to diff')
    .argument('[extraCdkArgs...]', 'Extra arguments to be passed to the CDK command with `--`, example: `-- --profile YOUR_AWS_PROFILE  --app ./.cdk-express-pipeline/assembly`')
    .option('--debug', 'Outputs extra debugging messages')
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

      await diff(pattern, rawArgs);
    });

  program
    .command('synth')
    .description('The standard `cdk synth` command, added for convenience and consistency')
    .usage(' \'**\' --synth -- --profile OPTIONAL_YOUR_AWS_PROFILE')
    .argument('<pattern>', 'The CDK pattern to synth')
    .argument('[extraCdkArgs...]', 'Extra arguments to be passed to the CDK command with `--`, example: `-- --profile YOUR_AWS_PROFILE --output .cdk-express-pipeline/assembly`')
    .option('--debug', 'Outputs extra debugging messages')
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

      await synth(pattern, rawArgs);
    });

  program
    .command('deploy')
    .description('CDK Deploy command that also rolls back all stacks if a stack fails within the <pattern>')
    .usage(' \'**\' --debug -- --profile OPTIONAL_YOUR_AWS_PROFILE --exclusively --require-approval never --concurrency 10')
    .argument('<pattern>', 'The CDK pattern to deploy')
    .argument('[extraCdkArgs...]', 'Extra arguments to be passed to the CDK command with `--`, example: `-- --profile YOUR_AWS_PROFILE --output .cdk-express-pipeline/assembly`')
    .option('--debug', 'Outputs extra debugging messages')
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


      console.log('');
      console.log('===============================');
      console.log('========== PREPARING ==========');
      console.log('===============================');
      console.log('');
      logger.log('Checking cloud assembly');
      const args = await deploySynth(argsOriginal);
      const deploymentOrder = getDeploymentOrder();
      logger.debug('args:', args);
      logger.debug('deploymentOrder:', deploymentOrder);

      logger.log('Getting stack artifacts from manifest');
      const stackArtifacts = getManifestStackArtifacts(args);
      logger.debug('stackArtifacts:', stackArtifacts);

      logger.log('Saving CloudFormation templates for rollback');
      const rollbackStackTemplates = await saveCurrentCfnTemplates(args, stackArtifacts);
      logger.debug('rollbackStackTemplates:', rollbackStackTemplates);

      console.log('');
      console.log('===============================');
      console.log('========== DEPLOYING ==========');
      console.log('===============================');
      console.log('');
      const deployedStackArtifacts = await deploy(args, stackArtifacts, rollbackStackTemplates, deploymentOrder);
      logger.debug('deployedStackArtifacts:', deployedStackArtifacts);
      const shouldRollback = deployedStackArtifacts.some((stack) => translateDeploymentToRollback(stack.status).rollback);
      if (shouldRollback) {
        console.log('');
        console.log('==================================');
        console.log('========== ROLLING BACK ==========');
        console.log('==================================');
        console.log('');
        const { success } = await rollBack(deployedStackArtifacts, rollbackStackTemplates, args, deploymentOrder);
        logger.debug('Rollback complete');
        if (!success) {
          process.exit(1);
        }
      } else {
        logger.log('No stacks need to be rolled back');
      }

    });

  program.parse(process.argv);
}

main().catch(err => console.error(err));
