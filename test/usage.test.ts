import * as cdk from 'aws-cdk-lib';
import { App, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkExpressPipeline, ExpressStack, ExpressStage, ExpressWave } from '../src';
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
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage.\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '  🌊 Wave1\n' +
          '    🏗️ Stage1\n' +
          '|     📦 Wave1Stage1StackA\n' +
          '|     📦 Wave1Stage1StackB\n' +
          '|     📦 Wave1Stage1StackC\n' +
          '    🏗️ Stage2\n' +
          '|     📦 Wave1Stage2StackD\n' +
          '  🌊 Wave2\n' +
          '    🏗️ Stage1\n' +
          '|     📦 Wave2Stage1StackE\n' +
          '|     📦 Wave2Stage1StackF\n',
      },
      {
        pattern: 'Wave1Stage1*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage.\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '  🌊 Wave1\n' +
          '    🏗️ Stage1\n' +
          '|     📦 Wave1Stage1StackA\n' +
          '|     📦 Wave1Stage1StackB\n' +
          '|     📦 Wave1Stage1StackC\n' +
          '    🏗️ Stage2\n' +
          '      📦 Wave1Stage2StackD\n' +
          '  🌊 Wave2\n' +
          '    🏗️ Stage1\n' +
          '      📦 Wave2Stage1StackE\n' +
          '      📦 Wave2Stage1StackF\n',
      },
    ];

    test.each(testArray)('Testing Legacy Pipeline: %s', ({
      pattern,
      expected,
    }) => {
      let consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.CDK_CONTEXT_JSON = JSON.stringify({ 'aws:cdk:bundling-stacks': [pattern] });

      pipeline.printWaves(waves);

      process.env.CDK_CONTEXT_JSON = '';
      const actual = consoleLogSpy.mock.calls.join('\n');
      consoleLogSpy.mockRestore();

      expect(actual).toBe(expected);
    });
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
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage (dependencies shown below them with ↳).\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🏗️ Stage1\n' +
          '|     📦 StackA (Wave1_Stage1_StackA)\n' +
          '|     📦 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '|     📦 StackC (Wave1_Stage1_StackC)\n' +
          '|   🏗️ Stage2\n' +
          '|     📦 StackD (Wave1_Stage2_StackD)\n' +
          '| 🌊 Wave2\n' +
          '|   🏗️ Stage1\n' +
          '|     📦 StackE (Wave2_Stage1_StackE)\n' +
          '|     📦 StackF (Wave2_Stage1_StackF)\n' +
          '|        ↳ StackE\n',
      },
      {
        pattern: 'Wave1_Stage1_*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage (dependencies shown below them with ↳).\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🏗️ Stage1\n' +
          '|     📦 StackA (Wave1_Stage1_StackA)\n' +
          '|     📦 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '|     📦 StackC (Wave1_Stage1_StackC)\n' +
          '    🏗️ Stage2\n' +
          '      📦 StackD (Wave1_Stage2_StackD)\n' +
          '  🌊 Wave2\n' +
          '    🏗️ Stage1\n' +
          '      📦 StackE (Wave2_Stage1_StackE)\n' +
          '      📦 StackF (Wave2_Stage1_StackF)\n' +
          '         ↳ StackE\n',
      },
      {
        pattern: 'Wave1_Stage1*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage (dependencies shown below them with ↳).\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🏗️ Stage1\n' +
          '|     📦 StackA (Wave1_Stage1_StackA)\n' +
          '|     📦 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '|     📦 StackC (Wave1_Stage1_StackC)\n' +
          '    🏗️ Stage2\n' +
          '      📦 StackD (Wave1_Stage2_StackD)\n' +
          '  🌊 Wave2\n' +
          '    🏗️ Stage1\n' +
          '      📦 StackE (Wave2_Stage1_StackE)\n' +
          '      📦 StackF (Wave2_Stage1_StackF)\n' +
          '         ↳ StackE\n',
      },
      {
        pattern: 'Wave2_*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage (dependencies shown below them with ↳).\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '  🌊 Wave1\n' +
          '    🏗️ Stage1\n' +
          '      📦 StackA (Wave1_Stage1_StackA)\n' +
          '      📦 StackB (Wave1_Stage1_StackB)\n' +
          '         ↳ StackA\n' +
          '      📦 StackC (Wave1_Stage1_StackC)\n' +
          '    🏗️ Stage2\n' +
          '      📦 StackD (Wave1_Stage2_StackD)\n' +
          '| 🌊 Wave2\n' +
          '|   🏗️ Stage1\n' +
          '|     📦 StackE (Wave2_Stage1_StackE)\n' +
          '|     📦 StackF (Wave2_Stage1_StackF)\n' +
          '|        ↳ StackE\n',
      },
      {
        pattern: 'Wave1_Stage1_StackB',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially, one after another.\n' +
          '🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.\n' +
          '📦 Stacks - Deployed after their dependant stacks within the stage (dependencies shown below them with ↳).\n' +
          '           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🏗️ Stage1\n' +
          '      📦 StackA (Wave1_Stage1_StackA)\n' +
          '|     📦 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '      📦 StackC (Wave1_Stage1_StackC)\n' +
          '    🏗️ Stage2\n' +
          '      📦 StackD (Wave1_Stage2_StackD)\n' +
          '  🌊 Wave2\n' +
          '    🏗️ Stage1\n' +
          '      📦 StackE (Wave2_Stage1_StackE)\n' +
          '      📦 StackF (Wave2_Stage1_StackF)\n' +
          '         ↳ StackE\n',
      },
    ];

    test.each(testArray)('Testing: %s', ({
      pattern,
      expected,
    }) => {
      let consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.CDK_CONTEXT_JSON = JSON.stringify({ 'aws:cdk:bundling-stacks': [pattern] });

      pipeline.printWaves(waves);

      process.env.CDK_CONTEXT_JSON = '';
      const actual = consoleLogSpy.mock.calls.join('\n');
      consoleLogSpy.mockRestore();

      expect(actual).toBe(expected);
    });
  });


});