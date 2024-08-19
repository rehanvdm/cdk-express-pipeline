import * as fs from 'fs';
import execa = /* eslint-disable @typescript-eslint/no-require-imports */ require('execa');
import { synth } from '../../src/cli/synth';
import { extractOriginalArgs, OriginalArgs } from '../../src/cli/utils';

/* https://github.com/swc-project/swc/issues/3843#issuecomment-1058826971 */
jest.mock('fs', () => {
  const actualModule = jest.requireActual('fs');
  return {
    __esModule: true,
    ...actualModule,
  };
});

describe('synth - should throw error if assemblyPath is provided but does not exist', () => {
  const rawArgs = '--profile systanics-role-exported --exclusively --require-approval never --concurrency 10';
  const originalArgs: OriginalArgs = extractOriginalArgs('\'**\'', rawArgs);
  const now = (new Date()).getTime();
  const args = {
    ...originalArgs,
    rawArgs: rawArgs + ' --app ./.nope/' + now,
    assemblyPath: './.nope/' + now,
  };

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
  });

  test('synth', async () => {
    const promise = synth(args);
    await expect(() => promise).rejects.toThrow(`Assembly at path ${args.assemblyPath} does not exist`);
  });
});

describe('synth - should create assembly if assemblyPath is not provided', () => {
  const rawArgs = '--profile systanics-role-exported --exclusively --require-approval never --concurrency 10';
  const originalArgs: OriginalArgs = extractOriginalArgs('\'**\'', rawArgs);
  const args = {
    ...originalArgs,
  };
  const cdkExpressSynthPath = '.cdk-express-pipeline/assembly';
  const expectedCommand = `cdk synth ** ${rawArgs} --output ${cdkExpressSynthPath}`;
  let execaCommand = '';

  beforeEach(() => {
    jest.restoreAllMocks();

    execaCommand = '';
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      if (cdkExpressSynthPath !== path) {
        throw new Error(`existsSync: Path does not match. Expected: ${args.assemblyPath}, Received: ${path}`);
      }
      return false; /* To test the branching if rm and mkdir */
    });
    jest.spyOn(fs, 'rmSync').mockImplementation((dir) => {
      if (cdkExpressSynthPath !== dir) {
        throw new Error(`rmSync: Path does not match. Expected: ${args.assemblyPath}, Received: ${dir}`);
      }
    });

    jest.spyOn(execa, 'command').mockImplementation((command) => {
      execaCommand = command;
      return Promise.resolve({}) as any;
    });
  });

  test('synth', async () => {
    const synthedArgs = await synth(args);
    expect(args.assemblyPath).toEqual(undefined);
    expect(synthedArgs.assemblyPath).toEqual(cdkExpressSynthPath);
    expect(execaCommand).toEqual(expectedCommand);
  });
});


