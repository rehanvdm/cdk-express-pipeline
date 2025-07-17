---
title: Legacy Usage
description: Using legacy classes for CDK Express Pipeline with limitations and migration guidance
---

The `CdkExpressPipelineLegacy` class can be used when you do not want/can not use the `ExpressStack` class and have to stick to the CDK `Stack` class.

:::danger[Warning]
Always use non-legacy classes for greenfield projects. Only use the Legacy classes if you have no other choice. 
These classes are not feature complete, see the limitations section below.
:::

## Limitations

The following features are not available when using the Legacy classes:

- **Enforcing Wave, Stage and Stack names** do not include the `separator` character
- **Enforcing that a Stack in Stage 1 can not depend on a Stack in Stage 2**
- **Printing stack dependencies within a Stage**. Since we do not know what stage a stack belongs to,
- it's not possible to print the dependencies of stacks of only that stage and not others
- **Consistent naming convention**: If a consistent naming convention has not been followed for Stacks,
- it might not be possible to target all stacks in a stage or a wave. Deployment might have to always target all
- stacks with `"**"`
- **Stack ID uniqueness**: Stack ids are not changed and have to be unique across all stacks in the CDK app, 
- whereas with the non-legacy classes, stack ids only have to be unique within a Wave

## Stack Definition

With legacy usage, you define stacks using the standard CDK `Stack` class:

```typescript
class StackA extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new cdk.aws_sns.Topic(this, 'MyTopicA');
    // ... more resources
  }
}

class StackB extends cdk.Stack {
  // ... similar to StackA
}

class StackC extends cdk.Stack {
  // ... similar to StackA
}
```

## Pipeline Definition Patterns

There are two main patterns for defining legacy pipelines, but any language and OOP paradigm can be used to build your
pipeline.

### Pattern 1: Object Configuration

```typescript
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
```

### Pattern 2: Method Builder

```typescript
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
```



## Key Differences from Non-Legacy

### Stack Dependencies

Continue to use the CDK native method to create dependencies, between stacks.

```typescript
stackB.addDependency(stackA);
```

### Stack IDs

In legacy mode, stack ids are not automatically modified:

```typescript
// Legacy - stack names remain as defined
const stackA = new StackA(app, 'StackA'); // Stack id: StackA

// Non-legacy - stack names are automatically prefixed
const stackA = new StackA(app, 'StackA', stage); // Stack name: Wave1_Stage1_StackA
```

### Stack names

Stack names are never changed. In the example above, the stack names will be `StackA`, `StackB`, and `StackC`
as seen in CloudFormation.

## When to Use Legacy Classes

Consider using legacy classes only in these scenarios:

1. **Existing CDK projects**: When migrating an existing project that heavily uses standard CDK stacks
2. **Third-party integrations**: When using CDK constructs that require standard stack classes
3. **Temporary migration**: As a stepping stone during migration from standard CDK to CDK Express Pipeline
4. **Limited scope**: When you only need basic wave/stage organization without advanced features

