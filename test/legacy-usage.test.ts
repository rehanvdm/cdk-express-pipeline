import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkExpressPipelineLegacy } from '../src/cdk-express-pipeline-legacy';

const jestConsole = console;

describe('CdkExpressPipelineLegacy', () => {

  beforeEach(() => {
    /* Disable Jest's console.log that adds the location of log lines */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    global.console = require('console');
  });
  afterEach(() => {
    /* Restore Jest's console */
    global.console = jestConsole;
  });

  test('Explicit pattern', () => {
    const app = new App();

    /* === Wave 1 === */
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1StackA = new cdk.Stack(app, 'Wave1Stage1StackA');
    const wave1Stage1StackB = new cdk.Stack(app, 'Wave1Stage1StackB');
    const wave1Stage1StackC = new cdk.Stack(app, 'Wave1Stage1StackC');
    const wave1Stage1StackD = new cdk.Stack(app, 'Wave1Stage1StackD');
    const wave1Stage1StackE = new cdk.Stack(app, 'Wave1Stage1StackE');
    const wave1Stage1StackF = new cdk.Stack(app, 'Wave1Stage1StackF');
    wave1Stage1StackB.addDependency(wave1Stage1StackA);
    wave1Stage1StackC.addDependency(wave1Stage1StackA);
    wave1Stage1StackD.addDependency(wave1Stage1StackB);
    wave1Stage1StackE.addDependency(wave1Stage1StackF);
    wave1Stage1StackD.addDependency(wave1Stage1StackF);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2StackA = new cdk.Stack(app, 'Wave1Stage2StackA');

    /* === Wave 2, Stage 1 === */
    const wave2Stage1StackA = new cdk.Stack(app, 'Wave2Stage1StackA');
    const wave2Stage1StackB = new cdk.Stack(app, 'Wave2Stage1StackB');
    wave2Stage1StackB.addDependency(wave2Stage1StackA);

    const expressPipeline = new CdkExpressPipelineLegacy();
    // process.env.CDK_CONTEXT_JSON = JSON.stringify({ 'aws:cdk:bundling-stacks': 'Wave1Stage2*' });
    expressPipeline.synth([
      {
        id: 'Wave1',
        stages: [{
          id: 'Stage1',
          stacks: [
            wave1Stage1StackA,
            wave1Stage1StackB,
            wave1Stage1StackC,
            wave1Stage1StackD,
            wave1Stage1StackE,
            wave1Stage1StackF,
          ],
        },
        {
          id: 'Stage2',
          stacks: [
            wave1Stage2StackA,
          ],
        }],
      },
      {
        id: 'Wave2',
        stages: [
          {
            id: 'Stage1',
            stacks: [
              wave2Stage1StackA,
              wave2Stage1StackB,
            ],
          },
        ],
      },
    ]);
    app.synth();

    // Check that the first stack in each wave depends on each other
    const wave2Stage1StackADeps = wave2Stage1StackA.dependencies.map((dependent) => dependent.stackId);
    expect(wave2Stage1StackADeps.filter((dependentStackId: string) => dependentStackId === wave1Stage1StackA.stackId).length).toBe(1);
  });

  test('Builder pattern', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipelineLegacy();

    /* === Wave 1 === */
    const wave1 = expressPipeline.addWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = wave1Stage1.addStack(new cdk.Stack(app, 'Wave1Stage1StackA'));
    const wave1Stage1StackB = wave1Stage1.addStack(new cdk.Stack(app, 'Wave1Stage1StackB'));
    wave1Stage1StackB.addDependency(wave1Stage1StackA);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = wave1.addStage('Stage2');
    wave1Stage2.addStack(new cdk.Stack(app, 'Wave1Stage2StackC'));


    /* === Wave 2, Stage 1 === */
    const wave2 = expressPipeline.addWave('Wave2');
    /* --- Wave 2, Stage 1--- */
    const wave2Stage1 = wave2.addStage('Stage1');
    wave2Stage1.addStack(new cdk.Stack(app, 'Wave2Stage1StackD'));

    expressPipeline.synth();
  });

  test('Extend cdk.Stack classes', () => {
    const app = new App();

    class MyExpressLegacyStack extends cdk.Stack {
      constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        const stackName = 'My' + id;
        super(scope, id, {
          ...props,
          stackName: stackName,
        });
      }
    }

    const expressPipeline = new CdkExpressPipelineLegacy();
    const wave1Stage1StackA = new MyExpressLegacyStack(app, 'Wave1Stage1StackA');
    expressPipeline.synth([
      {
        id: 'Wave1',
        stages: [{
          id: 'Stage1',
          stacks: [
            wave1Stage1StackA,
          ],
        }],
      },
    ]);

    expect(wave1Stage1StackA.stackName).toBe('MyWave1Stage1StackA');

  });
});