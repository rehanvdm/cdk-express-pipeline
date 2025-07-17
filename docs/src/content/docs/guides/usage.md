---
title: Usage
description: Learn how to use CDK Express Pipeline with multiple patterns and examples
---

The `ExpressStack` extends the `cdk.Stack` class and has a very similar signature, only taking an extra `stage` 
parameter. There are multiple ways to build your pipeline, it involves creating the Pipeline, adding Waves, Stages
and Stacks to your Stages and then calling `.synth()` on the Pipeline.

:::note[Legacy usage]
If you absolutely can not extend the `ExpressStack` class and have to keep using `cdk.Stack`, you can use the legacy 
classes `CdkExpressPipelineLegacy` (not recommended) as described in the [Usage Legacy](/cdk-express-pipeline/guides/usage-legacy/) guide.
:::

## Stack Definition

First, define your stacks by extending `ExpressStack`:

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

It is possible to also extend the `ExpressStack` classes and customize its behavior, if required. The example
below adds `My` to each of the stack IDs and allows for other logic that might be needed.

```typescript
class MyExpressBaseStack extends ExpressStack {
  constructor(scope: Construct, id: string, stage: MyExpressStage, stackProps?: StackProps) {
    super(scope, 'My' + id, stage, stackProps);
    
    // Custom logic can be added here
  }
}
```

Then use this base class to define your stacks:

```typescript
class StackA extends MyExpressBaseStack {
  constructor(scope: Construct, id: string, stage: MyExpressStage, stackProps?: StackProps) {
    super(scope, id, stage, stackProps);

    new cdk.aws_sns.Topic(this, 'MyTopic');
    // ... more resources
  }
}
```


## Pipeline Definition Patterns

There are three main patterns for defining your pipeline. Choose the one that best fits your project structure and 
preferences.

### Pattern 1: Method Builder (Recommended)

This is the most straightforward approach using the builder pattern:

```typescript
//bin/your-app.ts
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

### Pattern 2: Stacks Nested in Stages

For more object-oriented approach, you can nest stacks within stage classes:

```typescript
//lib/wave1/index.ts
class Wave1 extends ExpressWave {
  constructor() {
    super('Wave1');
  }
}
```
```typescript
//lib/wave1/stage1/index.ts
class Wave1Stage1 extends ExpressStage {
  constructor(wave1: Wave1) {
    super('Stage1', wave1);

    const stackA = new StackA(app, 'StackA', this);
    const stackB = new StackB(app, 'StackB', this);
    stackB.addExpressDependency(stackA);
  }
}
```
```typescript
//lib/wave2/index.ts
class Wave2 extends ExpressWave {
  constructor() {
    super('Wave2');
  }
}
```
```typescript
//lib/wave2/stage1/index.ts
class Wave2Stage1 extends ExpressStage {
  constructor(wave2: Wave2) {
    super('Stage1', wave2);

    new StackC(app, 'StackC', this);
  }
}
```
```typescript
//bin/your-app.ts
const app = new App();

const expressPipeline = new CdkExpressPipeline();
const wave1 = new Wave1();
new Wave1Stage1(wave1);
const wave2 = new Wave2();
new Wave2Stage1(wave2);
expressPipeline.synth([wave1, wave2]);
```

## Key Concepts

### Dependencies

Use `addExpressDependency()` to define dependencies between stacks:

```typescript
const stackA = new StackA(app, 'StackA', stage);
const stackB = new StackB(app, 'StackB', stage);
stackB.addExpressDependency(stackA); // StackB depends on StackA
```

### Stack IDs

Stacks IDs follow the pattern: `{Wave}_{Stage}_{Stack}`

- `Wave1_Stage1_StackA`
- `Wave1_Stage1_StackB`
- `Wave2_Stage1_StackC`

This naming convention enables selective deployment, see [Stack IDs, Names & Selection](/cdk-express-pipeline/guides/selective-deployment/).

### Stack names

Stack names are never changed. In the example above, the stack names will be `StackA`, `StackB`, and `StackC`
as seen in CloudFormation. 