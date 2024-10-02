import * as fs from 'fs';
import execa = /* eslint-disable @typescript-eslint/no-require-imports */ require('execa');
import { Logger } from './logger';
import { getLocalPackagesPreferredPath, OriginalArgs } from './utils';

export const ASSEMBLY_PATH = '.cdk-express-pipeline/assembly';
export const ROLLBACK_PATH = '.cdk-express-pipeline/rollback';
const logger = new Logger();


/**
 * Synth the CDK app. Use the assembly path if it exists, otherwise create one and return the path as well as the assembly argument for other
 * CDK commands
 * @param argsOriginal
 */
export async function synth(argsOriginal: OriginalArgs): Promise<OriginalArgs> {

  let assemblyPath = argsOriginal.assemblyPath;

  if (assemblyPath) {
    if (!fs.existsSync(assemblyPath)) {
      throw new Error(`Assembly at path ${assemblyPath} does not exist`);
    }
    logger.debug('Assembly exists:', assemblyPath);
  } else {
    assemblyPath = ASSEMBLY_PATH;
    logger.debug('Creating assembly:', assemblyPath);

    // Remove the assembly and rollback directory if it exists. Do not remove the complete directory as it will contain a deployment order file.
    const assemblyDirsToRemove = [ASSEMBLY_PATH, ROLLBACK_PATH];
    for (const dir of assemblyDirsToRemove) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, {
          recursive: true,
          force: true,
        });
      }
    }

    const synthArg = `cdk synth "${argsOriginal.pattern}" ${argsOriginal.raw} --output ${assemblyPath}`;
    logger.debug('CDK synth command: ', synthArg);

    await execa.command(synthArg, {
      env: {
        ...process.env,
        PATH: getLocalPackagesPreferredPath(),
        FORCE_COLOR: 'true',
      },
      stdout: 'inherit',
      stderr: 'inherit',
      preferLocal: true, // Strange bug where this only works for this package but not for a client using the library, hence we fix this above with `getLocalPackagesPreferredPath`
      reject: true,
      shell: true,
      all: true,
    });
  }

  return {
    ...argsOriginal,
    raw: argsOriginal.raw + ` --app ${assemblyPath}`,
    assemblyPath: assemblyPath,
  };
}
