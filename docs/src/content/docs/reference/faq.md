---
title: Frequently Asked Questions
description: Frequently Asked Questions about CDK Express Pipeline
---

### General Questions

#### What is CDK Express Pipeline?

CDK Express Pipeline is a library that allows you to define your pipelines in CDK native method. It uses the CDK CLI
for deployment and is an alternative to the popular AWS CDK Pipelines that only works on AWS CodePipeline.

#### How does it differ from AWS CDK Pipelines?

CDK Pipelines has some limits that can make it less suitable for teams who want fast, flexible, and easy-to-maintain
CI/CD workflows:

- **Tightly linked to CodePipeline**: CDK Pipelines only works with AWS CodePipeline, which limits your CI/CD choices.
- **Complicated asset management**: It needs pre-asset generation steps and uses extra CodeBuild projects to build and
  push assets, increasing deployment time.
- **Slower deployments**: Self-mutation and the overhead of many CodeBuild steps slow down deployments, especially as you add more
  stacks, stages and waves.
- **Fixed structure**: Renaming stages or moving stacks can cause resources to be replaced because of how the CDK
  `Stage` construct works.
- **Extra setup for cross-account or cross-region**: CDK Pipelines needs extra stacks to manage deployments across
  accounts or regions.
- **Authentication needs secrets**: Connecting with GitHub or other CI/CD systems requires long-lived secrets stored in
  AWS Secrets Manager.

CDK Express Pipeline solves these problems with a simpler and faster approach:

- **Works with any CI/CD system**: It runs locally and with any CI/CD tool, not just AWS CodePipeline.
- **Simple commands**: Deployments use a single `cdk deploy` command. There is no need for separate asset pre-generation.
- **Standard bootstrapping**: It uses the same CDK bootstrap process you already know. There are no extra stacks for
  cross-account setups.
- **Handles assets natively**: Assets are managed like in standard CDK projects. There are no custom CodeBuild steps.
- **Faster deployments**: Deployments can be up to 5 times faster for first & pipeline changing deployments and 2+ times
  faster on normal deploys. It will become even faster over time, as CDK Pipelines tends to grow more bloated and slower
  with each additional stack, stage and wave.
- **More flexible**: You can rename stages or move stacks without causing unwanted resource replacements.
- **Modern authentication**: It supports OIDC integration with modern CI/CD systems, so you do not need long-lived secrets in
  Secrets Manager.

#### What languages are supported?

CDK Express Pipeline supports both TypeScript and Python. Open a GitHub issue if you need support for another language.

### Architecture Questions

#### Why are there `...Legacy` classes?

The `CdkExpressPipelineLegacy` class can be used when you do not want/can not use the `ExpressStack` class and have 
to stick to the CDK `Stack` class.

They are not as feature rich as the main classes and are only provided for backwards compatibility until you can 
migrate and make use of the main classes.

#### Why does `ExpressStage` not extend `cdk.Stage`?

We do not want `ExpressStage` to be an `IConstruct` this changes the IDs of its nested constructs which is undesirable.
Therefore, both `ExpressStage` and `ExpressWave` are plain classes, only `ExpressStack` extends `cdk.Stack`.

This also makes it easier to migrate to use CDK Express Pipeline, there will be no changes to any construct IDs in your
application.

#### Why deprecate `.dependencies` and `.addDependency(...)` for `ExpressStack`?

We can not override the return type of the `.dependencies` getter in `cdk.Stack`. JSII gives the following error:

```shell
error JSII5004: "cdk-express-pipeline.ExpressStack#dependencies" changes the property type to 
"array<cdk-express-pipeline.ExpressStack>" when overriding aws-cdk-lib.Stack. Change it to "array<aws-cdk-lib.Stack>"
```

The alternative is to leave `.dependencies` signature as is and mark it is as deprecated. The JS Doc marks it as
deprecated and suggests to use `.expressDependencies()` instead.

### Usage Questions

#### How do I organize my infrastructure into waves and stages?

Waves represent sequential deployment phases, while stages within a wave are deployed in parallel by default, but can be
changed to be sequential instead. A common pattern we see is:

```typescript
const wave1 = expressPipeline.addWave('Infrastructure');
const networkingStage = wave1.addStage('Networking');
const computeStage = wave1.addStage('Compute');

const wave2 = expressPipeline.addWave('Application');
const appStage = wave2.addStage('Application');
```

This then allows the stacks in the `Application` wave to implicitly depend on the stacks in the `Infrastructure` wave.
This allows us to make the assumption that for example certain roles have been created before the application stacks
are deployed. So we can hardcode the role names/arns and know they will exist when the application stacks are deployed.
The same goes for all `*.fromLookup()` CDK methods, for example, we can use the `ec2.Vpc.fromLookup` method to import
the VPC created in the `Networking` stage without having to pass it around.

#### Can I deploy stages sequentially within a wave?

Yes, you can configure a wave to deploy its stages sequentially:

```typescript
const wave1 = expressPipeline.addWave('Wave1', {
  sequentialStages: true, // Stages will be deployed one after another
});
```

#### How do I target specific stacks for deployment?

Use the consistent naming convention to target specific stacks:

```bash
# Deploy all stacks in a wave
cdk deploy 'Wave1_*' --exclusively

# Deploy all stacks in a stage
cdk deploy 'Wave1_Stage1_*' --exclusively

# Deploy a specific stack
cdk deploy 'Wave1_Stage1_StackA' --exclusively
```

See the [Selective Deployment Guide](/cdk-express-pipeline/guides/selective-deployment/) for more details.

#### What's the difference between legacy and non-legacy usage?

| Feature              | Non-Legacy | Legacy            |
|----------------------|------------|-------------------|
| Stack Class          | `ExpressStack` | `cdk.Stack`       |
| Dependencies         | `addExpressDependency()` | `addDependency()` |
| Stack IDs            | Auto-prefixed | Manual naming     |
| Selective Deployment | Guaranteed | Possible          |
| Stage Dependencies   | Enforced | Manual            |

#### What's the recommended concurrency setting?

Start with `--concurrency 10` and adjust based on:
- AWS account limits
- Stack complexity
- Available resources
- Deployment time requirements

### CI/CD Questions

#### How do I integrate with GitHub Actions?

CDK Express Pipeline provides built-in GitHub Actions workflow generation:

```typescript
const ghConfig: GitHubWorkflowConfig = {
  synth: { /* synth configuration */ },
  diff: [/* diff configurations */],
  deploy: [/* deploy configurations */],
};

await pipeline.generateGitHubWorkflows(ghConfig, true);
```

#### Can I use other CI/CD platforms?

Yes, CDK Express Pipeline works with any build system since it uses standard `cdk deploy` commands. We have only provided
examples and built-in support for GitHub Actions, but you can adapt the generated workflows to any CI/CD platform. Issues
and pull requests are welcome to add support for other platforms.

## Still Have Questions?

If you can't find the answer to your question here:

1. **Check the guides** - Review the [Usage](/cdk-express-pipeline/guides/usage/) and other guides
2. **Explore examples** - Look at the [Demo Projects](/cdk-express-pipeline/guides/demo-projects/)
3. **Review API docs** - Check the [API Reference](/cdk-express-pipeline/reference/api/)
4. **GitHub issues** - Search existing issues or create a new one
