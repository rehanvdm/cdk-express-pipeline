import { awscdk, javascript } from 'projen';
import { ArrowParens, TrailingComma } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkConstructLibrary({
  majorVersion: 1,
  author: 'rehanvdm',
  authorAddress: 'rehan.vdm4+github@gmail.com',
  cdkVersion: '2.133.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.8.0',
  typescriptVersion: '~5.8.0',
  name: 'cdk-express-pipeline',
  description: 'CDK pipelines provides constructs for Waves, Stages using only native CDK stack dependencies',
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/rehanvdm/cdk-express-pipeline.git',
  prettierOptions: {
    settings: {
      printWidth: 120,
      useTabs: false,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      bracketSpacing: true,
      trailingComma: TrailingComma.ES5,
      arrowParens: ArrowParens.ALWAYS,
    },
  },
  pullRequestTemplate: false,
  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: ['feat', 'fix', 'docs', 'ci', 'chore'],
      },
    },
  },
  workflowNodeVersion: '20',
  // Publishing disabled as no secrets are set yet.
  publishToPypi: {
    distName: 'cdk_express_pipeline',
    module: 'cdk_express_pipeline',
  },
  // deps: [ ],
  bundledDeps: ['yaml', 'fast-json-patch'],
  /* Build dependencies for this module. */
  devDeps: ['husky', '@types/fast-json-patch'],
  jestOptions: {
    jestConfig: {
      moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'cjs', 'jsx', 'json', 'node'], // https://jestjs.io/docs/configuration#modulefileextensions-arraystring
    },
  },
});
project.package.addEngine('node', '~20.*');
project.package.addEngine('npm', '~10.*');

// Need to clear before compiling and packaging. Have to remove these because they are not cleared for some reason,
// only new files are added and it causes issues especially because when changing the folder structure the whole time.
const clear = project.addTask('clear-lib-and-dist');
clear.exec('rm -rf lib/ dist/');

// Only run husky if not in CI, in the post install script
project.package.setScript('prepare', 'if [ "$CI" = "true" ]; then echo "CI detected, not running husky"; else husky; fi');

project.gitignore.addPatterns('.idea');
project.gitignore.addPatterns('*.js');
project.gitignore.addPatterns('*.d.ts');
project.gitignore.addPatterns('*.DS_Store');
project.gitignore.addPatterns('pipeline-deployment-order.md');

project.synth();