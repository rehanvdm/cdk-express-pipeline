---
title: CDK CLI Commands
description: Important CDK CLI commands that power CDK Express Pipeline
---

CDK Express Pipeline leverages the AWS CDK CLI to manage deployments. The following commands are essential for deploying your 
CDK applications.

## `--exclusively`

The `--exclusively` flag deploys only the specified stacks and their dependencies, skipping all other stacks in the 
application. Without this flag, the CDK CLI may deploy stacks in other waves or stages before your selected stack. 
By using `--exclusively`, you ensure that only the stacks you specify are deployed, as their dependencies have already 
been deployed in previous waves or stages.

```bash
cdk deploy 'Wave2_*' --exclusively
```

## `--concurrency`

The `--concurrency` flag sets the maximum number of stacks to deploy in parallel. A recommended default is `10`, 
allowing the CDK CLI to deploy up to 10 stacks simultaneously. If you encounter AWS account or region quota limits 
during deployment, reduce this number. You can also increase it to deploy more stacks in parallel, but be mindful of
AWS quotas.

```bash
cdk deploy '**' --concurrency 10
```
