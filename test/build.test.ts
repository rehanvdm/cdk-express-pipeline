import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib/core/lib/stack';
import { Construct } from 'constructs';
import { CdkExpressPipeline, ExpressStack, ExpressStage, ExpressWave, ExpressWaveProps } from '../src';
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

describe('Readme Examples - CdkExpressPipeline', () => {

  beforeEach(() => {
    /* Disable Jest's console.log that adds the location of log lines */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    global.console = require('console');
  });
  afterEach(() => {
    /* Restore Jest's console */
    global.console = jestConsole;
  });

  // === Stack Definitions each their own class ===
  class StackA extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  class StackB extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  class StackC extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  test('Extend ExpressStack class - Explicit', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();

    // === Wave 1 ===
    const wave1 = expressPipeline.addWave('Wave1');
    // --- Wave 1, Stage 1---
    const wave1Stage1 = wave1.addStage('Stage1');

    const stackA = new StackA(app, 'StackA', wave1Stage1);
    const stackB = new StackB(app, 'StackB', wave1Stage1);
    stackB.addExpressDependency(stackA);

    // === Wave 2 ===
    const wave2 = expressPipeline.addWave('Wave2');
    // --- Wave 2, Stage 1---
    const wave2Stage1 = wave2.addStage('Stage1');
    new StackC(app, 'StackC', wave2Stage1);
    expressPipeline.synth([
      wave1,
      wave2,
    ]);
  });

  test('Extend ExpressStack - Nested', () => {
    const app = new App();

    class Wave1 extends ExpressWave {
      constructor() {
        super('Wave1');
      }
    }

    class Wave1Stage1 extends ExpressStage {
      constructor(wave1: Wave1) {
        super('Stage1', wave1);

        const stackA = new StackA(app, 'StackA', this);
        const stackB = new StackB(app, 'StackB', this);
        stackB.addExpressDependency(stackA);
      }
    }

    class Wave2 extends ExpressWave {
      constructor() {
        super('Wave2');
      }
    }

    class Wave2Stage1 extends ExpressStage {
      constructor(wave2: Wave2) {
        super('Stage1', wave2);

        new StackC(app, 'StackC', this);
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = new Wave1();
    new Wave1Stage1(wave1);
    const wave2 = new Wave2();
    new Wave2Stage1(wave2);
    expressPipeline.synth([wave1, wave2]);
  });

  test('Extend ExpressWave, ExpressStage, ExpressStack classes', () => {
    const app = new App();

    // --- Custom Wave Class ---
    class MyExpressWave extends ExpressWave {
      constructor(props: ExpressWaveProps) {
        super('My' + props.id);
      }
    }

    // --- Custom Stage Class ---
    class MyExpressStage extends ExpressStage {
      constructor(id: string, wave: MyExpressWave, stacks?: MyExpressStack[]) {
        super('My' + id, wave, stacks);
      }
    }

    // --- Custom Stack Class ---
    class MyExpressStack extends ExpressStack {
      constructor(scope: Construct, id: string, stage: MyExpressStage, stackProps?: StackProps) {
        super(scope, 'My' + id, stage, stackProps);
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = new MyExpressWave({ id: 'Wave1' });
    const wave1Stage1 = new MyExpressStage('Stage1', wave1);
    const stackA = new MyExpressStack(app, 'StackA', wave1Stage1);
    expressPipeline.synth([wave1]);

    expect(stackA.id).toBe('MyWave1_MyStage1_MyStackA');
  });
});

describe('Readme Examples - CdkExpressPipelineLegacy', () => {

  beforeEach(() => {
    /* Disable Jest's console.log that adds the location of log lines */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    global.console = require('console');
  });
  afterEach(() => {
    /* Restore Jest's console */
    global.console = jestConsole;
  });

  // === Stack Definitions each their own class ===
  class StackA extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      new cdk.aws_sns.Topic(this, 'MyTopicA');
      // ... more resources
    }
  }

  class StackB extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      new cdk.aws_sns.Topic(this, 'MyTopicB');
      // ... more resources
    }
  }

  class StackC extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      new cdk.aws_sns.Topic(this, 'MyTopicC');
      // ... more resources
    }
  }

  test('Extend cdk.Stack class - Explicit', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipelineLegacy();

    /* === Wave 1 === */
    /* --- Wave 1, Stage 1--- */
    const stackA = new StackA(app, 'StackA');
    const stackB = new StackB(app, 'StackB');
    stackB.addDependency(stackA);

    // === Wave 2 ===
    /* --- Wave 2, Stage 1--- */
    const stackC = new StackC(app, 'StackC');

    expressPipeline.synth([
      {
        id: 'Wave1',
        stages: [{
          id: 'Stage1',
          stacks: [
            stackA,
            stackB,
          ],
        }],
      },
      {
        id: 'Wave2',
        stages: [{
          id: 'Stage1',
          stacks: [
            stackC,
          ],
        }],
      },
    ]);

  });

  test('Extend cdk.Stack class', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipelineLegacy();

    /* === Wave 1 === */
    const wave1 = expressPipeline.addWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = wave1Stage1.addStack(new StackA(app, 'StackA'));
    const stackB = wave1Stage1.addStack(new StackB(app, 'StackB'));
    stackB.addDependency(stackA);

    // === Wave 2 ===
    const wave2 = expressPipeline.addWave('Wave2');
    /* --- Wave 2, Stage 1--- */
    const wave2Stage1 = wave2.addStage('Stage1');
    wave2Stage1.addStack(new StackC(app, 'StackC'));

    expressPipeline.synth([
      wave1,
      wave2,
    ]);
  });
});

