// eslint-disable-next-line @typescript-eslint/no-require-imports
import execa = require('execa');
import { Logger } from './logger';
import { DeploymentStatus, ManifestArtifact, ManifestArtifactDeployed } from './manifest';
import { RollbackStack } from './rollback';
import { etLocalPackagesPreferredPath, OriginalArgs } from './utils';

const logger = new Logger();

function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B\[\d{1,2}m/g, '');
}

export async function deploy(args: OriginalArgs, stackArtifacts: ManifestArtifact[], rollbackStacks: RollbackStack[]) {
  const argument = `cdk deploy "${args.pattern}" ${args.raw}`;
  logger.debug('CDK Deploy command: ', argument);

  const subprocess = execa.command(argument, {
    env: {
      ...process.env,
      FORCE_COLOR: 'true',
      PATH: etLocalPackagesPreferredPath(),
    },
    preferLocal: true, // Strange bug where this only works for this package but not for a client using the library, hence we fix this above with `getLocalPackagesPreferredPath`
    reject: false,
    shell: true,
    all: true,
  });
  subprocess.all?.on('data', (data) => {
    process.stdout.write(data);
  });

  const result = await subprocess;

  let completedStacks: ManifestArtifactDeployed[] = [];
  const outputLines = stripAnsiCodes(result.all!).split('\n');
  for (const line of outputLines) {

    let status: DeploymentStatus | undefined;
    let stackId: string | undefined;
    let stackArtifact: ManifestArtifact | undefined;
    let rollbackStack: RollbackStack | undefined;

    if (line.includes(' ✅  ') && !line.includes('(no changes)')) {
      stackId = line.split(' ✅  ')[1].split(' (')[0];
      stackArtifact = stackArtifacts.find((artifact) => artifact.stackId === stackId)!;
      rollbackStack = rollbackStacks.find((artifact) => artifact.stackId === stackId);
      if (rollbackStack?.hasRollbackTemplate) {
        status = DeploymentStatus.UPDATE_STACK_SUCCESS;
      } else {
        status = DeploymentStatus.CREATE_STACK_SUCCESS;
      }
    } else if (line.includes(' ✅  ') && line.includes('(no changes)')) {
      stackId = line.split(' ✅  ')[1].split(' (')[0];
      stackArtifact = stackArtifacts.find((artifact) => artifact.stackId === stackId)!;
      status = DeploymentStatus.SKIPPED_NO_CHANGES;
    } else if (line.includes(' ❌  ') && line.includes(') failed:')) {
      stackId = line.split(' ❌  ')[1].split(' (')[0];
      stackArtifact = stackArtifacts.find((artifact) => artifact.stackId === stackId)!;
      rollbackStack = rollbackStacks.find((artifact) => artifact.stackId === stackId);
      if (rollbackStack?.hasRollbackTemplate) {
        status = DeploymentStatus.UPDATE_STACK_FAILED;
      } else {
        status = DeploymentStatus.CREATE_STACK_FAILED;
      }
    }

    if (stackArtifact && status) {
      completedStacks.push({
        ...stackArtifact,
        status,
      });
    }
  }


  const completedStackIds = completedStacks.map((stack) => stack.stackId);
  for (const stackArtifact of stackArtifacts) {
    if (!completedStackIds.includes(stackArtifact.stackId)) {
      completedStacks.push({
        ...stackArtifact,
        status: DeploymentStatus.NOT_DEPLOYED,
      });
    }
  }
  return completedStacks;
}
