---
title: Stack IDs, Names & Selection
description: Learn how to deploy specific waves, stages, or stacks with targeted CDK commands
---

CDK Express Pipeline leverages a consistent and predictable naming convention for Stack IDs. A Stack ID consists of 
the Wave, Stage and original Stack ID, enabling you to target Waves, Stages or individual stacks for deployment.

## Stack names

Stack names are not the same as Stack IDs. Stack names are the human-readable identifiers you assign to your stacks,
they are the names you see in the AWS CloudFormation Console. 

:::note[Info]
Stack names default to the stack ID if not specified, but we set it explicitly to a specific pattern that
includes the Wave and Stage information for easy selection.
:::

## Stack IDs

Stacks IDs follow the pattern: `{Wave}_{Stage}_{Stack}`

This naming convention allows you to easily select and deploy specific waves, stages, or individual stacks using the
CDK CLI.

## Selection Patterns

Given the Stack ID naming convention, let's see an example of how you can select specific waves, stages, or stacks. 
We have a CDK application with the following Stack IDs:

```
Wave1_Stage1_StackA
Wave1_Stage1_StackB
Wave1_Stage1_StackC
Wave1_Stage2_StackD

Wave2_Stage1_StackE
Wave2_Stage1_StackF
```

To target a deployment for **all the stacks in a Wave** `Wave1`, you can use:
```bash
cdk deploy 'Wave1_*' ...
```

To target **all stacks in a stage of a wave**, such as `Wave1_Stage1`, you can use:
```bash
cdk deploy 'Wave1_Stage1_*' ...
```

To deploy **a specific stack**, such as `Wave1_Stage1_StackA`, you can use:
```bash
cdk deploy 'Wave1_Stage1_StackA' ...
```

:::tip[Important]
When targeting specific stacks be sure to pass the `--exclusively` flag to the `cdk deploy` command to only deploy
the specified stacks and not its dependencies.
:::

Benefits of selecting a specific Wave, Stage or Stack over the all `'**'` method:

- While developing, you can speed up deployments from your local machine by deploying only what you are working on.
- When running in a CI/CD pipeline, you can target specific waves or stages to deploy only what has changed.
- When deploying with a CI/CD system, you can have additional logic between them. For example, you can place a
  manual approval step between `Wave1` and `Wave2`.
