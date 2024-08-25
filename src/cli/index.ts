#!/usr/bin/env node
import { Command } from 'commander';
import { deploy } from './deploy';
import { Logger, LogLevel } from './logger';
import { getManifestStackArtifacts } from './manifest';
import { rollBack, saveCurrentCfnTemplates } from './rollback';
import { synth } from './synth';
import { extractOriginalArgs } from './utils';

async function main() {
  const program = new Command();
  program
    .command('deploy <pattern> [extraArgs...]')
    .description('Deploy command with pattern and extra arguments')
    .action(async (pattern: string, extraArgs: string[]) => {
      // const logger = Logger.init(LogLevel.TRACE);
      // const logger = Logger.init(LogLevel.DEBUG);
      const logger = Logger.init(LogLevel.DEFAULT);

      logger.debug('pattern: ', pattern);
      logger.debug('extraArgs: ', extraArgs);

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

      let args = await synth(argsOriginal);
      logger.debug('args: ', args);

      const stackArtifacts = getManifestStackArtifacts(args);
      logger.debug('stackArtifacts: ', stackArtifacts);

      const rollbackStackTemplates = await saveCurrentCfnTemplates(args, stackArtifacts);
      logger.debug('rollbackStackTemplates: ', rollbackStackTemplates);

      const deployedStackArtifacts = await deploy(args, stackArtifacts, rollbackStackTemplates);
      logger.debug('deployedStackArtifacts: ', deployedStackArtifacts);

      const stacksRolledBackStatus = await rollBack(deployedStackArtifacts, rollbackStackTemplates, args);
      logger.debug('stacksRolledBackStatus:', JSON.stringify(stacksRolledBackStatus, null, 2));
    });

  program.parse(process.argv);
}

main().catch(err => console.error(err));
