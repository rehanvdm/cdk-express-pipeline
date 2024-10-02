// eslint-disable-next-line @typescript-eslint/no-require-imports
import execa = require('execa');
import { Logger } from './logger';
import { DeploymentStatus, ManifestArtifact, ManifestArtifactDeployed } from './manifest';
import { RollbackStack } from './rollback';
import { getLocalPackagesPreferredPath, OriginalArgs, printWavesDeployStatus } from './utils';
import { DeploymentOrderWave } from '../utils';

const logger = new Logger();

function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B\[\d{1,2}m/g, '');
}

function processExecaOutput(completedStacks: ManifestArtifactDeployed[], outputLines: string[],
  stackArtifacts: ManifestArtifact[], rollbackStacks: RollbackStack[],
  deploymentOrder: DeploymentOrderWave[]) {

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
      printWavesDeployStatus(deploymentOrder, completedStacks);
    }
  }

  return completedStacks;
}


export async function deploy(args: OriginalArgs, stackArtifacts: ManifestArtifact[], rollbackStacks: RollbackStack[],
  deploymentOrder: DeploymentOrderWave[]) {

  const argument = `cdk deploy "${args.pattern}" ${args.raw}`;
  logger.log('CDK Deploy command:', argument);

  let completedStacks: ManifestArtifactDeployed[] = [];
  const subprocess = execa.command(argument, {
    env: {
      ...process.env,
      FORCE_COLOR: 'true',
      PATH: getLocalPackagesPreferredPath(),
    },
    preferLocal: true, // Strange bug where this only works for this package but not for a client using the library, hence we fix this above with `getLocalPackagesPreferredPath`
    reject: false,
    shell: true,
    all: true,
  });
  subprocess.all?.on('data', (data) => {
    process.stdout.write(data);
    const outputLines = stripAnsiCodes(data.toString()).split('\n');
    completedStacks = processExecaOutput(completedStacks, outputLines, stackArtifacts, rollbackStacks, deploymentOrder);
  });
  const excaFullResponse = await subprocess;
  if (process.env.NODE_ENV === 'test') {
    /* Can not mock streaming that easy, get all as if streamed */
    process.stdout.write(excaFullResponse.all!.toString());
    const outputLines = stripAnsiCodes(excaFullResponse.all!.toString()).split('\n');
    completedStacks = processExecaOutput(completedStacks, outputLines, stackArtifacts, rollbackStacks, deploymentOrder);
  }


  const completedStackIds = completedStacks.map((stack) => stack.stackId);
  for (const stackArtifact of stackArtifacts) {
    if (!completedStackIds.includes(stackArtifact.stackId)) {
      completedStacks.push({
        ...stackArtifact,
        status: DeploymentStatus.NOT_DEPLOYED,
      });
      printWavesDeployStatus(deploymentOrder, completedStacks);
    }
  }
  return completedStacks;
}


