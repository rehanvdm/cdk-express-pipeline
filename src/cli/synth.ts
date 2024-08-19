import * as fs from 'fs';
import execa = /* eslint-disable @typescript-eslint/no-require-imports */ require('execa');
import { OriginalArgs } from './utils';

const ASSEMBLY_PATH = '.cdk-express-pipeline/assembly';

/**
 * Synth the CDK app. Use the assembly path if it exists, otherwise create one and return the path as well as the assembly argument for other
 * CDK commands
 * @param pattern
 * @param args
 */
export async function synth(argsOriginal: OriginalArgs): Promise<OriginalArgs> {

  let assemblyPath = argsOriginal.assemblyPath;

  if (assemblyPath) {
    if (!fs.existsSync(assemblyPath)) {
      throw new Error(`Assembly at path ${assemblyPath} does not exist`);
    }
    console.log('Assembly exists');
  } else {
    assemblyPath = ASSEMBLY_PATH;
    console.log('Creating assembly...');

    // Remove the assembly directory if exists
    if (fs.existsSync(assemblyPath)) {
      fs.rmSync(assemblyPath, {
        recursive: true,
        force: true,
      });
    }

    const synthArg = `cdk synth ${argsOriginal.pattern} ${argsOriginal.raw} --output ${assemblyPath}`;
    console.log('Running synth:', synthArg);
    await execa.command(synthArg, {
      env: {
        ...process.env,
        FORCE_COLOR: 'true',
      },
      stdout: 'inherit',
      stderr: 'inherit',
      preferLocal: true,
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
