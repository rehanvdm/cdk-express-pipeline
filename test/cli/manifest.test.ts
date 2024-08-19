import * as fs from 'fs';
import { getManifestStackArtifactProperties, getManifestStackArtifacts, Manifest, ManifestArtifact } from '../../src/cli/manifest';
import { extractOriginalArgs, OriginalArgs } from '../../src/cli/utils';

/* https://github.com/swc-project/swc/issues/3843#issuecomment-1058826971 */
jest.mock('fs', () => {
  const actualModule = jest.requireActual('fs');
  return {
    __esModule: true,
    ...actualModule,
  };
});

describe('Manifest functions', () => {
  let mockManifestArtifact: ManifestArtifact;

  beforeEach(() => {
    mockManifestArtifact = {
      stackId: 'stackId',
      type: 'aws:cloudformation:stack',
      properties: {
        requiresBootstrapStackVersion: 1,
        bootstrapStackVersionSsmParameter: 'parameter',
        templateFile: 'template',
        terminationProtection: true,
        validateOnSynth: true,
        assumeRoleArn: '${AWS::Partition}',
        cloudFormationExecutionRoleArn: 'arn',
        stackTemplateAssetObjectUrl: 'url',
        additionalDependencies: [],
        lookupRole: {
          arn: 'arn',
          requiresBootstrapStackVersion: 1,
          bootstrapStackVersionSsmParameter: 'parameter',
        },
        stackName: 'stackName',
      },
      environment: 'aws://account-id/region',
      metadata: {},
      displayName: 'displayName',
    };
  });

  test('getManifestStackArtifactProperties', () => {
    const result = getManifestStackArtifactProperties(mockManifestArtifact);
    expect(result).toEqual({
      stackId: 'stackId',
      stackName: 'stackName',
      region: 'region',
      assumeRole: 'aws',
    });
  });
});

describe('getManifestStackArtifacts', () => {
  let mockManifest: Manifest = {
    version: '1.0',
    artifacts: {
      Wave1_Stage1_StackA: {
        type: 'aws:cloudformation:stack',
        environment: 'aws://123456789123/eu-west-1',
        properties: {
          requiresBootstrapStackVersion: 1,
          bootstrapStackVersionSsmParameter: 'parameter',
          templateFile: 'Wave1_Stage1_StackA.template.json',
          terminationProtection: true,
          validateOnSynth: true,
          assumeRoleArn: 'arn:${AWS::Partition}:iam::123456789123:role/cdk-hnb659fds-deploy-role-581184285249-eu-west-1',
          cloudFormationExecutionRoleArn: 'arn',
          stackTemplateAssetObjectUrl: 'url',
          additionalDependencies: [],
          lookupRole: {
            arn: 'arn',
            requiresBootstrapStackVersion: 1,
            bootstrapStackVersionSsmParameter: 'parameter',
          },
          stackName: 'StackA',
        },
        metadata: {},
        displayName: 'Wave1_Stage1_StackA',
      },
      Wave2_Stage1_StackB: {
        type: 'aws:cloudformation:stack',
        environment: 'aws://123456789123/eu-west-1',
        properties: {
          requiresBootstrapStackVersion: 1,
          bootstrapStackVersionSsmParameter: 'parameter',
          templateFile: 'Wave2_Stage1_StackB.template.json',
          terminationProtection: true,
          validateOnSynth: true,
          assumeRoleArn: 'arn:${AWS::Partition}:iam::123456789123:role/cdk-hnb659fds-deploy-role-581184285249-eu-west-1',
          cloudFormationExecutionRoleArn: 'arn',
          stackTemplateAssetObjectUrl: 'url',
          additionalDependencies: [],
          lookupRole: {
            arn: 'arn',
            requiresBootstrapStackVersion: 1,
            bootstrapStackVersionSsmParameter: 'parameter',
          },
          stackName: 'StackB',
        },
        metadata: {},
        displayName: 'Wave2_Stage1_StackB',
      },
    },
  };

  const mockManifestArtifacts: ManifestArtifact[] = [
    {
      ...mockManifest.artifacts.Wave1_Stage1_StackA,
      stackId: 'Wave1_Stage1_StackA',
    },
    {
      ...mockManifest.artifacts.Wave2_Stage1_StackB,
      stackId: 'Wave2_Stage1_StackB',
    },
  ];

  const rawArgs = '--profile systanics-role-exported --app=cdk.out --exclusively --require-approval never --concurrency 10';

  beforeEach(() => {
    jest.restoreAllMocks();

    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
      if (filePath.toString().endsWith('/manifest.json')) {
        return JSON.stringify(mockManifest);
      }
      throw new Error('Mock file not found');
    });
  });

  test('returns all stacks when no pattern is provided', () => {
    const args: OriginalArgs = extractOriginalArgs('\'**\'', rawArgs);

    const result = getManifestStackArtifacts(args);
    expect(result).toEqual(mockManifestArtifacts);
  });

  test('returns matching stacks when a pattern is provided', () => {
    const args: OriginalArgs = extractOriginalArgs('Wave1_*', rawArgs);

    const result = getManifestStackArtifacts(args);
    expect(result).toEqual(mockManifestArtifacts.filter((artifact) => artifact.stackId.startsWith('Wave1_')));
  });
});