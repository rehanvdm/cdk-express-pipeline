// eslint-disable-next-line @typescript-eslint/no-require-imports
import execa = require('execa');
import { DeploymentStatus, ManifestArtifact, ManifestArtifactDeployed } from './manifest';
import { OriginalArgs } from './utils';


function stripAnsiCodes(str: string): string {
  return str.replace(/\x1B\[\d{1,2}m/g, '');
}

export async function deploy(args: OriginalArgs, stackArtifacts: ManifestArtifact[]) {
  const argument = `cdk deploy ${args.pattern} ${args.raw}`;
  console.log('Argument:', argument);

  const subprocess = execa.command(argument, {
    env: {
      ...process.env,
      FORCE_COLOR: 'true',
    },
    preferLocal: true,
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
    let stackArtifact = stackArtifacts.find((artifact) => artifact.stackId === stackId);

    if (line.includes(' ✅  ') && !line.includes('(no changes)')) {
      stackId = line.split(' ✅  ')[1].split(' (')[0];
      stackArtifact = stackArtifacts.find((artifact) => artifact.stackId === stackId);
      if (stackArtifact) {
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
      stackArtifact = stackArtifacts.find((artifact) => artifact.stackId === stackId);
      if (stackArtifact) {
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
