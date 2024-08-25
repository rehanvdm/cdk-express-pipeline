import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import execa = /* eslint-disable @typescript-eslint/no-require-imports */ require('execa');
import * as util from '../../src/_test-helpers/utils';
import { deploy } from '../../src/cli/deploy';
import { Logger, LogLevel } from '../../src/cli/logger';
import { DeploymentStatus, Manifest, ManifestArtifact, ManifestArtifactDeployed } from '../../src/cli/manifest';
import { RollbackStack } from '../../src/cli/rollback';
import { extractOriginalArgs, OriginalArgs } from '../../src/cli/utils';

const logger = new Logger();
logger.init(LogLevel.DEFAULT);

/* https://github.com/swc-project/swc/issues/3843#issuecomment-1058826971 */
jest.mock('fs', () => {
  const actualModule = jest.requireActual('fs');
  return {
    __esModule: true,
    ...actualModule,
  };
});

describe('deploy - validate correct processing of cdk deploy', () => {
  const rawArgs = '--profile systanics-role-exported --exclusively --require-approval never --concurrency 10';
  const originalArgs: OriginalArgs = extractOriginalArgs('\'**\'', rawArgs);
  const args = {
    ...originalArgs,
  };

  const expectedCommand = 'cdk deploy \'**\' --profile systanics-role-exported --exclusively --require-approval never --concurrency 10';
  let execaCommand = '';

  const STACK_ID_A = 'Wave1_Stage1_StackA';
  const STACK_ID_B = 'Wave1_Stage1_StackB';
  const STACK_ID_C = 'Wave1_Stage1_StackC';
  const STACK_ID_D = 'Wave2_Stage1_StackD';
  const STACK_ID_E = 'Wave2_Stage1_StackE';
  const STACK_ID_F = 'Wave2_Stage1_StackF'; //Depends on StackE

  // continue to replace all hardcoded with these, because they do not match and stack F does not show its manifest in the expected

  const partialCdkConsoleOutput: string = `
 ✅  ${STACK_ID_A} (StackA) (no changes) // NO_CHANGES
 ✅  ${STACK_ID_B} (StackB)              // CREATE_STACK_SUCCESS
 ❌  ${STACK_ID_C} (StackC) failed:      // CREATE_STACK_FAILED
 ✅  ${STACK_ID_D} (StackD)              // UPDATE_STACK_SUCCESS
 ❌  ${STACK_ID_E} (StackE) failed:      // UPDATE_STACK_FAILED
 StackF NOT_DEPLOYED this is just a comment to show StackF presence // NOT_DEPLOYED
`;

  const mockManifest: Manifest = {
    version: '1.0',
    artifacts: {
      ...util.getMockStack(STACK_ID_A, 'StackA'), // NO_CHANGES
      ...util.getMockStack(STACK_ID_B, 'StackB'), // CREATE_STACK_SUCCESS - must not have a CFN stack before deploy, evaluate RollbackStack
      ...util.getMockStack(STACK_ID_C, 'StackC'), // CREATE_STACK_FAILED - must not have a CFN stack before deploy, evaluate RollbackStack
      ...util.getMockStack(STACK_ID_D, 'StackD'), // UPDATE_STACK_SUCCESS
      ...util.getMockStack(STACK_ID_E, 'StackE'), // UPDATE_STACK_FAILED
      ...util.getMockStack(STACK_ID_F, 'StackF'), // NOT_DEPLOYED - the CDK deploy output does not contain this stack
    },
  };

  /* The CDK defined stacks from the CloudAssembly */
  const mockManifestArtifacts: ManifestArtifact[] = [
    {
      ...mockManifest.artifacts[STACK_ID_A],
      stackId: STACK_ID_A,
    },
    {
      ...mockManifest.artifacts[STACK_ID_B],
      stackId: STACK_ID_B,
    },
    {
      ...mockManifest.artifacts[STACK_ID_C],
      stackId: STACK_ID_C,
    },
    {
      ...mockManifest.artifacts[STACK_ID_D],
      stackId: STACK_ID_D,
    },
    {
      ...mockManifest.artifacts[STACK_ID_E],
      stackId: STACK_ID_E,
    },
    {
      ...mockManifest.artifacts[STACK_ID_F],
      stackId: STACK_ID_F,
    },
  ];

  /* The CFN Stacks saved before synth */
  const rollbackStacks: RollbackStack[] = [
    {
      stackId: STACK_ID_A,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_A}.template.json`,
      rollbackTemplateSize: 1,
    },
    // Create Success, stack does not exist before deploy
    {
      stackId: STACK_ID_B,
      hasRollbackTemplate: false,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_B}.template.json`,
      rollbackTemplateSize: 0,
    },
    // Create Failed, stack does not exist before deploy
    {
      stackId: STACK_ID_C,
      hasRollbackTemplate: false,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_C}.template.json`,
      rollbackTemplateSize: 0,
    },
    {
      stackId: STACK_ID_D,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_D}.template.json`,
      rollbackTemplateSize: 1,
    },
    {
      stackId: STACK_ID_E,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_E}.template.json`,
      rollbackTemplateSize: 1,
    },
    {
      stackId: STACK_ID_F,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_F}.template.json`,
      rollbackTemplateSize: 1,
    },
  ];

  /* The expected outcome of deploy(...) */
  const mockManifestArtifactsDeployed: ManifestArtifactDeployed[] = [
    {
      ...mockManifest.artifacts[STACK_ID_A],
      stackId: STACK_ID_A,
      status: DeploymentStatus.SKIPPED_NO_CHANGES,
    },

    {
      ...mockManifest.artifacts[STACK_ID_B],
      stackId: STACK_ID_B,
      status: DeploymentStatus.CREATE_STACK_SUCCESS,
    },
    {
      ...mockManifest.artifacts[STACK_ID_C],
      stackId: STACK_ID_C,
      status: DeploymentStatus.CREATE_STACK_FAILED,
    },

    {
      ...mockManifest.artifacts[STACK_ID_D],
      stackId: STACK_ID_D,
      status: DeploymentStatus.UPDATE_STACK_SUCCESS,
    },
    {
      ...mockManifest.artifacts[STACK_ID_E],
      stackId: STACK_ID_E,
      status: DeploymentStatus.UPDATE_STACK_FAILED,
    },
    {
      ...mockManifest.artifacts[STACK_ID_F],
      stackId: STACK_ID_F,
      status: DeploymentStatus.NOT_DEPLOYED,
    },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();

    execaCommand = '';
    jest.spyOn(execa, 'command').mockImplementation((command) => {
      execaCommand = command;
      return Promise.resolve({
        all: partialCdkConsoleOutput,
      }) as any;
    });

    jest.spyOn(STSClient.prototype, 'send').mockImplementation((command) => {
      if (command instanceof AssumeRoleCommand) {
        return Promise.resolve({
          Credentials: {
            AccessKeyId: 'mockAccessKeyId',
            SecretAccessKey: 'mockSecretAccessKey',
            SessionToken: 'mockSessionToken',
            Expiration: new Date(),
          },
        });
      }
      throw new Error('Unrecognized command in Mock STSClient');
    });
  });

  test('deploy', async () => {
    const manifestDeployed = await deploy(args, mockManifestArtifacts, rollbackStacks);
    expect(execaCommand).toEqual(expectedCommand);

    /* Compare one by one as the order of these are not the same */
    const stackIds = mockManifestArtifacts.map((artifact) => artifact.stackId);
    for (const stackId of stackIds) {
      const manifestDeployedStack = manifestDeployed.find((artifact) => artifact.stackId === stackId)!;
      const mockManifestArtifactsDeployedStack = mockManifestArtifactsDeployed.find((artifact) => artifact.stackId === stackId);
      expect(manifestDeployedStack).toEqual(mockManifestArtifactsDeployedStack);
    }
  });
});


