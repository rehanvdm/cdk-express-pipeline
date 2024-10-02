import { App } from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib/core/lib/stack';
import { Construct } from 'constructs';
import { CdkExpressPipeline, ExpressStack, ExpressStage, ExpressWave, printWaves } from '../src';

const jestConsole = console;

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


  //TODO: In Demo project tests - Select all Stacks in Wave 1
  //TODO: In Demo project tests - Select all Stacks in Wave 1 Stage 1
});

describe('Test build arguments', () => {

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

  test('Default separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new ExpressStack(app, 'StackA', wave1Stage1);

    expect(stackA.id).toBe('Wave1_Stage1_StackA');
  });

  test('Double dash separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline({ separator: '--' });
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new ExpressStack(app, 'StackA', wave1Stage1);

    expect(stackA.id).toBe('Wave1--Stage1--StackA');
  });

  test('Negative - Wave separator not the same as pipeline', () => {
    const expressPipeline = new CdkExpressPipeline();
    expressPipeline.addWave('Wave1');

    const wave2 = new ExpressWave('Wave2', '--');
    expressPipeline.waves.push(wave2);

    expect(() => expressPipeline.synth()).toThrowError('The wave \'Wave2\' separator \'--\' does not match the pipeline separator \'_\'');
  });

  test('Stack custom name', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline({ separator: '--' });
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new ExpressStack(app, 'StackA', wave1Stage1,
      {
        stackName: 'custom-name',
      });

    expect(stackA.stackName).toBe('custom-name');
  });

  test('Negative - Stack name with illegal separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');

    expect(() =>
      new ExpressStack(app, 'Stack_A', wave1Stage1)).toThrowError('ExpressStack \'Stack_A\' cannot contain a \'_\' (separator)');
  });

  test('Negative - Cross stage stack dependencies', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = new ExpressStack(app, 'StackA', wave1Stage1);

    const wave2 = expressPipeline.addWave('Wave2');
    const wave2Stage1 = wave2.addStage('Stage1');
    const wave2Stage1StackB = new ExpressStack(app, 'StackB', wave2Stage1);

    expect(() => wave2Stage1StackB.addExpressDependency(wave1Stage1StackA)).toThrowError(
      'Incorrect Stack Dependency. Stack Wave2_Stage1_StackB in [Wave2 & Stage1] ' +
      'can not depend on Wave1_Stage1_StackA in Stage [Wave1 & Stage1]. Stacks can only ' +
      'depend on other stacks within the same [Wave & Stage].');
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

    const testArray = [
      {
        pattern: '**',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially\n' +
          '🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time\n' +
          '📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, are deployed. A stack with > matches the CDK pattern provided\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🔲 Stage1\n' +
          '|     📄 StackA (Wave1_Stage1_StackA)\n' +
          '|     📄 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '|     📄 StackC (Wave1_Stage1_StackC)\n' +
          '|   🔲 Stage2\n' +
          '|     📄 StackD (Wave1_Stage2_StackD)\n' +
          '| 🌊 Wave2\n' +
          '|   🔲 Stage1\n' +
          '|     📄 StackE (Wave2_Stage1_StackE)\n' +
          '|     📄 StackF (Wave2_Stage1_StackF)\n' +
          '|        ↳ StackE\n',
      },
      {
        pattern: 'Wave1_Stage1_*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially\n' +
          '🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time\n' +
          '📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, are deployed. A stack with > matches the CDK pattern provided\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🔲 Stage1\n' +
          '|     📄 StackA (Wave1_Stage1_StackA)\n' +
          '|     📄 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '|     📄 StackC (Wave1_Stage1_StackC)\n' +
          '    🔲 Stage2\n' +
          '      📄 StackD (Wave1_Stage2_StackD)\n' +
          '  🌊 Wave2\n' +
          '    🔲 Stage1\n' +
          '      📄 StackE (Wave2_Stage1_StackE)\n' +
          '      📄 StackF (Wave2_Stage1_StackF)\n' +
          '         ↳ StackE\n',
      },
      {
        pattern: 'Wave1_Stage1*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially\n' +
          '🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time\n' +
          '📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, are deployed. A stack with > matches the CDK pattern provided\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🔲 Stage1\n' +
          '|     📄 StackA (Wave1_Stage1_StackA)\n' +
          '|     📄 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '|     📄 StackC (Wave1_Stage1_StackC)\n' +
          '    🔲 Stage2\n' +
          '      📄 StackD (Wave1_Stage2_StackD)\n' +
          '  🌊 Wave2\n' +
          '    🔲 Stage1\n' +
          '      📄 StackE (Wave2_Stage1_StackE)\n' +
          '      📄 StackF (Wave2_Stage1_StackF)\n' +
          '         ↳ StackE\n',
      },
      {
        pattern: 'Wave2_*',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially\n' +
          '🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time\n' +
          '📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, are deployed. A stack with > matches the CDK pattern provided\n' +
          '\n' +
          '  🌊 Wave1\n' +
          '    🔲 Stage1\n' +
          '      📄 StackA (Wave1_Stage1_StackA)\n' +
          '      📄 StackB (Wave1_Stage1_StackB)\n' +
          '         ↳ StackA\n' +
          '      📄 StackC (Wave1_Stage1_StackC)\n' +
          '    🔲 Stage2\n' +
          '      📄 StackD (Wave1_Stage2_StackD)\n' +
          '| 🌊 Wave2\n' +
          '|   🔲 Stage1\n' +
          '|     📄 StackE (Wave2_Stage1_StackE)\n' +
          '|     📄 StackF (Wave2_Stage1_StackF)\n' +
          '|        ↳ StackE\n',
      },
      {
        pattern: 'Wave1_Stage1_StackB',
        expected: '\n' +
          'ORDER OF DEPLOYMENT\n' +
          '🌊 Waves  - Deployed sequentially\n' +
          '🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time\n' +
          '📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, are deployed. A stack with > matches the CDK pattern provided\n' +
          '\n' +
          '| 🌊 Wave1\n' +
          '|   🔲 Stage1\n' +
          '      📄 StackA (Wave1_Stage1_StackA)\n' +
          '|     📄 StackB (Wave1_Stage1_StackB)\n' +
          '|        ↳ StackA\n' +
          '      📄 StackC (Wave1_Stage1_StackC)\n' +
          '    🔲 Stage2\n' +
          '      📄 StackD (Wave1_Stage2_StackD)\n' +
          '  🌊 Wave2\n' +
          '    🔲 Stage1\n' +
          '      📄 StackE (Wave2_Stage1_StackE)\n' +
          '      📄 StackF (Wave2_Stage1_StackF)\n' +
          '         ↳ StackE\n',
      },
    ];

    test.each(testArray)('Testing: %s', ({
      // @ts-ignore
      pattern,
      expected,
    }) => {
      let consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      process.env.CDK_CONTEXT_JSON = JSON.stringify({ 'aws:cdk:bundling-stacks': [pattern] });

      printWaves(waves);

      process.env.CDK_CONTEXT_JSON = '';
      const actual = consoleLogSpy.mock.calls.join('\n');
      consoleLogSpy.mockRestore();

      expect(actual).toBe(expected);
    });
  });
});