import * as fs from 'fs';
import {
  CloudFormationClient,
  DescribeStackEventsCommand,
  DescribeStackEventsCommandOutput,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
  GetTemplateCommand,
  GetTemplateCommandOutput,
  ResourceStatus,
  StackStatus,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import * as util from '../../src/_test-helpers/utils';
import { Logger, LogLevel } from '../../src/cli/logger';
import { DeploymentStatus, Manifest, ManifestArtifact, ManifestArtifactDeployed } from '../../src/cli/manifest';
import { contentHash, rollBack, RollbackStack, RollbackStatus, RolledBackStackResult, saveCurrentCfnTemplates } from '../../src/cli/rollback';
import { extractOriginalArgs, OriginalArgs } from '../../src/cli/utils';

const logger = new Logger();
logger.init(LogLevel.DEBUG);

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
      throw new Error('Unrecognized command in Mock STSClient');
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
      throw new Error('Unrecognized command in Mock CloudFormationClient');
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


describe('rollBack', () => {
  /**
   * A mock stack template that returns some JSON of a certain length
   * @param length Length in Bytes
   */
  function mockStackTemplateBody(length: number) {

    const jsonStr = (val: string) => `{ Name: ${val} }`;

    const emptyLength = jsonStr('').length;
    const remainingLength = length - emptyLength;
    const value = Array.from({ length: remainingLength }, () => 'A').join('');
    return jsonStr(value);
  };


  const rawArgs = '--profile systanics-role-exported --exclusively --require-approval never --concurrency 10';
  const originalArgs: OriginalArgs = extractOriginalArgs('\'**\'', rawArgs);
  const args = {
    ...originalArgs,
  };

  const CDK_ASSETS_BUCKET_NAME = 'cdk-hnb659fds-assets-123456789012-eu-west-1';
  const FULL_CDK_ASSETS_BUCKET = `https://${CDK_ASSETS_BUCKET_NAME}.s3.eu-west-1.amazonaws.com`;

  const STACK_ID_A = 'Wave1_Stage1_StackA';
  const STACK_ID_B = 'Wave1_Stage1_StackB';
  const STACK_ID_C = 'Wave1_Stage1_StackC';
  const STACK_ID_D = 'Wave2_Stage1_StackD';
  const STACK_ID_E = 'Wave2_Stage1_StackE';
  const STACK_ID_F = 'Wave2_Stage1_StackF'; // Depends on StackE
  const STACK_STATUSES = {
    [STACK_ID_A]: {
      deployment: DeploymentStatus.SKIPPED_NO_CHANGES,
      rollback: RollbackStatus.SKIP_NO_CHANGES,
    },
    [STACK_ID_B]: {
      deployment: DeploymentStatus.CREATE_STACK_SUCCESS,
      rollback: RollbackStatus.SKIP_ROLLBACK_CREATE_STACK,
    },
    [STACK_ID_C]: {
      deployment: DeploymentStatus.UPDATE_STACK_SUCCESS,
      rollback: RollbackStatus.ROLLBACK_COMPLETE,
    },
    [STACK_ID_D]: {
      deployment: DeploymentStatus.UPDATE_STACK_SUCCESS,
      rollback: RollbackStatus.ROLLBACK_COMPLETE,
    },
    [STACK_ID_E]: {
      deployment: DeploymentStatus.UPDATE_STACK_FAILED,
      rollback: RollbackStatus.SKIP_CFN_ROLLED_BACK,
    },
    [STACK_ID_F]: {
      deployment: DeploymentStatus.NOT_DEPLOYED,
      rollback: RollbackStatus.SKIP_NOT_DEPLOYED,
    },
  };
  const STACK_BODIES: { [stackId: string]: string } = {
    [STACK_ID_A]: mockStackTemplateBody(49_999),
    [STACK_ID_B]: mockStackTemplateBody(49_999),
    [STACK_ID_C]: mockStackTemplateBody(49_999),
    [STACK_ID_D]: mockStackTemplateBody(100_000),
    [STACK_ID_E]: mockStackTemplateBody(49_999),
    [STACK_ID_F]: mockStackTemplateBody(49_999),
  };
  const STACK_BODY_HASH: { [stackId: string]: string } = {
    [STACK_ID_D]: contentHash(STACK_BODIES[STACK_ID_D]),
  };
  const STACK_BODY_S3_KEY: { [stackId: string]: string } = {
    [STACK_ID_D]: `cdk-express-pipeline-rollback-stacks/${STACK_ID_D}/${STACK_BODY_HASH[STACK_ID_D]}.yml`,
  };
  const STACK_BODY_S3_FULL_PATH: { [stackId: string]: string } = {
    [STACK_ID_D]: `${FULL_CDK_ASSETS_BUCKET}/${STACK_BODY_S3_KEY[STACK_ID_D]}`,
  };


  const mockManifest: Manifest = {
    version: '1.0',
    artifacts: {
      ...util.getMockStack(STACK_ID_A, 'StackA'),
      ...util.getMockStack(STACK_ID_B, 'StackB'),
      ...util.getMockStack(STACK_ID_C, 'StackC'),
      ...util.getMockStack(STACK_ID_D, 'StackD'),
      ...util.getMockStack(STACK_ID_E, 'StackE'),
      ...util.getMockStack(STACK_ID_F, 'StackF'),
    },
  };

  /* The CFN Stacks saved before synth */
  const mockRolledBackStacks: RollbackStack[] = [
    {
      stackId: STACK_ID_A,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_A}.template.json`,
      rollbackTemplateSize: STACK_BODIES[STACK_ID_A].length,
    },
    // Create Success, stack does not exist before deploy
    {
      stackId: STACK_ID_B,
      hasRollbackTemplate: false,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_B}.template.json`,
      rollbackTemplateSize: STACK_BODIES[STACK_ID_B].length,
    },
    {
      stackId: STACK_ID_C,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_C}.template.json`,
      rollbackTemplateSize: STACK_BODIES[STACK_ID_C].length,
    },
    {
      stackId: STACK_ID_D,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_D}.template.json`,
      rollbackTemplateSize: STACK_BODIES[STACK_ID_D].length,
    },
    {
      stackId: STACK_ID_E,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_E}.template.json`,
      rollbackTemplateSize: STACK_BODIES[STACK_ID_E].length,
    },
    {
      stackId: STACK_ID_F,
      hasRollbackTemplate: true,
      rollbackTemplatePath: `${args.assemblyPath}/${STACK_ID_F}.template.json`,
      rollbackTemplateSize: STACK_BODIES[STACK_ID_F].length,
    },
  ];

  /* The manifest of Deployed Stacks passed to rollback */
  const mockManifestArtifactsDeployed: ManifestArtifactDeployed[] = [
    {
      ...mockManifest.artifacts[STACK_ID_A],
      stackId: STACK_ID_A,
      status: STACK_STATUSES[STACK_ID_A].deployment,
    },
    {
      ...mockManifest.artifacts[STACK_ID_B],
      stackId: STACK_ID_B,
      status: STACK_STATUSES[STACK_ID_B].deployment,
    },
    {
      ...mockManifest.artifacts[STACK_ID_C],
      stackId: STACK_ID_C,
      status: STACK_STATUSES[STACK_ID_C].deployment,
    },
    {
      ...mockManifest.artifacts[STACK_ID_D],
      stackId: STACK_ID_D,
      status: STACK_STATUSES[STACK_ID_D].deployment,
    },
    {
      ...mockManifest.artifacts[STACK_ID_E],
      stackId: STACK_ID_E,
      status: STACK_STATUSES[STACK_ID_E].deployment,
    },
    {
      ...mockManifest.artifacts[STACK_ID_F],
      stackId: STACK_ID_F,
      status: STACK_STATUSES[STACK_ID_F].deployment,
    },
  ];


  /* The expected outcome of rollback(...) */
  const mockRolledBackStacksResult: RolledBackStackResult[] = [
    {
      stackId: STACK_ID_A,
      status: STACK_STATUSES[STACK_ID_A].rollback,
    },
    {
      stackId: STACK_ID_B,
      status: STACK_STATUSES[STACK_ID_B].rollback,
    },
    {
      stackId: STACK_ID_C,
      status: STACK_STATUSES[STACK_ID_C].rollback,
    },
    {
      stackId: STACK_ID_D,
      status: STACK_STATUSES[STACK_ID_D].rollback,
    },
    {
      stackId: STACK_ID_E,
      status: STACK_STATUSES[STACK_ID_E].rollback,
    },
    {
      stackId: STACK_ID_F,
      status: STACK_STATUSES[STACK_ID_F].rollback,
    },
  ];

  /* The CFN update commands */
  type CfnUpdateCommands = {
    StackName: string;
    TemplateBody?: string;
    TemplateUrl?: string;
  };
  const mockCfnUpdateCommands: CfnUpdateCommands[] = [
    {
      StackName: 'StackD',
      TemplateBody: undefined,
      TemplateUrl: STACK_BODY_S3_FULL_PATH[STACK_ID_D],
    },
    {
      StackName: 'StackC',
      TemplateBody: STACK_BODIES[STACK_ID_C],
      TemplateUrl: undefined,
    },
  ];
  let cfnUpdateCommandsExpected: CfnUpdateCommands[] = [];

  type S3PutObjectCommands = {
    Bucket: string;
    Key: string;
    Body: string;
  };


  const mockS3PutObjectCommands: S3PutObjectCommands[] = [
    {
      Bucket: CDK_ASSETS_BUCKET_NAME,
      Key: STACK_BODY_S3_KEY[STACK_ID_D],
      Body: STACK_BODIES[STACK_ID_D],
    },
  ];
  let s3PutObjectCommandsExpected: S3PutObjectCommands[] = [];

  beforeEach(() => {
    jest.restoreAllMocks();

    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath) => {
      if (filePath.toString().endsWith('.template.json')) {
        const stackId = filePath.toString().split('/')[1].split('.').shift();
        return STACK_BODIES[stackId!];
      }
      throw new Error('Mock file not found');
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

    jest.spyOn(CloudFormationClient.prototype, 'send').mockImplementation((command) => {
      if (command instanceof UpdateStackCommand) {
        cfnUpdateCommandsExpected.push({
          StackName: command.input.StackName!,
          TemplateBody: command.input.TemplateBody,
          TemplateUrl: command.input.TemplateURL,
        });
        return Promise.resolve();
      } else if (command instanceof DescribeStackEventsCommand) {
        const now = new Date();
        const stackId = mockManifestArtifactsDeployed.find((artifact) => artifact.properties.stackName === command.input.StackName)!.stackId;

        const resp: Promise<DescribeStackEventsCommandOutput> = Promise.resolve({
          StackEvents: [
            {
              StackId: stackId,
              StackName: command.input.StackName!,
              EventId: '1',
              LogicalResourceId: 'MyBucket',
              PhysicalResourceId: 'MyBucket',
              ResourceType: 'AWS::S3::Bucket',
              ResourceStatus: ResourceStatus.CREATE_COMPLETE,
              Timestamp: new Date(now.getTime() + 5 * 1000),
            },
            {
              StackId: stackId,
              StackName: command.input.StackName!,
              EventId: '1',
              LogicalResourceId: 'MyBucket',
              PhysicalResourceId: 'MyBucket',
              ResourceType: 'AWS::S3::Bucket',
              ResourceStatus: ResourceStatus.CREATE_IN_PROGRESS,
              Timestamp: now,
            },
          ],
          nextToken: undefined, // TODO: Test paginate
          $metadata: {},
        });
        return resp;
      } else if (command instanceof DescribeStacksCommand) {

        if (command.input.StackName === 'CDKToolkit') {
          /* For getting the CDK owned bucket */
          const resp: Promise<DescribeStacksCommandOutput> = Promise.resolve({
            Stacks: [
              {
                StackId: 'CDKToolkit',
                StackName: 'CDKToolkit',
                StackStatus: StackStatus.CREATE_COMPLETE,
                LastUpdatedTime: new Date(),
                CreationTime: new Date(),
                Outputs: [
                  {
                    OutputKey: 'BucketName',
                    OutputValue: CDK_ASSETS_BUCKET_NAME,
                  },
                ],
              },
            ],
            NextToken: undefined,
            $metadata: {},
          });
          return resp;
        } else {
          /* For getting the stacks in to be deployed */
          const stackDeployed = mockManifestArtifactsDeployed.find((artifact) => artifact.properties.stackName === command.input.StackName);
          let cfnStatus: StackStatus;
          switch (stackDeployed?.status) {

            case DeploymentStatus.CREATE_STACK_SUCCESS:
              cfnStatus = StackStatus.CREATE_COMPLETE;
              break;
            case DeploymentStatus.CREATE_STACK_FAILED:
              cfnStatus = StackStatus.CREATE_FAILED;
              break;

            case DeploymentStatus.UPDATE_STACK_SUCCESS:
              cfnStatus = StackStatus.UPDATE_COMPLETE;
              break;
            case DeploymentStatus.UPDATE_STACK_FAILED:
              cfnStatus = StackStatus.UPDATE_FAILED;
              break;

            default:
              throw new Error('Unrecognized status in Mock CloudFormationClient');
          }

          //TODO: Test pagination by setting StackStatus to `..._IN_PROGRESS`
          const resp: Promise<DescribeStacksCommandOutput> = Promise.resolve({
            Stacks: [
              {
                StackId: stackDeployed.stackId,
                StackName: command.input.StackName!,
                StackStatus: cfnStatus,
                LastUpdatedTime: new Date(),
                CreationTime: new Date(),
              },
            ],
            NextToken: undefined,
            $metadata: {},
          });
          return resp;
        }
      } else {
        throw new Error('Unrecognized command in Mock CloudFormationClient');
      }
    });

    jest.spyOn(S3Client.prototype, 'send').mockImplementation((command) => {
      if (command instanceof PutObjectCommand) {

        s3PutObjectCommandsExpected.push({
          Bucket: command.input.Bucket!,
          Key: command.input.Key!,
          Body: command.input.Body!.toString(),
        });
        return Promise.resolve();
      } else {
        throw new Error('Unrecognized command in Mock CloudFormationClient');
      }
    });
  });

  test('deploy', async () => {
    const rolledBackStackResults = await rollBack(mockManifestArtifactsDeployed, mockRolledBackStacks, args);
    // TODO: Check cfnUpdateStackTemplateProps
    console.log('rolledBackStackResults', rolledBackStackResults);

    /* Compare S3PutObjectCommands one by one as the order of these might not be the same */
    expect(s3PutObjectCommandsExpected.length).toEqual(mockS3PutObjectCommands.length);
    for (const mockS3PutObjectCommand of mockS3PutObjectCommands) {
      const s3PutObjectCommandExpected = s3PutObjectCommandsExpected.find((command) => command.Key === mockS3PutObjectCommand.Key);
      expect(s3PutObjectCommandExpected).toEqual(mockS3PutObjectCommand);
    }

    /* Compare CfnUpdateCommands one by one as the order of these might not be the same */
    expect(cfnUpdateCommandsExpected.length).toEqual(mockCfnUpdateCommands.length);
    for (const mockCfnUpdateCommand of mockCfnUpdateCommands) {
      const cfnUpdateCommandExpected = cfnUpdateCommandsExpected.find((command) => command.StackName === mockCfnUpdateCommand.StackName);
      expect(cfnUpdateCommandExpected).toEqual(mockCfnUpdateCommand);
    }

    /* Compare rollback results one by one as the order of these are not the same */
    expect(rolledBackStackResults.length).toEqual(mockRolledBackStacksResult.length);
    const stackIds = mockRolledBackStacksResult.map((rolledBack) => rolledBack.stackId);
    for (const stackId of stackIds) {
      const rolledBackStackResult = rolledBackStackResults.find((artifact) => artifact.stackId === stackId)!;
      const mockRolledBackStackResult = rolledBackStackResults.find((artifact) => artifact.stackId === stackId);
      expect(rolledBackStackResult).toEqual(mockRolledBackStackResult);
    }
  }, 30_000);
});