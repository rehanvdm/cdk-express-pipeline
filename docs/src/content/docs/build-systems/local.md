---
title: Local Build System
description: Use CDK Express Pipeline locally, on your own machine, without a CI/CD system
---

The CDK Express Pipeline can be used locally on your own machine, without a CI/CD system.

These examples all assume a project created with the default structure of the CDK CLI
command `cdk init app --language typescript`.

These are for the demo TS project: https://github.com/rehanvdm/cdk-express-pipeline-demo-ts

**Diff commands**

```bash
# Diffs all stacks
cdk diff '**' --profile YOUR_PROFILE

# Diffs only specific stacks in a Wave
cdk diff 'Wave1_*' --profile YOUR_PROFILE --exclusively

# Diffs only specific stacks of a Stage in a Wave
cdk diff 'Wave1_Stage1_*' --profile YOUR_PROFILE --exclusively

# Diffs only a specific stack
cdk diff 'Wave1_Stage1_StackA' --profile YOUR_PROFILE --exclusively
```

**Deploy commands**

```bash
# Deploys all stacks in correct order
cdk deploy '**' --profile YOUR_PROFILE --concurrency 10 --require-approval never

# Deploys only specific stacks in a Wave in correct order
cdk deploy 'Wave1_*' --profile YOUR_PROFILE --exclusively --concurrency 10 --require-approval never

# Deploys only specific stacks of a Stage in a Wave in correct order
cdk deploy 'Wave1_Stage1_*' --profile YOUR_PROFILE --exclusively --concurrency 10 --require-approval never

# Deploys only a specific stack
cdk deploy 'Wave1_Stage1_StackA' --profile YOUR_PROFILE --exclusively --concurrency 10 --require-approval never
```