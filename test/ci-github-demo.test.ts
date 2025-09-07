// import * as fsSync from 'fs';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { App } from 'aws-cdk-lib';
// import { stringify } from 'yaml';
//
// import { CdkExpressPipeline } from '../src/cdk-express-pipeline';
// import { GitHubWorkflowConfig, createGitHubWorkflows } from '../src/ci-github';
// import { ExpressStack } from '../src/express-stack';

describe('CDK Express Pipeline CI Configuration', () => {

  it('generate workflows for demo-ts project - multiple assemblies', async () => {
  //   // Switch to: https://github.com/rehanvdm/cdk-express-pipeline-demo-ts/
  //   // Check out: feature/new-diff-test-miltiple-assemblies-multiple-generated-workflows
  //   // Run this to generate the workflows in the dem-ts project, then commit them
  //   // Use the PR: https://github.com/rehanvdm/cdk-express-pipeline-demo-ts/pull/6
  //   // to verify that it works
  //
  //   const app = new App();
  //   const expressPipeline = new CdkExpressPipeline();
  //   const wave1 = expressPipeline.addWave('Wave1');
  //   const wave1Stage1 = wave1.addStage('Stage1');
  //   const stackA = new ExpressStack(app, 'StackA', wave1Stage1);
  //   const stackB = new ExpressStack(app, 'StackB', wave1Stage1);
  //   stackB.addExpressDependency(stackA);
  //   const wave1Stage2 = wave1.addStage('Stage2');
  //   new ExpressStack(app, 'Stack2A', wave1Stage2);
  //
  //   const wave2 = expressPipeline.addWave('Wave2');
  //   const wave2Stage1 = wave2.addStage('Stage1');
  //   new ExpressStack(app, 'StackC', wave2Stage1);
  //
  //   const ghConfig: GitHubWorkflowConfig = {
  //     build: {
  //       type: 'preset-npm',
  //     },
  //     diff: [{
  //       id: 'dev',
  //       on: {
  //         pullRequest: {
  //           branches: ['main'],
  //         },
  //       },
  //       stackSelector: 'stage',
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: {
  //         dev: {
  //           synth: "npm run cdk -- synth '**' -c env=dev --output=cdk.out/dev",
  //           diff: 'npm run cdk -- diff {stackSelector} --app=cdk.out/dev',
  //         },
  //         prod: {
  //           synth: "npm run cdk -- synth '**' -c env=prod --output=cdk.out/prod",
  //           diff: 'npm run cdk -- diff {stackSelector} --app=cdk.out/prod',
  //         },
  //       },
  //     },
  //     {
  //       id: 'prod',
  //       on: {
  //         pullRequest: {
  //           branches: ['production'],
  //         },
  //       },
  //       stackSelector: 'stage',
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: {
  //         prod: {
  //           synth: "npm run cdk -- synth '**' -c env=prod --output=cdk.out/prod",
  //           diff: 'npm run cdk -- diff {stackSelector} --app=cdk.out/prod',
  //         },
  //       },
  //     }],
  //     deploy: [{
  //       id: 'dev',
  //       on: {
  //         push: {
  //           branches: ['main'],
  //         },
  //       },
  //       stackSelector: 'stack',
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: {
  //         dev: {
  //           synth: "npm run cdk -- synth '**' -c env=dev --output=cdk.out/dev",
  //           deploy: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/dev --concurrency 10 --require-approval never --exclusively',
  //         },
  //       },
  //     },
  //     {
  //       id: 'prod',
  //       on: {
  //         push: {
  //           branches: ['production'],
  //         },
  //       },
  //       stackSelector: 'stack',
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: {
  //         prod: {
  //           synth: "npm run cdk -- synth '**' -c env=prod --output=cdk.out/prod",
  //           deploy: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/prod --concurrency 10 --require-approval never --exclusively',
  //         },
  //       },
  //     }],
  //   };
  //
  //   const resp = createGitHubWorkflows(ghConfig, expressPipeline.waves);
  //   for (const workflow of resp) {
  //     const filePath = path.join('/Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/.github', workflow.fileName);
  //
  //     const dirPath = path.dirname(filePath);
  //     if (!fsSync.existsSync(dirPath)) {
  //       fsSync.mkdirSync(dirPath, { recursive: true });
  //     }
  //
  //     await fs.writeFile(filePath, stringify(workflow.content.json));
  //   }
  });
});

