# FAQ

## Why are there `...Legacy` classes?

The `CdkExpressPipelineLegacy` class can be used when you do not want/can not use the `ExpressStack` class and have to
stick to the CDK `Stack` class.

The Legacy classes are separate to prevent union types and from polluting the main classes. They are not as feature rich
as the main classes and are only provided for backwards compatibility.

## Why does `ExpressStage` not extend `cdk.Stage`?

We do not want `ExpressStage` to be an `IConstruct` this changes the IDs of its nested constructs which is undesirable.
Therefore, both `ExpressStage` and `ExpressWave` are plain classes, only `ExpressStack` extends `cdk.Stack`.

## Why deprecate `.dependencies` and `.addDependency(...)` for `ExpressStack`?

We can not override the return type of the `.dependencies` getter in `cdk.Stack`. JSII gives the following error:

```shell
error JSII5004: "cdk-express-pipeline.ExpressStack#dependencies" changes the property type to 
"array<cdk-express-pipeline.ExpressStack>" when overriding aws-cdk-lib.Stack. Change it to "array<aws-cdk-lib.Stack>"
```

The alternative is to leave `.dependencies` signature as is, override it and throw an error if it's used on the
instantiated class. The JS Doc marks it as deprecated and suggests to use `.expressDependencies()` instead.

The same goes for `.addDependency(...)`, where `.addExpressDependency(...)` should be used in its place.

## Why is the default wave, stage, stack seprator and `_`?

An `_` can not be used in a stack name, it's a safe default that we know will not be in any stack names.