import { App } from 'aws-cdk-lib';
import { CdkExpressPipeline, ExpressStack, ExpressStage, ExpressWave } from '../src';

const jestConsole = console;

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
      // @ts-ignore
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

  // test('Prints waves, stages and stacks', () => {
  //   const app = new App();
  //   const expressPipeline = new CdkExpressPipeline();
  //
  //
  //   const wave1 = expressPipeline.addWave('Wave1');
  //   const wave1Stage1 = wave1.addStage('Stage1');
  //   const stackA = new ExpressStack(app, 'StackA', wave1Stage1);
  //   const stackB = new ExpressStack(app, 'StackB', wave1Stage1);
  //   stackB.addExpressDependency(stackA);
  //   const wave1Stage2 = wave1.addStage('Stage2');
  //   new ExpressStack(app, 'StackC', wave1Stage2);
  //
  //   const wave2 = expressPipeline.addWave('Wave2');
  //   const wave2Stage1 = wave2.addStage('Stage1');
  //   new ExpressStack(app, 'StackD', wave2Stage1);
  //
  //   // Mock console.log to capture output
  //   let logs: string = '';
  //   const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation((args: any) => {
  //     logs += args + '\n';
  //   });
  //
  //   expressPipeline.synth([wave1, wave2]);
  //   expect(logs).toEqual(['Wave: Wave1']);
  //
  //   consoleLogSpy.mockClear();
  // });

});

