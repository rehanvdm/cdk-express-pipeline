# FAQ

## Why are there `...Legacy` classes?

The Legacy classes are separate to prevent union types and from polluting the main classes. They are not as feature rich
as the main classes and are only provided for backwards compatibility.

The following features are not available when using the Legacy classes:

- Enforcing Wave, Stage and Stack names do not include the `seperator` character.
- Enforcing that a Stack in Stage 1 can not depend on a Stack in Stage 2.
- Printing stack dependencies. Since we do not know what stage a stack belongs to, it's not possible to print the
  dependencies of stacks of only that stage and not others.
- If a consistent naming convention has not been followed for Stacks, it might not be possible to target all stacks in a
  stage or a wave. Deployment will have to always target `"**"`.

## Why does `ExpressStage` not extend `cdk.Stage`?

We do not want `ExpressStage` to be an `IConstruct` this changes the IDs of its nested constructs which is undesirable.
Therefore, both `ExpressStage` and `ExpressWave` are plain classes, only `ExpressStack` extends `cdk.Stack`.

## Why have both .dependencies() and .expressDependencies()?

We can not override the return type of the `dependencies()` method in `cdk.Stack`. JSII gives the following error:

```shell
error JSII5004: "cdk-express-pipeline.ExpressStack#dependencies" changes the property type to 
"array<cdk-express-pipeline.ExpressStack>" when overriding aws-cdk-lib.Stack. Change it to "array<aws-cdk-lib.Stack>"
```

The alternative is to leave `.dependencies()` signature as is and add a new method `.expressDependencies()` which
returns the new correct type.

It's fine with overriding `.addDependency()` it might just mean that we
[won't be able to target C#](https://aws.github.io/jsii/user-guides/lib-author/typescript-restrictions/#covariant-overrides-parameter-list-changes)
according the docs, which is fine for now.

TODO ^^^

## Why is the default wave, stage, stack seprator and `_`?

An `_` can not be used in a stack name, it's a safe default that we know will not be in any stack names.