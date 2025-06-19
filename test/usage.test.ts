import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { App, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR,
  CdkExpressPipeline,
  ExpressStack,
  ExpressStage,
  ExpressWave,
} from '../src';
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


    /* === Wave 2 === */
    const wave2 = expressPipeline.addWave('Wave2');
    /* --- Wave 2, Stage 1 === */
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

  describe('Correct Stack Highlight for deployment', () => {
    const app = new App();
    /* === Wave 1 === */
    const wave1Stage1StackA = new cdk.Stack(app, 'Wave1Stage1StackA');
    const wave1Stage1StackB = new cdk.Stack(app, 'Wave1Stage1StackB');
    const wave1Stage1StackC = new cdk.Stack(app, 'Wave1Stage1StackC');
    wave1Stage1StackB.addDependency(wave1Stage1StackA);

    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2StackD = new cdk.Stack(app, 'Wave1Stage2StackD');

    /* === Wave 2 === */
    const wave2Stage1StackE = new cdk.Stack(app, 'Wave2Stage1StackE');
    const wave2Stage1StackF = new cdk.Stack(app, 'Wave2Stage1StackF');
    wave2Stage1StackF.addDependency(wave2Stage1StackE);

    const waves = [
      {
        id: 'Wave1',
        stages: [
          {
            id: 'Stage1',
            stacks: [wave1Stage1StackA, wave1Stage1StackB, wave1Stage1StackC],
          },
          {
            id: 'Stage2',
            stacks: [wave1Stage2StackD],
          },
        ],
      },
      {
        id: 'Wave2',
        stages: [
          {
            id: 'Stage1',
            stacks: [wave2Stage1StackE, wave2Stage1StackF],
          },
        ],
      },
    ];

    const pipeline = new CdkExpressPipelineLegacy();
    const testArray = [
      {
        pattern: '**',
        testName: 'all stacks (**)',
      },
      {
        pattern: 'Wave1Stage1*',
        testName: 'Wave1Stage1* pattern',
      },
    ];

    test.each(testArray)('Testing Legacy Pipeline: $testName', ({
      pattern,
    }) => {
      let consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.CDK_CONTEXT_JSON = JSON.stringify({ 'aws:cdk:bundling-stacks': [pattern] });

      pipeline.printWaves(waves);

      process.env.CDK_CONTEXT_JSON = '';
      const actual = consoleLogSpy.mock.calls.join('\n');
      consoleLogSpy.mockRestore();

      expect(actual).toMatchSnapshot();
    });
  });

  test('Sequential Stages', () => {
    const app = new App();

    /* === Wave 1 === */
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1StackA = new cdk.Stack(app, 'Wave1Stage1StackA');
    const wave1Stage1StackB = new cdk.Stack(app, 'Wave1Stage1StackB');

    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2StackA = new cdk.Stack(app, 'Wave1Stage2StackA');
    const wave1Stage2StackB = new cdk.Stack(app, 'Wave1Stage2StackB');

    /* --- Wave 1, Stage 3 --- */
    const wave1Stage3StackA = new cdk.Stack(app, 'Wave1Stage3StackA');

    /* === Wave 2 === */
    /* === Wave 2, Stage 1 === */
    const wave2Stage1StackH = new cdk.Stack(app, 'Wave2Stage1StackH');

    /* === Wave 2, Stage 2 === */
    const wave2Stage2StackI = new cdk.Stack(app, 'Wave2Stage2StackI');

    const expressPipeline = new CdkExpressPipelineLegacy();
    expressPipeline.synth([
      {
        id: 'Wave1',
        sequentialStages: true,
        stages: [
          {
            id: 'Stage1',
            stacks: [wave1Stage1StackA, wave1Stage1StackB],
          },
          {
            id: 'Stage2',
            stacks: [wave1Stage2StackA, wave1Stage2StackB],
          },
          {
            id: 'Stage3',
            stacks: [wave1Stage3StackA],
          },
        ],
      },
      {
        id: 'Wave2',
        sequentialStages: true,
        stages: [
          {
            id: 'Stage1',
            stacks: [wave2Stage1StackH],
          },
          {
            id: 'Stage2',
            stacks: [wave2Stage2StackI],
          },
        ],
      },
    ]);
    app.synth();

    // Check that Wave 1 Stage 2 Stack A has a dependency on Stage 1 Stack A and Stage 1 Stack B
    const wave1Stage2StackADeps = wave1Stage2StackA.dependencies.map((dependent) => dependent.stackId);
    expect(wave1Stage2StackADeps).toContain(wave1Stage1StackA.stackId);
    expect(wave1Stage2StackADeps).toContain(wave1Stage1StackB.stackId);

    // Stacks Wave 1 Stage 2 in a stage not dependent on each other and will run in parallel
    const wave1Stage2StackBDeps = wave1Stage2StackB.dependencies.map((dependent) => dependent.stackId);
    expect(wave1Stage2StackBDeps).toEqual(wave1Stage2StackADeps);

    // Check that Wave 1 Stage 3 Stack A has a dependency on Wave 1 Stage 2 Stack A
    const wave1Stage3StackADeps = wave1Stage3StackA.dependencies.map((dependent) => dependent.stackId);
    expect(wave1Stage3StackADeps).toContain(wave1Stage2StackA.stackId);

    // Check that Wave 2 Stage 1 Stack H has a dependency on Wave 1 Stage 3 Stack A
    const wave2Stage1StackHDeps = wave2Stage1StackH.dependencies.map((dependent) => dependent.stackId);
    expect(wave2Stage1StackHDeps).toContain(wave1Stage3StackA.stackId);

    // Check that Wave 2 Stage 2 Stack I has a dependency on Wave 2 Stage 1 Stack H
    const wave2Stage2StackIDeps = wave2Stage2StackI.dependencies.map((dependent) => dependent.stackId);
    expect(wave2Stage2StackIDeps).toContain(wave2Stage1StackH.stackId);
  });

});