describe('Adhoc - Test deep stack dependency speed ', () => {

  beforeEach(() => {
    /* Disable Jest's console.log that adds the location of log lines */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    global.console = require('console');
  });
  afterEach(() => {
    /* Restore Jest's console */
    global.console = jestConsole;
  });

  // class StackA extends cdk.Stack {
  //   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
  //     super(scope, id, props);
  //
  //     new cdk.aws_sns.Topic(this, 'MyTopicA');
  //     // ... more resources
  //   }
  // }
  // test('Many stacks - Slow', () => {
  //   const app = new App();
  //
  //   const previousStacks: Stack[] = [];
  //   let numberOfDeps = 0;
  //   for (let i = 0; i < 28; i++) {
  //     console.log(`${new Date().toISOString()} - Creating stack ${i}`);
  //     const stack = new StackA(app, `CdkTestMemoryTsStack${i}`);
  //
  //     for (const previousStack of previousStacks) {
  //       console.log(`${new Date().toISOString()} - Adding dependency${++numberOfDeps} from stack ${previousStack.stackName} to stack ${stack.stackName}`);
  //       stack.addDependency(previousStack);
  //     }
  //
  //     previousStacks.push(stack);
  //   }
  //   app.synth();
  // });


  test('Many stacks - Fast', () => {
    const app = new App();

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = new ExpressWave('Wave1');
    const wave1Stage1 = new ExpressStage('Stage1', wave1);
    expressPipeline.synth([wave1]);

    const previousStacks: ExpressStack[] = [];
    let numberOfDeps = 0;
    for (let i = 0; i < 100; i++) {
      console.log(`${new Date().toISOString()} - Creating stack ${i}`);
      const stack = new ExpressStack(app, `CdkTestMemoryTsStack${i}`, wave1Stage1);

      for (const previousStack of previousStacks) {
        console.log(`${new Date().toISOString()} - Adding dependency${++numberOfDeps} from stack ${previousStack.stackName} to stack ${stack.stackName}`);
        stack.addExpressDependency(previousStack);
      }

      previousStacks.push(stack);
    }
    app.synth();
    expressPipeline.synth([wave1], false);
    //If it completes in the default timeout of 3 seconds, it has passed
  });

});