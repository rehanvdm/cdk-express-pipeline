import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { CdkExpressPipeline } from '../src';
import CdkExpressPipelineLegacy from '../src/cdk-express-pipeline-legacy';
import { ExpressStack } from '../src/express-stack';
import { ExpressStage } from '../src/express-stage';
import { ExpressWave } from '../src/express-wave';

const jestConsole = console;

// TODO: Test to make sure 2 stacks depend on each other after .synth
// TODO: Is Extending an ExpressStack possible? Might have to to test in child project that uses the JSII compiled JS

describe('Legacy', () => {

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
    const wave1Stage1StackC = wave1Stage1.addStack(new cdk.Stack(app, 'Wave1Stage1StackC'));
    const wave1Stage1StackD = wave1Stage1.addStack(new cdk.Stack(app, 'Wave1Stage1StackD'));
    const wave1Stage1StackE = wave1Stage1.addStack(new cdk.Stack(app, 'Wave1Stage1StackE'));
    const wave1Stage1StackF = wave1Stage1.addStack(new cdk.Stack(app, 'Wave1Stage1StackF'));
    wave1Stage1StackB.addDependency(wave1Stage1StackA);
    wave1Stage1StackC.addDependency(wave1Stage1StackA);
    wave1Stage1StackD.addDependency(wave1Stage1StackB);
    wave1Stage1StackE.addDependency(wave1Stage1StackF);
    wave1Stage1StackD.addDependency(wave1Stage1StackF);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = wave1.addStage('Stage2');
    wave1Stage2.addStack(new cdk.Stack(app, 'Wave1Stage2StackA'));


    /* === Wave 2, Stage 1 === */
    const wave2 = expressPipeline.addWave('Wave2');
    /* --- Wave 2, Stage 1--- */
    const wave2Stage1 = wave2.addStage('Stage1');
    const wave2Stage1StackA = wave2Stage1.addStack(new cdk.Stack(app, 'Wave2Stage1StackA'));
    const wave2Stage1StackB = wave2Stage1.addStack(new cdk.Stack(app, 'Wave2Stage1StackB'));
    wave2Stage1StackB.addDependency(wave2Stage1StackA);

    expressPipeline.synth();
  });

});

