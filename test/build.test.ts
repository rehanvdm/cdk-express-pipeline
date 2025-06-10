import { App } from 'aws-cdk-lib';
import { CdkExpressPipeline, ExpressStack, ExpressWave } from '../src';

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

});

