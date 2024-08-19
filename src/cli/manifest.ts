import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { OriginalArgs } from './utils';

export enum DeploymentStatus {
  SKIPPED_NO_CHANGES = 'SKIPPED_NO_CHANGES',

  CREATE_STACK_FAILED = 'CREATE_STACK_FAILED',
  CREATE_STACK_SUCCESS = 'CREATE_STACK_SUCCESS',

  UPDATE_STACK_SUCCESS = 'UPDATE_STACK_SUCCESS',
  UPDATE_STACK_FAILED = 'UPDATE_STACK_FAILED',

  NOT_DEPLOYED = 'NOT_DEPLOYED',
}

export type ManifestArtifactDeployed = ManifestArtifact & {
  /**
   * If the stack was deployed or not, will not include the stack that rolled back if any
   */
  status: DeploymentStatus;
};

export type ManifestArtifact = {
  stackId: string;
  type: string;
  properties: {
    requiresBootstrapStackVersion: number;
    bootstrapStackVersionSsmParameter: string;
    templateFile: string;
    terminationProtection: boolean;
    validateOnSynth: boolean;
    assumeRoleArn: string;
    cloudFormationExecutionRoleArn: string;
    stackTemplateAssetObjectUrl: string;
    additionalDependencies: string[];
    lookupRole: {
      arn: string;
      requiresBootstrapStackVersion: number;
      bootstrapStackVersionSsmParameter: string;
    };
    stackName: string;
  };
  environment: string;
  dependencies?: string[];
  metadata: {
    [key: string]: Array<{
      type: string;
      data: string;
    }>;
  };
  displayName: string;
};
export type ManifestArtifactReduced = {
  stackId: string;
  stackName: string;
  region: string;
  assumeRole: string;
}

export type ManifestArtifactNoId = {
  type: string;
  properties: {
    requiresBootstrapStackVersion: number;
    bootstrapStackVersionSsmParameter: string;
    templateFile: string;
    terminationProtection: boolean;
    validateOnSynth: boolean;
    assumeRoleArn: string;
    cloudFormationExecutionRoleArn: string;
    stackTemplateAssetObjectUrl: string;
    additionalDependencies: string[];
    lookupRole: {
      arn: string;
      requiresBootstrapStackVersion: number;
      bootstrapStackVersionSsmParameter: string;
    };
    stackName: string;
  };
  environment: string;
  dependencies?: string[];
  metadata: {
    [key: string]: Array<{
      type: string;
      data: string;
    }>;
  };
  displayName: string;
};


export type ManifestArtifacts = {
  [key: string]: ManifestArtifactNoId;
};

export type Manifest = {
  version: string;
  artifacts: ManifestArtifacts;
};

export function getManifestStackArtifactProperties(manifestStackArtifact: ManifestArtifact): ManifestArtifactReduced {
  const ret = {
    stackId: manifestStackArtifact.stackId,
    stackName: manifestStackArtifact.properties.stackName,
    region: manifestStackArtifact.environment.split('/')[3],
    assumeRole: manifestStackArtifact.properties.assumeRoleArn.replace('${AWS::Partition}', 'aws'),
  };
  console.log('StackArtifactProperties:', ret);
  return ret;
}


/**
 * Get the stack artifacts from the manifest.json file
 * @param args The CDK args object
 * @returns {[string, ManifestArtifact][]} An array of arrays that contains the stackId and ManifestArtifact object
 */
export function getManifestStackArtifacts(args: OriginalArgs): ManifestArtifact[] {
  assert.ok(args.assemblyPath);
  const manifest = JSON.parse(fs.readFileSync(path.join(args.assemblyPath, 'manifest.json'), 'utf-8')) as Manifest;
  const stacks = Object.entries(manifest.artifacts).filter(([_, artifact]) => (artifact as any).type == 'aws:cloudformation:stack');

  let patternToFilter: string | undefined;
  if (args.pattern?.includes('**')) {
    patternToFilter = undefined;
  } else if (args.pattern?.endsWith('*')) {
    patternToFilter = args.pattern.slice(0, -1);
  }

  return stacks
    .filter(([stackId, _]) => {
      if (patternToFilter) {
        return stackId.startsWith(patternToFilter);
      }
      return true;
    }).map(([stackId, artifact]) => {
      return {
        stackId,
        ...artifact,
      };
    });
}

