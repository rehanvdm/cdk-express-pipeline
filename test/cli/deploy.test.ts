import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import execa = /* eslint-disable @typescript-eslint/no-require-imports */ require('execa');
import { getMockStack } from './util';
import { deploy } from '../../src/cli/deploy';
import { DeploymentStatus, Manifest, ManifestArtifact, ManifestArtifactDeployed } from '../../src/cli/manifest';
import { extractOriginalArgs, OriginalArgs } from '../../src/cli/utils';

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
  const deployOutput = `

ORDER OF DEPLOYMENT
🌊 Waves  - Deployed sequentially
🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time
📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, is deployed

🌊 Wave1
  🔲 Stage1
    📄 StackA (Wave1_Stage1_StackA)
    📄 StackB (Wave1_Stage1_StackB)
        ↳ StackA
🌊 Wave2
  🔲 Stage1
    📄 StackC (Wave2_Stage1_StackC)
    📄 StackD (Wave2_Stage1_StackD)
        ↳ StackC
    📄 StackE (Wave2_Stage1_StackE)


✨  Synthesis time: 2.68s

Wave1_Stage1_StackA (StackA)
Wave1_Stage1_StackA (StackA): deploying... [1/5]
StackE:  start: Building 6eb5af7339ee09f14137333dceb102966195211cf68d359a1536a5d716c849f2:581184285249-eu-west-1
StackE:  success: Built 6eb5af7339ee09f14137333dceb102966195211cf68d359a1536a5d716c849f2:581184285249-eu-west-1

 ✅  Wave1_Stage1_StackA (StackA) (no changes)

✨  Deployment time: 2.5s

Stack ARN:
arn:aws:cloudformation:eu-west-1:581184285249:stack/StackA/db081040-52e2-11ef-a2f3-02dfb7cb95b1

✨  Total time: 5.17s

Wave1_Stage1_StackB (StackB)
Wave1_Stage1_StackB (StackB): deploying... [2/5]

 ✅  Wave1_Stage1_StackB (StackB) (no changes)

✨  Deployment time: 1.63s

Stack ARN:
arn:aws:cloudformation:eu-west-1:581184285249:stack/StackB/e4023090-52e2-11ef-9a57-0a7721066cf5

✨  Total time: 4.31s

Wave2_Stage1_StackC (StackC)
Wave2_Stage1_StackC (StackC): deploying... [3/5]
StackE:  start: Publishing 6eb5af7339ee09f14137333dceb102966195211cf68d359a1536a5d716c849f2:581184285249-eu-west-1

 ✅  Wave2_Stage1_StackC (StackC) (no changes)

✨  Deployment time: 1.65s

Stack ARN:
arn:aws:cloudformation:eu-west-1:581184285249:stack/StackC/ecf3c560-52e2-11ef-8320-02dd0dcecae1

✨  Total time: 4.33s

Wave2_Stage1_StackD (StackD)
Wave2_Stage1_StackD (StackD): deploying... [4/5]
StackD: creating CloudFormation changeset...
StackE:  success: Published 6eb5af7339ee09f14137333dceb102966195211cf68d359a1536a5d716c849f2:581184285249-eu-west-1
Wave2_Stage1_StackE (StackE)
Wave2_Stage1_StackE (StackE): deploying... [5/5]
StackE: creating CloudFormation changeset...
StackD | 0/2 | 8:38:50 PM | DELETE_IN_PROGRESS   | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) The role with name StackD-MyRoleF48FFE04-cjhM6SmBKSdr cannot be found. (Service: Iam, Status Code: 404, Request ID: 99078514-e759-45a7-b418-77c46380bb67)
StackD | 1/2 | 8:38:50 PM | DELETE_COMPLETE      | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) 
StackD | 2/2 | 8:38:50 PM | ROLLBACK_COMPLETE    | AWS::CloudFormation::Stack | StackD 
StackD | 2/2 | 8:38:36 PM | REVIEW_IN_PROGRESS   | AWS::CloudFormation::Stack | StackD User Initiated
StackD | 2/2 | 8:38:44 PM | CREATE_IN_PROGRESS   | AWS::CloudFormation::Stack | StackD User Initiated
StackD | 2/2 | 8:38:46 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) 
StackD | 2/2 | 8:38:47 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) Invalid principal in policy: "SERVICE":"nope.amazonaws.com" (Service: Iam, Status Code: 400, Request ID: 3226d54d-2502-4867-89b7-82f115bc88f8)
StackD | 2/2 | 8:38:47 PM | CREATE_IN_PROGRESS   | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) Resource creation Initiated
StackD | 2/2 | 8:38:47 PM | CREATE_FAILED        | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) Resource handler returned message: "Invalid principal in policy: "SERVICE":"nope.amazonaws.com" (Service: Iam, Status Code: 400, Request ID: 3226d54d-2502-4867-89b7-82f115bc88f8)" (RequestToken: 8f890b99-fc8d-574f-06c2-6898b33bebd6, HandlerErrorCode: InvalidRequest)
StackD | 2/2 | 8:38:47 PM | ROLLBACK_IN_PROGRESS | AWS::CloudFormation::Stack | StackD The following resource(s) failed to create: [MyRoleF48FFE04]. Rollback requested by user.
StackD | 2/2 | 8:38:49 PM | DELETE_IN_PROGRESS   | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) 

Failed resources:
StackD | 8:38:47 PM | CREATE_FAILED        | AWS::IAM::Role | Wave2_Stage1_StackD/MyRole (MyRoleF48FFE04) Resource handler returned message: "Invalid principal in policy: "SERVICE":"nope.amazonaws.com" (Service: Iam, Status Code: 400, Request ID: 3226d54d-2502-4867-89b7-82f115bc88f8)" (RequestToken: 8f890b99-fc8d-574f-06c2-6898b33bebd6, HandlerErrorCode: InvalidRequest)

 ❌  Wave2_Stage1_StackD (StackD) failed: Error: The stack named StackD failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE
    at FullCloudFormationDeployment.monitorDeployment (/Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/node_modules/aws-cdk/lib/index.js:433:10615)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.deployStack2 [as deployStack] (/Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/node_modules/aws-cdk/lib/index.js:436:200335)
    at async /Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/node_modules/aws-cdk/lib/index.js:436:181173
StackE | 0/4 | 8:38:48 PM | UPDATE_IN_PROGRESS   | AWS::CloudFormation::Stack | StackE User Initiated
StackE | 0/4 | 8:38:50 PM | CREATE_IN_PROGRESS   | AWS::SNS::Topic | Wave2_Stage1_StackE/Topic1724006306571 (Topic1724006306571CED6F1BB) 
StackE | 0/4 | 8:38:51 PM | CREATE_IN_PROGRESS   | AWS::SNS::Topic | Wave2_Stage1_StackE/Topic1724006306571 (Topic1724006306571CED6F1BB) Resource creation Initiated
StackE | 1/4 | 8:38:51 PM | CREATE_COMPLETE      | AWS::SNS::Topic | Wave2_Stage1_StackE/Topic1724006306571 (Topic1724006306571CED6F1BB) 
StackE | 2/4 | 8:38:52 PM | UPDATE_COMPLETE_CLEA | AWS::CloudFormation::Stack | StackE 
StackE | 2/4 | 8:38:53 PM | DELETE_IN_PROGRESS   | AWS::SNS::Topic | Topic172353845431217C62F0E 
2/4 Currently in progress: StackE, Topic172353845431217C62F0E
StackE | 3/4 | 8:39:39 PM | DELETE_COMPLETE      | AWS::SNS::Topic | Topic172353845431217C62F0E 
StackE | 4/4 | 8:39:39 PM | UPDATE_COMPLETE      | AWS::CloudFormation::Stack | StackE 

 ✅  Wave2_Stage1_StackE (StackE)

✨  Deployment time: 66.29s

Stack ARN:
arn:aws:cloudformation:eu-west-1:581184285249:stack/StackE/749b7110-5929-11ef-b7fc-0a0f812cc93b

✨  Total time: 68.97s


 ❌ Deployment failed: Error: The stack named StackD failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE
    at FullCloudFormationDeployment.monitorDeployment (/Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/node_modules/aws-cdk/lib/index.js:433:10615)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.deployStack2 [as deployStack] (/Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/node_modules/aws-cdk/lib/index.js:436:200335)
    at async /Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/node_modules/aws-cdk/lib/index.js:436:181173

The stack named StackD failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE

Process finished with exit code 1
`;

  const mockManifest: Manifest = {
    version: '1.0',
    artifacts: {
      ...getMockStack('Wave1_Stage1_StackA', 'StackA'),
      ...getMockStack('Wave1_Stage1_StackB', 'StackB'),
      ...getMockStack('Wave1_Stage1_StackC', 'StackC'),
      ...getMockStack('Wave1_Stage1_StackD', 'StackD'),
      ...getMockStack('Wave1_Stage1_StackE', 'StackE'),
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
    {
      ...mockManifest.artifacts.Wave2_Stage1_StackD,
      stackId: 'Wave2_Stage1_StackD',
    },
    {
      ...mockManifest.artifacts.Wave2_Stage1_StackE,
      stackId: 'Wave2_Stage1_StackE',
    },
  ];
  const mockManifestArtifactsDeployed: ManifestArtifactDeployed[] = [
    {
      ...mockManifest.artifacts.Wave1_Stage1_StackA,
      stackId: 'Wave1_Stage1_StackA',
      status: DeploymentStatus.SKIPPED_NO_CHANGES,
    },

    {
      ...mockManifest.artifacts.Wave2_Stage1_StackB,
      stackId: 'Wave2_Stage1_StackB',
      status: DeploymentStatus.CREATE_STACK_SUCCESS,
    },
    {
      ...mockManifest.artifacts.Wave2_Stage1_StackC,
      stackId: 'Wave2_Stage1_StackC',
      status: DeploymentStatus.CREATE_STACK_FAILED,
    },


    {
      ...mockManifest.artifacts.Wave2_Stage1_StackD,
      stackId: 'Wave2_Stage1_StackD',
      status: DeploymentStatus.UPDATE_STACK_SUCCESS,
    },
    {
      ...mockManifest.artifacts.Wave2_Stage1_StackE,
      stackId: 'Wave2_Stage1_StackE',
      status: DeploymentStatus.UPDATE_STACK_FAILED,
    },
  ];

  change cdk output above, only have lines interested in...

  beforeEach(() => {
    jest.restoreAllMocks();

    execaCommand = '';
    jest.spyOn(execa, 'command').mockImplementation((command) => {
      execaCommand = command;
      return Promise.resolve({
        all: deployOutput,
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
      throw new Error(`Unrecognized command: ${command}`);
    });
  });

  test('deploy', async () => {
    const manifestDeployed = await deploy(args, mockManifestArtifacts);
    expect(execaCommand).toEqual(expectedCommand);
    expect(manifestDeployed).toEqual(mockManifestArtifactsDeployed);
  });
});


