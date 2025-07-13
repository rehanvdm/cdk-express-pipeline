import { App } from 'aws-cdk-lib';
import { JsonPatch } from '../src';
import { CdkExpressPipeline } from '../src/cdk-express-pipeline';
import { GitHubWorkflowConfig, createGitHubWorkflows, BuildConfig, GithubWorkflow } from '../src/ci-github';
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

    function buildConfigVariant(buildConfig: BuildConfig): GitHubWorkflowConfig {
      return {
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

  // it('generate workflows for demo-ts project', async () => {
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
  //     synth: {
  //       buildConfig: {
  //         type: 'preset-npm',
  //       },
  //       commands: [
  //         { dev: "npm run cdk -- synth '**' -c env=dev --output=cdk.out/dev" },
  //         { prod: "npm run cdk -- synth '**' -c env=prod --output=cdk.out/prod" },
  //       ],
  //     },
  //     diff: [{
  //       id: 'dev',
  //       on: {
  //         pullRequest: {
  //           branches: ['main'],
  //         },
  //       },
  //       stackSelector: 'stage',
  //       writeAsComment: true,
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: [
  //         { dev: 'npm run cdk -- diff {stackSelector} --app=cdk.out/dev' },
  //         { prod: 'npm run cdk -- diff {stackSelector} --app=cdk.out/prod' },
  //       ],
  //     },
  //     {
  //       id: 'prod',
  //       on: {
  //         pullRequest: {
  //           branches: ['production'],
  //         },
  //       },
  //       stackSelector: 'stage',
  //       writeAsComment: true,
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: [
  //         { prod: 'npm run cdk -- diff {stackSelector} --app=cdk.out/prod' },
  //       ],
  //     }],
  //     deploy: [{
  //       id: 'dev',
  //       on: {
  //         pullRequest: {
  //           branches: ['main'],
  //         },
  //       },
  //       stackSelector: 'stack',
  //       assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
  //       assumeRegion: 'us-east-1',
  //       commands: [
  //         { dev: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/dev --concurrency 10 --require-approval never --exclusively' },
  //       ],
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
  //       commands: [
  //         { prod: 'npm run cdk -- deploy {stackSelector} --app=cdk.out/prod --concurrency 10 --require-approval never --exclusively' },
  //       ],
  //     }],
  //   };
  //
  //   const resp = createGitHubWorkflows(ghConfig, expressPipeline.waves);
  //   for (const workflow of resp) {
  //     const filePath = path.join('/Users/rehanvandermerwe/Rehan/Projects/cdk-express-pipeline-demo-ts/.github', workflow.fileName);
  //     const dirPath = path.dirname(filePath);
  //     if (!fsSync.existsSync(dirPath)) {
  //       fsSync.mkdirSync(dirPath, { recursive: true });
  //     }
  //
  //     await fs.writeFile(filePath, stringify(workflow.content.json));
  //   }
  // });
});

describe('JsonPatch and GithubWorkflow.patch()', () => {
  let baseWorkflow: GithubWorkflow;

  beforeEach(() => {
    baseWorkflow = new GithubWorkflow({
      name: 'Test Workflow',
      description: 'A test workflow',
      runs: {
        using: 'composite',
        steps: [
          { name: 'Step 1', uses: 'actions/checkout@v4' },
          { name: 'Step 2', run: 'echo "test"', shell: 'bash' },
        ],
      },
    });
  });

  it('test basic JsonPatch operations', () => {
    const testCases = [
      {
        op: JsonPatch.add('/on', { test: true }),
        check: (w: any) => expect(w.on).toEqual({ test: true }),
      },
      {
        op: JsonPatch.replace('/name', 'Custom Name'),
        check: (w: any) => expect(w.name).toBe('Custom Name'),
      },
      {
        op: JsonPatch.remove('/description'),
        check: (w: any) => expect(w).not.toHaveProperty('description'),
      },
    ];

    for (const { op, check } of testCases) {
      const patched = baseWorkflow.patch(op);
      check(patched.json);
    }
  });

  it('test complex JsonPatch operations', () => {
    const patched = baseWorkflow.patch(
      JsonPatch.add('/runs/steps/-', {
        name: 'Custom Step',
        run: 'echo "test"',
        shell: 'bash',
      }),
      JsonPatch.add('/runs/inputs', {
        env: {
          required: false,
          default: 'dev',
        },
      }),
      JsonPatch.copy('/name', '/copied-name'),
      JsonPatch.move('/name', '/moved-name'),
    );

    console.log('Patched Workflow:', JSON.stringify(patched.json, null, 2));

    expect(patched.json).toHaveProperty('copied-name');
    expect(patched.json).toHaveProperty('moved-name');
    expect(patched.json).not.toHaveProperty('name');
    expect((patched.json as any).runs.inputs).toHaveProperty('env');
    expect((patched.json as any).runs.steps).toContainEqual(expect.objectContaining({ name: 'Custom Step' }));
  });

  it('test JsonPatch test operations', () => {
    // Test should pass
    const patched = baseWorkflow.patch(
      JsonPatch.test('/name', 'Test Workflow'),
      JsonPatch.add('/test-passed', true),
    );
    expect((patched.json as any)['test-passed']).toBe(true);

    // Test should fail
    expect(() => {
      baseWorkflow.patch(JsonPatch.test('/name', 'Wrong Name'));
    }).toThrow();
  });

  it('test mutable operations and chaining', () => {
    // Test mutability
    const patched = baseWorkflow.patch(JsonPatch.replace('/name', 'Modified'));
    expect((baseWorkflow.json as any).name).toBe('Modified');
    expect((patched.json as any).name).toBe('Modified');
    expect(baseWorkflow).not.toBe(patched);

    // Test chaining
    const chained = baseWorkflow
      .patch(JsonPatch.add('/step1', 'first'))
      .patch(JsonPatch.add('/step2', 'second'))
      .patch(JsonPatch.replace('/step2', 'modified'));

    expect(chained.json).toHaveProperty('step1', 'first');
    expect(chained.json).toHaveProperty('step2', 'modified');
  });

  it('test array operations', () => {
    const patched = baseWorkflow.patch(
      JsonPatch.add('/runs/steps/1', {
        name: 'Inserted Step',
        run: 'echo "inserted"',
        shell: 'bash',
      }),
      JsonPatch.remove('/runs/steps/2'),
      JsonPatch.replace('/runs/steps/0/uses', 'actions/checkout@v5'),
    );

    const steps = (patched.json as any).runs.steps;
    expect(steps[0]).toHaveProperty('uses', 'actions/checkout@v5');
    expect(steps[1]).toHaveProperty('name', 'Inserted Step');
    expect(steps).toHaveLength(2); // Original step 2 was removed
  });

  it('test nested object operations', () => {
    const patched = baseWorkflow.patch(
      JsonPatch.add('/runs/steps/0/with', { ref: 'main', token: '${{ secrets.GITHUB_TOKEN }}' }),
      JsonPatch.add('/runs/steps/0/if', '${{ github.event_name == "push" }}'),
      JsonPatch.replace('/runs/using', 'node16'),
    );

    const firstStep = (patched.json as any).runs.steps[0];
    expect(firstStep).toHaveProperty('with');
    expect(firstStep.with).toEqual({ ref: 'main', token: '${{ secrets.GITHUB_TOKEN }}' });
    expect(firstStep).toHaveProperty('if', '${{ github.event_name == "push" }}');
    expect((patched.json as any).runs.using).toBe('node16');
  });

  it('finds the deploy workflow from the pipeline and changes concurrency', () => {
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
      synth: {
        buildConfig: {
          type: 'preset-npm',
        },
        commands: [
        ],
      },
      diff: [],
      deploy: [{
        id: 'dev',
        on: {
          push: {
            branches: ['main'],
          },
        },
        stackSelector: 'wave',
        assumeRoleArn: 'arn:aws:iam::581184285249:role/githuboidc-git-hub-deploy-role',
        assumeRegion: 'us-east-1',
        commands: [
          { dev: 'npm run cdk -- deploy {stackSelector} --concurrency 10 --require-approval never --exclusively' },
        ],
      }],
    };

    const ghWorkflows = pipeline.generateGitHubWorkflows(ghConfig, false);
    for (let w = 0; w < ghWorkflows.length; w++) {
      if (ghWorkflows[w].fileName === 'workflows/cdk-express-pipeline-deploy-dev.yml') {
        expect(ghWorkflows[w]).toBeDefined();
        expect((ghWorkflows[w]?.content.json as any).concurrency['cancel-in-progress']).toEqual(false);

        ghWorkflows[w]?.content.patch(
          JsonPatch.replace('/concurrency/cancel-in-progress', true),
          //Add an extra step to the build job that echos success
          JsonPatch.add('/jobs/build/steps/-', {
            name: 'Echo Success',
            shell: 'bash',
            run: 'echo "Build succeeded!"',
          }),
        );

        expect((ghWorkflows[w]?.content.json as any).concurrency['cancel-in-progress']).toEqual(true);
      }
    }

    pipeline.saveGitHubWorkflows(ghWorkflows);
  });
});