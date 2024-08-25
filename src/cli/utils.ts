import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { fromIni } from '@aws-sdk/credential-provider-ini';

function extractOriginalArgValue(extractArg: string, arg: string): string | undefined {
  if (!arg.includes(extractArg)) {
    return undefined;
  }
  return arg.split(extractArg)[1].split(/=|\s/)[1].trim();
}

export type OriginalArgs = {
  /**
   * The original string arguments passed to the CLI
   */
  raw: string;

  /**
   The stack selection filter pattern
   */
  pattern?: string;

  /**
   * The --app flag value
   */
  assemblyPath?: string;

  /**
   * The --profile flag value
   */
  profile?: string;

  /**
   * The --require-approval flag value
   */
  requireApproval?: string;


  /**
   * Indicates the presence of the --exclusively flag present
   */
  exclusively?: boolean;

  /**
   * The --concurrency flag value
   */
  concurrency?: number;

  /**
   * The --progress flag value
   */
  progress?: string;
}

/**
 * Extract the original arguments from the extraArgs string passed to the CLI
 * @param originalArgs
 */
export function extractOriginalArgs(pattern: string, originalArgs: string): OriginalArgs {
  return {
    raw: originalArgs,
    pattern: pattern,
    assemblyPath: extractOriginalArgValue('--app', originalArgs),
    profile: extractOriginalArgValue('--profile', originalArgs),
    requireApproval: extractOriginalArgValue('--require-approval', originalArgs),
    exclusively: originalArgs.includes('--exclusively'),
    concurrency: parseInt(extractOriginalArgValue('--concurrency', originalArgs) || '1'),
    progress: extractOriginalArgValue('--progress', originalArgs),
  };
}

export type AssumedRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export async function assumeRoleAndGetCredentials(region: string, profile: string | undefined, roleArn: string): Promise<AssumedRoleCredentials> {
  const stsClient = new STSClient({
    region,
    credentials: profile ? fromIni({ profile: profile }) : undefined,
  });
  // use profile systanics-role-exported
  const stsRole = await stsClient.send(new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: 'cdk-express-pipeline--save-templates',
    DurationSeconds: 3600,
  }));

  if (!stsRole.Credentials || !stsRole.Credentials.AccessKeyId || !stsRole.Credentials.SecretAccessKey || !stsRole.Credentials.SessionToken) {
    throw new Error(`Can not assume role ${roleArn}`);
  }

  return {
    accessKeyId: stsRole.Credentials.AccessKeyId,
    secretAccessKey: stsRole.Credentials.SecretAccessKey,
    sessionToken: stsRole.Credentials.SessionToken,
  };
}

/**
 * Returns the PATH env variable prepended by the local node_modules/.bin directory. This is useful for running packages installed locally
 * before global packages.
 */
export function etLocalPackagesPreferredPath() {
  let pathEnvSeparator = process.platform === 'win32' ? ';' : ':';
  return process.env.PATH = `${process.cwd()}/mode_modules/.bin${pathEnvSeparator}${process.env.PATH}`;
}