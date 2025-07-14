---
title: Selective Deployment
description: Learn how to deploy specific waves, stages, or stacks
---

## Selective Deployment

Leverages a consistent and predictable naming convention for Stack IDs. A Stack ID consists of the Wave, Stage and original Stack ID. This enables us to target Waves, Stages or individual stacks for deployment.

## Examples

Given the following stack IDs:

```
Wave1_Stage1_StackA
Wave1_Stage1_StackB
Wave1_Stage1_StackC
Wave1_Stage2_StackD

Wave2_Stage1_StackE
Wave2_Stage1_StackF
```

It makes targeted deployments easy:

- Deploy Wave1: `cdk deploy 'Wave1_*'` deploys all stacks in `Wave1`
- Deploy Wave1 Stage1: `cdk deploy 'Wave1_Stage1_*'` deploys all stacks in `Wave1_Stage1`
- Deploy Wave1 Stage1 StackA: `cdk deploy 'Wave1_Stage1_StackA'` deploys only `Wave1_Stage1_StackA`

> [!IMPORTANT]
> When targeting specific stacks be sure to pass the `--exclusively` flag to the `cdk deploy` command to only deploy the specified stacks and not its dependencies.

*Content coming soon...* 