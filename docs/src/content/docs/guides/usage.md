---
title: Usage
description: Learn how to use CDK Express Pipeline
---

## Usage

The `ExpressStack` extends the `cdk.Stack` class and has a very similar signature, only taking an extra `stage` parameter. There are multiple ways to build your pipeline, it involves creating the Pipeline, adding Waves, Stages and Stacks to your Stages and then calling `.synth()` on the Pipeline.

## Stack Definition

```typescript
class StackA extends ExpressStack {
  constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
    super(scope, id, stage, stackProps);

    new cdk.aws_sns.Topic(this, 'MyTopic');
    // ... more resources
  }
}

class StackB extends ExpressStack {
  //... similar to StackA
}

class StackC extends ExpressStack {
  //... similar to StackA
}
```

## Pipeline Definition

```typescript
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
```

The stack deployment order will be printed to the console when running `cdk` commands:

```plaintext
ORDER OF DEPLOYMENT
🌊 Waves  - Deployed sequentially.
🏗️ Stages - Deployed in parallel by default, unless the wave is marked `[Seq 🏗️]` for sequential stage execution.
📦 Stacks - Deployed after their dependent stacks within the stage (dependencies shown below them with ↳).
           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.
           - Stack deployment order within the stage is shown in square brackets (ex: [1])

🌊 Wave1
  🏗️ Stage1
    📦 StackA (Wave1_Stage1_StackA) [1]
    📦 StackB (Wave1_Stage1_StackB) [2]
        ↳ StackA
🌊 Wave2
  🏗️ Stage1
    📦 StackC (Wave2_Stage1_StackC) [1]
``` 