describe('Original', () => {

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
    const wave1 = new ExpressWave({ id: 'Wave1' });
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = new ExpressStage({
      id: 'Stage1',
      wave: wave1,
    });
    const wave1Stage1StackA = new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackA',
      stage: wave1Stage1,
    });
    const wave1Stage1StackB = new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackB',
      stage: wave1Stage1,
    });
    const wave1Stage1StackC = new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackC',
      stage: wave1Stage1,
    });
    const wave1Stage1StackD = new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackD',
      stage: wave1Stage1,
    });
    const wave1Stage1StackE = new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackE',
      stage: wave1Stage1,
    });
    const wave1Stage1StackF = new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackF',
      stage: wave1Stage1,
    });
    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackC.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackB);
    wave1Stage1StackE.addExpressDependency(wave1Stage1StackF);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackF);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = new ExpressStage({
      id: 'Stage2',
      wave: wave1,
    });
    new ExpressStack({
      scope: app,
      id: 'Wave1Stage1StackF',
      stage: wave1Stage2,
    });

    /* === Wave 2 === */
    const wave2 = new ExpressWave({ id: 'Wave2' });
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = new ExpressStage({
      id: 'Stage1',
      wave: wave2,
    });
    const wave2Stage1StackA = new ExpressStack({
      scope: app,
      id: 'Wave2Stage1StackA',
      stage: wave2Stage1,
    });
    const wave2Stage1StackB = new ExpressStack({
      scope: app,
      id: 'Wave2Stage1StackB',
      stage: wave2Stage1,
    });
    wave2Stage1StackB.addExpressDependency(wave2Stage1StackA);

    const expressPipeline = new CdkExpressPipeline({
      waves: [wave1, wave2],
    });
    // //OR
    // const expressPipeline = new CdkExpressPipeline();
    // expressPipeline.waves.push(wave1);
    // expressPipeline.waves.push(wave2);
    expressPipeline.synth(expressPipeline.waves);
  });


  test('Builder pattern', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();

    /* === Wave 1 === */
    const wave1 = expressPipeline.addWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = wave1Stage1.addStack({
      scope: app,
      id: 'Wave1Stage1StackA',
    });
    const wave1Stage1StackB = wave1Stage1.addStack({
      scope: app,
      id: 'Wave1Stage1StackB',
    });
    const wave1Stage1StackC = wave1Stage1.addStack({
      scope: app,
      id: 'Wave1Stage1StackC',
    });
    const wave1Stage1StackD = wave1Stage1.addStack({
      scope: app,
      id: 'Wave1Stage1StackD',
    });
    const wave1Stage1StackE = wave1Stage1.addStack({
      scope: app,
      id: 'Wave1Stage1StackE',
    });
    const wave1Stage1StackF = wave1Stage1.addStack({
      scope: app,
      id: 'Wave1Stage1StackF',
    });

    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackC.addExpressDependency(wave1Stage1StackA);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackB);
    wave1Stage1StackE.addExpressDependency(wave1Stage1StackF);
    wave1Stage1StackD.addExpressDependency(wave1Stage1StackF);
    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = wave1.addStage('Stage2');
    wave1Stage2.addStack({
      scope: app,
      id: 'Wave1Stage2StackA',
    });

    /* === Wave 2 === */
    const wave2 = expressPipeline.addWave('Wave2');
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = wave2.addStage('Stage1');
    const wave2Stage1StackA = wave2Stage1.addStack({
      scope: app,
      id: 'Wave2Stage1StackA',
    });
    const wave2Stage1StackB = wave2Stage1.addStack({
      scope: app,
      id: 'Wave2Stage1StackB',
    });
    wave2Stage1StackB.addExpressDependency(wave2Stage1StackA);

    expressPipeline.synth();
  });

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

  test('Default separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = wave1Stage1.addStack({
      scope: app,
      id: 'stack-a',
    });

    expect(stackA.id).toBe('Wave1_Stage1_stack-a');
  });

  test('Double dash separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline({ separator: '--' });
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = wave1Stage1.addStack({
      scope: app,
      id: 'stack-a',
    });

    expect(stackA.id).toBe('Wave1--Stage1--stack-a');
  });

  test('Negative - Wave separator not the same as pipeline', () => {
    const expressPipeline = new CdkExpressPipeline();
    expressPipeline.addWave('Wave1');

    const wave2 = new ExpressWave({
      id: 'Wave2',
      separator: '--',
    });
    expressPipeline.waves.push(wave2);

    expect(() => expressPipeline.synth()).toThrowError('The wave \'Wave2\' separator \'--\' does not match the pipeline separator \'_\'');
  });

  test('Stack custom name', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline({ separator: '--' });
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = wave1Stage1.addStack({
      scope: app,
      id: 'stack-a',
      stackProps: {
        stackName: 'custom-name',
      },
    });

    expect(stackA.stackName).toBe('custom-name');
  });

  test('Negative - Stack name with illegal separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');

    expect(() => wave1Stage1.addStack({
      scope: app,
      id: 'stack_a',
    })).toThrowError('ExpressStack \'stack_a\' cannot contain a \'_\' (separator)');
  });

  test('Negative - Cross stage stack dependencies', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = wave1Stage1.addStack({
      scope: app,
      id: 'stack-a',
    });

    const wave2 = expressPipeline.addWave('Wave2');
    const wave2Stage1 = wave2.addStage('Stage1');
    const wave2Stage1StackA = wave2Stage1.addStack({
      scope: app,
      id: 'stack-a',
    });

    expect(() => wave2Stage1StackA.addExpressDependency(wave1Stage1StackA)).toThrowError(
      'Incorrect Stack Dependency. Stack Wave2_Stage1_stack-a in [Wave2 & Stage1] ' +
      'can not depend on Wave1_Stage1_stack-a in Stage [Wave1 & Stage1]. Stacks can only ' +
      'depend on other stacks within the same [Wave & Stage].');
  });

  test('Negative - Calling .addDependency on ExpressStack', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = wave1Stage1.addStack({
      scope: app,
      id: 'stack-a',
    });
    const wave1Stage1StackB = wave1Stage1.addStack({
      scope: app,
      id: 'stack-b',
    });


    expect(() => wave1Stage1StackB.addDependency(wave1Stage1StackA)).toThrowError(
      'Use `addExpressDependency` instead of `addDependency` to add to an `ExpressStack` dependency.');
  });

  test('Negative - Calling .dependency on ExpressStack', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = wave1Stage1.addStack({
      scope: app,
      id: 'stack-a',
    });


    expect(() => wave1Stage1StackA.dependencies).toThrowError(
      'Use `expressDependencies()` instead of `dependencies` to get the dependencies of an `ExpressStack`.');
  });

});