import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { App } from 'aws-cdk-lib';
import { stringify } from 'yaml';
import { CdkExpressPipeline } from '../src/cdk-express-pipeline';
import { GitHubWorkflowConfig, createGitHubWorkflows, BuildWorkflowPathConfig } from '../src/ci-github';
import { ExpressStack } from '../src/express-stack';

function getAppAndPipeline() {
  const app = new App();
  const pipeline = new CdkExpressPipeline();
  const wave1 = pipeline.addWave('global');
  const wave1stage1 = wave1.addStage('us-east-1');
  new ExpressStack(app, 'global', wave1stage1); // vpcs, certs, route53, iam

  const wave2 = pipeline.addWave('app');
  const wave2stage1 = wave2.addStage('us-east-1');
  new ExpressStack(app, 'api', wave2stage1);
  const wave2stage2 = wave2.addStage('eu-west-1');
  new ExpressStack(app, 'api', wave2stage2);

  return { app, pipeline };
}

describe('CDK Express Pipeline CI Configuration', () => {

  it('snapshot synth and build variants', async () => {
    const { pipeline } = getAppAndPipeline();

    function buildConfigVariant(buildConfig: BuildWorkflowPathConfig): GitHubWorkflowConfig {
      return {
        workingDir: '.',
        synth: {
          buildConfig: buildConfig,
          commands: [
            { dev: '' },
            { prod: '' },
          ],
        },
        diff: [],
        deploy: [],
      };
    }

    const tests: { name: string; config: GitHubWorkflowConfig }[] = [
      {
        name: 'preset-npm',
        config: buildConfigVariant({
          type: 'preset-npm',
        }),
      },
      {
        name: 'workflow',
        config: buildConfigVariant({
          type: 'workflow',
          workflow: {
            path: '.github/actions/build',
          },
        }),
      },
    ];

    for (const test of tests) {
      const resp = createGitHubWorkflows(test.config, pipeline.waves);
      const synthWorkflow = resp.find(w => w.fileName === 'actions/cdk-express-pipeline-synth/action.yml');
      expect(synthWorkflow).toMatchSnapshot(test.name);
    }
  });

  it('snapshot diff stack selector variants', async () => {
    const { pipeline } = getAppAndPipeline();

    function buildStackSelectorVariant(stackSelector: 'wave' | 'stage'): GitHubWorkflowConfig {
      return {
        workingDir: '.',
        synth: {
          buildConfig: {
            type: 'preset-npm',
          },
          commands: [
          ],
        },
        diff: [{
          on: {},
          stackSelector: stackSelector,
          writeAsComment: true,
          assumeRoleArn: '',
          assumeRegion: '',
          commands: [
            { dev: 'npm run cdk -- diff {stackSelector} --app=cdk.out/dev' },
          ],
        }],
        deploy: [],
      };
    }

    const tests: { name: string; config: GitHubWorkflowConfig }[] = [
      {
        name: 'wave',
        config: buildStackSelectorVariant('wave'),
      },
      {
        name: 'stage',
        config: buildStackSelectorVariant('stage'),
      },
    ];

    for (const test of tests) {
      const resp = createGitHubWorkflows(test.config, pipeline.waves);
      const synthWorkflow = resp.find(w => w.fileName === 'workflows/cdk-express-pipeline-diff.yml');
      expect((synthWorkflow?.content.json as any).jobs.diff__dev.strategy.matrix.include).toMatchSnapshot(test.name);
    }
  });

  it('snapshot all workflows for config', async () => {
    const app = new App();
    const pipeline = new CdkExpressPipeline();
    const wave1 = pipeline.addWave('global');
    const wave1stage1 = wave1.addStage('us-east-1');
    new ExpressStack(app, 'global', wave1stage1); // vpcs, certs, route53, iam

    const wave2 = pipeline.addWave('app');
    const wave2stage1 = wave2.addStage('us-east-1');
    new ExpressStack(app, 'api', wave2stage1);
    const wave2stage2 = wave2.addStage('eu-west-1');
    new ExpressStack(app, 'api', wave2stage2);

    const ghConfig: GitHubWorkflowConfig = {
      workingDir: '.',
      synth: {
        buildConfig: {
          type: 'preset-npm',
        },
        commands: [
          { dev: "npm run cdk -- synth '**' -c env=dev --output=cdk.out/dev" },
          { prod: "npm run cdk -- synth '**' -c env=prod --output=cdk.out/prod" },
        ],
      },
      diff: [{
        on: {
          pullRequest: {
            branches: ['main'],
          },
        },
        stackSelector: 'wave',
        writeAsComment: true,
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { dev: 'npm run cdk -- diff {stackSelector} --app=cdk.out/dev' },
          { prod: 'npm run cdk -- diff {stackSelector} --app=cdk.out/prod' },
        ],
      }],
      deploy: [{
        id: 'dev',
        on: {
          pullRequest: {
            branches: ['main'],
          },
        },
        stackSelector: 'wave',
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { dev: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/dev --concurrency 10 --require-approval never --exclusively' },
        ],
      },
      {
        id: 'prod',
        on: {
          pullRequest: {
            branches: ['production'],
          },
        },
        stackSelector: 'wave',
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { prod: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/prod --concurrency 10 --require-approval never --exclusively' },
        ],
      }],
    };

    const resp = createGitHubWorkflows(ghConfig, pipeline.waves);
    for (const workflow of resp) {
      expect(workflow).toMatchSnapshot();
    }
  });


  it('generate workflows for demo-ts project', async () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new ExpressStack(app, 'StackA', wave1Stage1);
    const stackB = new ExpressStack(app, 'StackB', wave1Stage1);
    stackB.addExpressDependency(stackA);
    const wave1Stage2 = wave1.addStage('Stage2');
    new ExpressStack(app, 'Stack2A', wave1Stage2);

    const wave2 = expressPipeline.addWave('Wave2');
    const wave2Stage1 = wave2.addStage('Stage1');
    new ExpressStack(app, 'StackC', wave2Stage1);

    const ghConfig: GitHubWorkflowConfig = {
      workingDir: '.',
      synth: {
        buildConfig: {
          type: 'preset-npm',
        },
        commands: [
          { dev: "npm run cdk -- synth '**' -c env=dev --output=cdk.out/dev" },
          { prod: "npm run cdk -- synth '**' -c env=prod --output=cdk.out/prod" },
        ],
      },
      diff: [{
        on: {
          pullRequest: {
            branches: ['main'],
          },
        },
        stackSelector: 'stage',
        writeAsComment: true,
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { dev: 'npm run cdk -- diff {stackSelector} --app=cdk.out/dev' },
          { prod: 'npm run cdk -- diff {stackSelector} --app=cdk.out/prod' },
        ],
      }],
      deploy: [{
        id: 'dev',
        on: {
          pullRequest: {
            branches: ['main'],
          },
        },
        stackSelector: 'wave',
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { dev: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/dev --concurrency 10 --require-approval never --exclusively' },
        ],
      },
      {
        id: 'prod',
        on: {
          push: {
            branches: ['production'],
          },
        },
        stackSelector: 'wave',
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { prod: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/prod --concurrency 10 --require-approval never --exclusively' },
        ],
      }],
    };

    const resp = createGitHubWorkflows(ghConfig, expressPipeline.waves);
    for (const workflow of resp) {
      const filePath = path.join('/Users/rehanvandermerwe/Resend/Projects/cdk-express-pipeline-demo-ts/.github', workflow.fileName);
      const dirPath = path.dirname(filePath);
      if (!fsSync.existsSync(dirPath)) {
        fsSync.mkdirSync(dirPath, { recursive: true });
      }

      await fs.writeFile(filePath, stringify(workflow.content.json));
    }
  });
});