describe('CdkExpressPipeline', () => {

  beforeEach(() => {
    /* Disable Jest's console.log that adds the location of log lines */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    global.console = require('console');
  });
  afterEach(() => {
    /* Restore Jest's console */
    global.console = jestConsole;
  });

  test('Explicit', () => {
    const app = new App();

    /* === Wave 1 === */
    const wave1 = new ExpressWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = new ExpressStage('Stage1', wave1);
    const wave1Stage1StackA = new ExpressStack(app, 'StackA', wave1Stage1);
    const wave1Stage1StackB = new ExpressStack(app, 'StackB', wave1Stage1);
    const wave1Stage1StackC = new ExpressStack(app, 'StackC', wave1Stage1);
    const wave1Stage1StackD = new ExpressStack(app, 'StackD', wave1Stage1);
    const wave1Stage1StackE = new ExpressStack(app, 'StackE', wave1Stage1);
    const wave1Stage1StackF = new ExpressStack(app, 'StackF', wave1Stage1);
    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackC.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackB);
    wave1Stage1StackE.addExpressDependency(wave1Stage1StackF);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackF);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = new ExpressStage('Stage2', wave1);
    new ExpressStack(app, 'StackA', wave1Stage2);

    /* === Wave 2 === */
    const wave2 = new ExpressWave('Wave2');
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = new ExpressStage('Stage1', wave2);
    const wave2Stage1StackH = new ExpressStack(app, 'StackH', wave2Stage1);
    const wave2Stage1StackI = new ExpressStack(app, 'StackI', wave2Stage1);
    wave2Stage1StackI.addExpressDependency(wave2Stage1StackH);

    const expressPipeline = new CdkExpressPipeline({
      waves: [wave1, wave2],
    });
    // //OR
    // const expressPipeline = new CdkExpressPipeline();
    // expressPipeline.waves.push(wave1);
    // expressPipeline.waves.push(wave2);
    expressPipeline.synth(expressPipeline.waves);
    app.synth();

    // Check that the first stack in each wave depends on each other
    const wave2Stage1StackIDeps = wave2Stage1StackH.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave2Stage1StackIDeps.filter((dependentStackId: string) => dependentStackId === wave1Stage1StackA.stackId).length).toBe(1);
  });

  test('Builder pattern', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();

    /* === Wave 1 === */
    const wave1 = expressPipeline.addWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = wave1.addStage('Stage1');

    const wave1Stage1StackA = new ExpressStack(app, 'StackA', wave1Stage1);
    const wave1Stage1StackB = new ExpressStack(app, 'StackB', wave1Stage1);
    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);

    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = wave1.addStage('Stage2');
    new ExpressStack(app, 'StackC', wave1Stage2);

    /* === Wave 2 === */
    const wave2 = expressPipeline.addWave('Wave2');
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = wave2.addStage('Stage1');
    new ExpressStack(app, 'StackD', wave2Stage1);

    expressPipeline.synth();
  });

  test('Extend stack class', () => {
    const app = new App();

    // --- Custom Stack Class ---
    class MyExpressStack extends ExpressStack {
      constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
        super(scope, 'My' + id, stage, stackProps);
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new MyExpressStack(app, 'StackA', wave1Stage1);
    expressPipeline.synth([wave1]);

    expect(stackA.id).toBe('Wave1_Stage1_MyStackA');
  });

  test('Extend all classes', () => {
    const app = new App();

    // --- Custom Wave Class ---
    class MyExpressWave extends ExpressWave {
      constructor(id: string) {
        super('My' + id);
      }
    }

    // --- Custom Stage Class ---
    class MyExpressStage extends ExpressStage {
      constructor(id: string, wave: ExpressWave) {
        super('My' + id, wave);
      }
    }

    // --- Custom Stack Class ---
    class MyExpressStack extends ExpressStack {
      constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
        super(scope, 'My' + id, stage, stackProps);
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = new MyExpressWave('Wave1');
    const wave1Stage1 = new MyExpressStage('Stage1', wave1);
    const stackA = new MyExpressStack(app, 'StackA', wave1Stage1);
    expressPipeline.synth([wave1]);

    expect(stackA.id).toBe('MyWave1_MyStage1_MyStackA');
  });

  describe('Correct Stack Highlight for deployment', () => {
    const app = new App();
    /* === Wave 1 === */
    const wave1 = new ExpressWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = new ExpressStage('Stage1', wave1);
    const wave1Stage1StackA = new ExpressStack(app, 'StackA', wave1Stage1);
    const wave1Stage1StackB = new ExpressStack(app, 'StackB', wave1Stage1);
    new ExpressStack(app, 'StackC', wave1Stage1);
    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);

    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = new ExpressStage('Stage2', wave1);
    new ExpressStack(app, 'StackD', wave1Stage2);

    /* === Wave 2 === */
    const wave2 = new ExpressWave('Wave2');
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = new ExpressStage('Stage1', wave2);
    const wave2Stage1StackH = new ExpressStack(app, 'StackE', wave2Stage1);
    const wave2Stage1StackI = new ExpressStack(app, 'StackF', wave2Stage1);
    wave2Stage1StackI.addExpressDependency(wave2Stage1StackH);

    const waves = [wave1, wave2];
    const pipeline = new CdkExpressPipeline({
      waves,
    });
    const testArray = [
      {
        pattern: '**',
        testName: 'all stacks (**)',
      },
      {
        pattern: 'Wave1_Stage1_*',
        testName: 'Wave1_Stage1_* pattern',
      },
      {
        pattern: 'Wave1_Stage1*',
        testName: 'Wave1_Stage1* pattern',
      },
      {
        pattern: 'Wave2_*',
        testName: 'Wave2_* pattern',
      },
      {
        pattern: 'Wave1_Stage1_StackB',
        testName: 'Wave1_Stage1_StackB pattern',
      },
    ];

    test.each(testArray)('Testing: $testName', ({
      pattern,
    }) => {
      let consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.CDK_CONTEXT_JSON = JSON.stringify({ 'aws:cdk:bundling-stacks': [pattern] });

      pipeline.printWaves(waves);

      process.env.CDK_CONTEXT_JSON = '';
      const actual = consoleLogSpy.mock.calls.join('\n');
      consoleLogSpy.mockRestore();

      expect(actual).toMatchSnapshot();
    });
  });

  test('Sequential Stages', () => {
    const app = new App();

    /* === Wave 1 === */
    const wave1 = new ExpressWave('Wave1', CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR, true);
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = new ExpressStage('Stage1', wave1);
    const wave1Stage1StackA = new ExpressStack(app, 'StackA', wave1Stage1);
    const wave1Stage1StackB = new ExpressStack(app, 'StackB', wave1Stage1);

    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = new ExpressStage('Stage2', wave1);
    const wave1Stage2StackA = new ExpressStack(app, 'StackA', wave1Stage2);
    const wave1Stage2StackB = new ExpressStack(app, 'StackB', wave1Stage2);

    // /* --- Wave 1, Stage 3 --- */
    const wave1Stage3 = new ExpressStage('Stage3', wave1);
    const wave1Stage3StackA = new ExpressStack(app, 'StackA', wave1Stage3);

    //
    /* === Wave 2 === */
    const wave2 = new ExpressWave('Wave2', CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR, true);
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = new ExpressStage('Stage1', wave2);
    const wave2Stage1StackH = new ExpressStack(app, 'StackH', wave2Stage1);
    /* === Wave 2, Stage 2 === */
    const wave2Stage2 = new ExpressStage('Stage2', wave2);
    const wave2Stage2StackI = new ExpressStack(app, 'StackI', wave2Stage2);

    const expressPipeline = new CdkExpressPipeline({
      waves: [
        wave1,
        wave2,
      ],
    });

    expressPipeline.synth(expressPipeline.waves);
    app.synth();

    // Check that Wave 1 Stage 2 Stack A has a dependency on Stage 2 Stack A and Stage 2 Stack B
    const wave1Stage2StackADeps = wave1Stage2StackA.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave1Stage2StackADeps).toContain(wave1Stage1StackA.stackId);
    expect(wave1Stage2StackADeps).toContain(wave1Stage1StackB.stackId);

    // Stacks Wave 1 Stage 2 in a stage not dependent on each other and will run in parallel
    const wave1Stage2StackBDeps = wave1Stage2StackB.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave1Stage2StackBDeps).toEqual(wave1Stage2StackADeps);

    // Check that Wave 1 Stage 3 Stack A has a dependency on Wave 1 Stage 2 Stack A
    const wave1Stage3StackADeps = wave1Stage3StackA.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave1Stage3StackADeps).toContain(wave1Stage2StackA.stackId);

    // Check that Wave 2 Stage 1 Stack H has a dependency on Wave 1 Stage 3 Stack A
    const wave2Stage1StackHDeps = wave2Stage1StackH.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave2Stage1StackHDeps).toContain(wave1Stage3StackA.stackId);
    // Check that Wave 2 Stage 2 Stack I has a dependency on Wave 2 Stage 1 Stack H
    const wave2Stage2StackIDeps = wave2Stage2StackI.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave2Stage2StackIDeps).toContain(wave2Stage1StackH.stackId);
  });

  test('Mermaid diagram generation', () => {
    const app = new App();

    /* === Wave 1 === */
    const wave1 = new ExpressWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = new ExpressStage('Stage1', wave1);
    const wave1Stage1StackA = new ExpressStack(app, 'StackA', wave1Stage1);
    const wave1Stage1StackB = new ExpressStack(app, 'StackB', wave1Stage1);
    const wave1Stage1StackC = new ExpressStack(app, 'StackC', wave1Stage1);
    const wave1Stage1StackD = new ExpressStack(app, 'StackD', wave1Stage1);
    const wave1Stage1StackE = new ExpressStack(app, 'StackE', wave1Stage1);
    const wave1Stage1StackF = new ExpressStack(app, 'StackF', wave1Stage1);
    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackC.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackB);
    wave1Stage1StackE.addExpressDependency(wave1Stage1StackF);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackF);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = new ExpressStage('Stage2', wave1);
    new ExpressStack(app, 'StackA', wave1Stage2);
    const wave1Stage2StackB = new ExpressStack(app, 'StackB', wave1Stage2);
    const wave1Stage2StackC = new ExpressStack(app, 'StackC', wave1Stage2);
    wave1Stage2StackC.addExpressDependency(wave1Stage2StackB);

    /* === Wave 2 === */
    const wave2 = new ExpressWave('Wave2');
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = new ExpressStage('Stage1', wave2);
    new ExpressStack(app, 'StackH', wave2Stage1);
    new ExpressStack(app, 'StackI', wave2Stage1);

    const wave2Stage2 = new ExpressStage('Stage2', wave2);
    new ExpressStack(app, 'StackJ', wave2Stage2);
    new ExpressStack(app, 'StackK', wave2Stage2);

    /* === Wave 3 === */
    const wave3 = new ExpressWave('Wave3', CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR, true);
    /* === Wave 3, Stage 1 === */
    const wave3Stage1 = new ExpressStage('Stage1', wave3);
    new ExpressStack(app, 'StackL', wave3Stage1);
    new ExpressStack(app, 'StackM', wave3Stage1);

    const wave3Stage2 = new ExpressStage('Stage2', wave3);
    new ExpressStack(app, 'StackN', wave3Stage2);
    new ExpressStack(app, 'StackO', wave3Stage2);

    const expressPipeline = new CdkExpressPipeline({
      waves: [wave1, wave2, wave3],
    });
    expressPipeline.printWaves(expressPipeline.waves);
    const mermaidOutput = expressPipeline.generateMermaidDiagram(expressPipeline.waves);
    fs.writeFileSync( path.join(process.cwd(), 'deployment-order.md'), mermaidOutput);
    expect(mermaidOutput).toMatchSnapshot();
  });

});