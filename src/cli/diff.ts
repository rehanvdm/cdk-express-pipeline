import execa = /* eslint-disable @typescript-eslint/no-require-imports */ require('execa');
import { Logger } from './logger';
import { getLocalPackagesPreferredPath } from './utils';

const logger = new Logger();

export async function diff(pattern: string, rawArgs: string): Promise<void> {
  const synthArg = `cdk diff "${pattern}" ${rawArgs}`;
  logger.debug('CDK diff command: ', synthArg);
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