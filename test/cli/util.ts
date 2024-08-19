import { ManifestArtifactNoId } from '../../src/cli/manifest';

export function getMockStack(stackId: string, stackName: string): { [key: string]: ManifestArtifactNoId } {
  return {
    [stackId]: {
      type: 'aws:cloudformation:stack',
      environment: 'aws://123456789123/eu-west-1',
      properties: {
        requiresBootstrapStackVersion: 1,
        bootstrapStackVersionSsmParameter: 'parameter',
        templateFile: `${stackId}.template.json`,
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
        stackName: stackName,
      },
      metadata: {},
      displayName: stackId,
    },
  };
}