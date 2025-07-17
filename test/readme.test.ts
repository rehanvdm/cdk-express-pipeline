import * as cdk from 'aws-cdk-lib';
import { App } from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib/core/lib/stack';
import { Construct } from 'constructs';
import { CdkExpressPipeline, ExpressStack, ExpressStage, ExpressWave, ExpressWaveProps } from '../src';
import { CdkExpressPipelineLegacy } from '../src/cdk-express-pipeline-legacy';

const jestConsole = console;

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

describe('Docs', () => {

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
  class IamStack extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  class NetworkingStack extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);

      new cdk.aws_sns.Topic(this, 'MyTopic');
      // ... more resources
    }
  }

  class AppAStack extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);
    }
  }
  class AppBStack extends ExpressStack {
    constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
      super(scope, id, stage, stackProps);
    }
  }

  test('Extend ExpressStack class - Explicit', () => {
    const app = new App();
    const expressPipeline = new CdkExpressPipeline();

    const regions = ['us-east-1', 'eu-west-1'];

    const infraWave = expressPipeline.addWave('Infra');
    const infraWaveUsEast1Stage = infraWave.addStage('us-east-1');
    const infraWaveEuWest1Stage = infraWave.addStage('eu-west-1');
    new IamStack(app, 'Iam', infraWaveUsEast1Stage);
    new NetworkingStack(app, 'Networking', infraWaveUsEast1Stage);
    new NetworkingStack(app, 'Networking', infraWaveEuWest1Stage);

    const appWave = expressPipeline.addWave('Application');
    for (const region of regions) {
      const appWaveStage = appWave.addStage(region);
      const appA = new AppAStack(app, 'AppA', appWaveStage);
      const appB = new AppBStack(app, 'AppB', appWaveStage);
      appB.addExpressDependency(appA);
    }

    expressPipeline.synth([
      infraWave,
      appWave,
    ], true, {});
  });
});