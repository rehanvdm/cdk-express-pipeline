import * as fs from 'fs';
import { CloudFormationClient, GetTemplateCommand, GetTemplateCommandOutput } from '@aws-sdk/client-cloudformation';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { Manifest, ManifestArtifact } from '../../src/cli/manifest';
import { saveCurrentCfnTemplates } from '../../src/cli/rollback';
import { extractOriginalArgs, OriginalArgs } from '../../src/cli/utils';

/* https://github.com/swc-project/swc/issues/3843#issuecomment-1058826971 */
jest.mock('fs', () => {
  const actualModule = jest.requireActual('fs');
  return {
    __esModule: true,
    ...actualModule,
  };
});

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

describe('saveCurrentCfnTemplates', () => {
  const mockManifest: Manifest = {
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
      Wave2_Stage1_StackC: {
        type: 'aws:cloudformation:stack',
        environment: 'aws://123456789123/eu-west-1',
        properties: {
          requiresBootstrapStackVersion: 1,
          bootstrapStackVersionSsmParameter: 'parameter',
          templateFile: 'Wave2_Stage1_StackC.template.json',
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
          stackName: 'StackC',
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
    {
      ...mockManifest.artifacts.Wave2_Stage1_StackC,
      stackId: 'Wave2_Stage1_StackC',
    },
  ];

  const stackContents: { [stackName: string]: string } = {
    StackA: JSON.stringify({
      Resources: {
        MyBucket: {
          Type: 'AWS::S3::Bucket',
        },
      },
    }),
    StackB: JSON.stringify({
      Resources: {
        Topic: {
          Type: 'AWS::SNS::Topic',
        },
        AnotherTopic: {
          Type: 'AWS::SNS::Topic',
        },
      },
    }),
  };

  const rawArgs = '--profile systanics-role-exported --exclusively --require-approval never --concurrency 10';
  const originalArgs: OriginalArgs = extractOriginalArgs('\'**\'', rawArgs);
  /* Created after Synth */
  const args = {
    ...originalArgs,
    rawArgs: rawArgs + ' --app ./.cdk-express-pipeline/rollback',
    assemblyPath: './.cdk-express-pipeline/rollback',
  };

  let files: { [fileName: string]: string } = {};
  beforeEach(() => {
    jest.restoreAllMocks();

    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      if (args.assemblyPath !== path) {
        throw new Error(`existsSync: Path does not match. Expected: ${args.assemblyPath}, Received: ${path}`);
      }
      return false; /* To test the branching if rm and mkdir */
    });
    jest.spyOn(fs, 'rmSync').mockImplementation((dir) => {
      if (args.assemblyPath !== dir) {
        throw new Error(`rmSync: Path does not match. Expected: ${args.assemblyPath}, Received: ${dir}`);
      }
    });
    jest.spyOn(fs, 'mkdirSync').mockImplementation((path) => {
      if (args.assemblyPath !== path) {
        throw new Error(`mkdirSync: Path does not match. Expected: ${args.assemblyPath}, Received: ${path}`);
      }
      return undefined;
    });

    jest.spyOn(fs, 'writeFileSync').mockImplementation((path, data) => {
      files[path.toString()] = data.toString();
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
      throw new Error(`Unrecognized command: ${command}`);
    });

    jest.spyOn(CloudFormationClient.prototype, 'send').mockImplementation((command): Promise<GetTemplateCommandOutput> => {
      if (command instanceof GetTemplateCommand) {
        const stackTemplateBody = stackContents[command.input.StackName!];
        if (!stackTemplateBody) {
          throw new ValidationError(`Stack ${command.input.StackName} does not exist.`);
        }
        return Promise.resolve({
          TemplateBody: JSON.stringify(stackTemplateBody),
          $metadata: {},
        });
      }
      throw new Error(`Unrecognized command: ${command}`);
    });
  });

  test('save stack templates', async () => {
    const rollbackStackTemplates = await saveCurrentCfnTemplates(args, mockManifestArtifacts);
    expect(rollbackStackTemplates).toEqual([
      {
        stackId: mockManifestArtifacts[0].stackId,
        hasRollbackTemplate: true,
        rollbackTemplatePath: `${args.assemblyPath}/${mockManifestArtifacts[0].stackId}.template.json`,
        rollbackTemplateSize: 66,
      },
      {
        stackId: mockManifestArtifacts[1].stackId,
        hasRollbackTemplate: true,
        rollbackTemplatePath: `${args.assemblyPath}/${mockManifestArtifacts[1].stackId}.template.json`,
        rollbackTemplateSize: 111,
      },
      {
        stackId: mockManifestArtifacts[2].stackId,
        hasRollbackTemplate: false,
        rollbackTemplatePath: `${args.assemblyPath}/${mockManifestArtifacts[2].stackId}.template.json`,
        rollbackTemplateSize: 0,
      },
    ]);
  });
});


//TODO: rollback