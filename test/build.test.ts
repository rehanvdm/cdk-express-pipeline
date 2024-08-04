import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkExpressPipeline, ExpressStack, ExpressStackProps, ExpressStage, ExpressStageProps, ExpressWave, ExpressWaveProps } from '../src';
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
        const stackName = 'MY' + id;
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

    expect(wave1Stage1StackA.stackName).toBe('MYWave1Stage1StackA');

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
    const wave1 = new ExpressWave({ id: 'Wave1' });
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = new ExpressStage({
      id: 'Stage1',
      wave: wave1,
    });
    const wave1Stage1StackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });
    const wave1Stage1StackB = new ExpressStack({
      scope: app,
      id: 'StackB',
      stage: wave1Stage1,
    });
    const wave1Stage1StackC = new ExpressStack({
      scope: app,
      id: 'StackC',
      stage: wave1Stage1,
    });
    const wave1Stage1StackD = new ExpressStack({
      scope: app,
      id: 'StackD',
      stage: wave1Stage1,
    });
    const wave1Stage1StackE = new ExpressStack({
      scope: app,
      id: 'StackE',
      stage: wave1Stage1,
    });
    const wave1Stage1StackF = new ExpressStack({
      scope: app,
      id: 'StackF',
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
      id: 'StackG',
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
      id: 'StackH',
      stage: wave2Stage1,
    });
    const wave2Stage1StackB = new ExpressStack({
      scope: app,
      id: 'StackI',
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

    // Check that the first stack in each wave depends on each other
    const wave2Stage1StackADeps = wave2Stage1StackA.expressDependencies().map((dependent) => dependent.stackId);
    expect(wave2Stage1StackADeps.filter((dependentStackId: string) => dependentStackId === wave1Stage1StackA.stackId).length).toBe(1);
  });

  test('Builder pattern', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();

    /* === Wave 1 === */
    const wave1 = expressPipeline.addWave('Wave1');
    /* --- Wave 1, Stage 1--- */
    const wave1Stage1 = wave1.addStage('Stage1');

    const wave1Stage1StackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });
    const wave1Stage1StackB = new ExpressStack({
      scope: app,
      id: 'StackB',
      stage: wave1Stage1,
    });
    wave1Stage1StackB.addExpressDependency(wave1Stage1StackA);

    /* --- Wave 1, Stage 2 --- */
    const wave1Stage2 = wave1.addStage('Stage2');
    new ExpressStack({
      scope: app,
      id: 'StackC',
      stage: wave1Stage2,
    });

    /* === Wave 2 === */
    const wave2 = expressPipeline.addWave('Wave2');
    /* === Wave 2, Stage 1 === */
    const wave2Stage1 = wave2.addStage('Stage1');
    new ExpressStack({
      scope: app,
      id: 'StackD',
      stage: wave2Stage1,
    });

    expressPipeline.synth();
  });

  test('Extend stack class', () => {
    const app = new App();

    // --- Custom Stack Class ---
    class MyExpressStack extends ExpressStack {
      constructor(props: ExpressStackProps) {
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new MyExpressStack({
      scope: app,
      id: 'stack-a',
      stage: wave1Stage1,
    });
    expressPipeline.synth([wave1]);

    expect(stackA.id).toBe('Wave1_Stage1_MYstack-a');
  });

  test('Extend all classes', () => {
    const app = new App();

    // --- Custom Wave Class ---
    class MyExpressWave extends ExpressWave {
      constructor(props: ExpressWaveProps) {
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    // --- Custom Stage Class ---
    interface MyExpressStageProps extends ExpressStageProps {
      wave: MyExpressWave;
      stacks?: MyExpressStack[];
    }

    class MyExpressStage extends ExpressStage {
      constructor(props: MyExpressStageProps) {
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    // --- Custom Stack Class ---
    interface MyExpressStackProps extends ExpressStackProps {
      stage: MyExpressStage;
    }

    class MyExpressStack extends ExpressStack {
      constructor(props: MyExpressStackProps) {
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = new MyExpressWave({ id: 'Wave1' });
    const wave1Stage1 = new MyExpressStage({
      id: 'Stage1',
      wave: wave1,
    });
    const stackA = new MyExpressStack({
      scope: app,
      id: 'stack-a',
      stage: wave1Stage1,
    });
    expressPipeline.synth([wave1]);

    expect(stackA.id).toBe('MYWave1_MYStage1_MYstack-a');
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
    const stackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });

    expect(stackA.id).toBe('Wave1_Stage1_StackA');
  });

  test('Double dash separator', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline({ separator: '--' });
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const stackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });

    expect(stackA.id).toBe('Wave1--Stage1--StackA');
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
    const stackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
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

    expect(() =>
      new ExpressStack({
        scope: app,
        id: 'Stack_a',
        stage: wave1Stage1,
      })).toThrowError('ExpressStack \'Stack_a\' cannot contain a \'_\' (separator)');
  });

  test('Negative - Cross stage stack dependencies', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });

    const wave2 = expressPipeline.addWave('Wave2');
    const wave2Stage1 = wave2.addStage('Stage1');
    const wave2Stage1StackB = new ExpressStack({
      scope: app,
      id: 'StackB',
      stage: wave2Stage1,
    });

    expect(() => wave2Stage1StackB.addExpressDependency(wave1Stage1StackA)).toThrowError(
      'Incorrect Stack Dependency. Stack Wave2_Stage1_StackB in [Wave2 & Stage1] ' +
      'can not depend on Wave1_Stage1_StackA in Stage [Wave1 & Stage1]. Stacks can only ' +
      'depend on other stacks within the same [Wave & Stage].');
  });

  test('Negative - Calling .addDependency on ExpressStack', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });
    const wave1Stage1StackB = new ExpressStack({
      scope: app,
      id: 'StackB',
      stage: wave1Stage1,
    });


    expect(() => wave1Stage1StackB.addDependency(wave1Stage1StackA)).toThrowError(
      'Use `addExpressDependency` instead of `addDependency` to add to an `ExpressStack` dependency.');
  });

  test('Negative - Calling .dependency on ExpressStack', () => {

    const app = new App();
    const expressPipeline = new CdkExpressPipeline();
    const wave1 = expressPipeline.addWave('Wave1');
    const wave1Stage1 = wave1.addStage('Stage1');
    const wave1Stage1StackA = new ExpressStack({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });

    expect(() => wave1Stage1StackA.dependencies).toThrowError(
      'Use `expressDependencies()` instead of `dependencies` to get the dependencies of an `ExpressStack`.');
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
    constructor(props: ExpressStackProps) {
      super({
        ...props,
        id: props.id,
      });

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  class StackB extends ExpressStack {
    constructor(props: ExpressStackProps) {
      super({
        ...props,
        id: props.id,
      });

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  class StackC extends ExpressStack {
    constructor(props: ExpressStackProps) {
      super({
        ...props,
        id: props.id,
      });

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

    const stackA = new StackA({
      scope: app,
      id: 'StackA',
      stage: wave1Stage1,
    });
    const stackB = new StackB({
      scope: app,
      id: 'StackB',
      stage: wave1Stage1,
    });
    stackB.addExpressDependency(stackA);

    // === Wave 2 ===
    const wave2 = expressPipeline.addWave('Wave2');
    // --- Wave 2, Stage 1---
    const wave2Stage1 = wave2.addStage('Stage1');
    new StackC({
      scope: app,
      id: 'StackC',
      stage: wave2Stage1,
    });

    expressPipeline.synth([
      wave1,
      wave2,
    ]);
  });

  test('Extend ExpressStack - Nested', () => {
    const app = new App();

    class Wave1 extends ExpressWave {
      constructor() {
        super({ id: 'Wave1' });
      }
    }

    class Wave1Stage1 extends ExpressStage {
      constructor(wave1: Wave1) {
        super({
          id: 'Stage1',
          wave: wave1,
        });

        const stackA = new StackA({
          scope: app,
          id: 'StackA',
          stage: this,
        });
        const stackB = new StackB({
          scope: app,
          id: 'StackB',
          stage: this,
        });
        stackB.addExpressDependency(stackA);
      }
    }

    class Wave2 extends ExpressWave {
      constructor() {
        super({ id: 'Wave2' });
      }
    }

    class Wave2Stage1 extends ExpressStage {
      constructor(wave2: Wave2) {
        super({
          id: 'Stage1',
          wave: wave2,
        });

        new StackC({
          scope: app,
          id: 'StackC',
          stage: this,
        });
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
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    // --- Custom Stage Class ---
    interface MyExpressStageProps extends ExpressStageProps {
      wave: MyExpressWave;
      stacks?: MyExpressStack[];
    }

    class MyExpressStage extends ExpressStage {
      constructor(props: MyExpressStageProps) {
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    // --- Custom Stack Class ---
    interface MyExpressStackProps extends ExpressStackProps {
      stage: MyExpressStage;
    }

    class MyExpressStack extends ExpressStack {
      constructor(props: MyExpressStackProps) {
        super({
          ...props,
          id: 'MY' + props.id,
        });
      }
    }

    const expressPipeline = new CdkExpressPipeline();
    const wave1 = new MyExpressWave({ id: 'Wave1' });
    const wave1Stage1 = new MyExpressStage({
      id: 'Stage1',
      wave: wave1,
    });
    const stackA = new MyExpressStack({
      scope: app,
      id: 'stack-a',
      stage: wave1Stage1,
    });
    expressPipeline.synth([wave1]);

    expect(stackA.id).toBe('MYWave1_MYStage1_MYstack-a');
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

