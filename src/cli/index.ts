#!/usr/bin/env node
import { Command } from 'commander';
import { deploy } from './deploy';
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
      let rawArgs = extraArgs.join(' ');
      if (rawArgs.includes('--all')) {
        pattern = '"**"';
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
      const stackArtifacts = getManifestStackArtifacts(args);
      const rollbackStackTemplates = await saveCurrentCfnTemplates(args, stackArtifacts);
      const deployedStackArtifacts = await deploy(args, stackArtifacts);
      await rollBack(deployedStackArtifacts, rollbackStackTemplates, args);
    });

  program.parse(process.argv);
}

main().catch(err => console.error(err));
