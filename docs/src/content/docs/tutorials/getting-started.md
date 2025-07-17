---
title: Tutorial - Getting Started
description: Learn how to create and manage simple and fast deployment pipelines using the cdk-express-pipeline library, a powerful tool built on top of AWS CDK that enables CDK-native pipeline definitions.
---

The AWS CDK Express Pipeline library helps you create simple and fast deployment pipelines using the AWS CDK. This tutorial shows you how to set
up and manage deployment pipelines with the [cdk-express-pipeline](https://github.com/rehanvdm/cdk-express-pipeline) library.

:::tip[Languages]
`cdk-express-pipeline` is available in Python and TypeScript. This guide uses TypeScript.
:::

## What is CDK Express Pipeline?

The library uses the CDK CLI's ability to determine the correct order of stack deployments based on dependencies. It creates a
dependency graph between Waves, Stages and Stacks using the native `.addDependency` method of the CDK Stack. Running
`cdk deploy '**'` will deploy all stacks in the right order.

This tutorial will show you how to deploy an SNS topic in two regions: `us-east-1` and `eu-west-1`.

## Prerequisites

Before starting, make sure you have:

1. Node.js (v22.x or later) and npm installed
2. AWS CDK CLI installed (`npm install -g aws-cdk`)
3. AWS account and configured credentials profile as `ADMIN_PROFILE`
4. Basic understanding of AWS CDK
5. CDK Bootstrapped accounts in the `us-east-1` and `eu-west-1` regions.

   ```bash
   cdk bootstrap aws://ACCOUNT_ID/us-east-1 --profile ADMIN_PROFILE
   cdk bootstrap aws://ACCOUNT_ID/eu-west-1 --profile ADMIN_PROFILE
   ```
6. [OPTIONAL] GitHub account with AWS OIDC Connection. Create an IAM role in your AWS Account that lets GitHub assume the role
   for deployments.
    - Name the role `githuboidc-git-hub-deploy-role`
    - Add the `AdministratorAccess` policy
    - Use this trust relationship:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
                },
                "Action": "sts:AssumeRoleWithWebIdentity",
                "Condition": {
                    "StringEquals": {
                        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                    },
                    "StringLike": {
                        "token.actions.githubusercontent.com:sub": "repo:GITHUB_USERNAME/GITHUB_REPO_NAME:*"
                    }
                }
            }
        ]
    }
    ```

## Project Setup

1. Create a new CDK TypeScript project:
   ```bash
   mkdir my-pipeline-stack
   cd my-pipeline-stack
   cdk init app --language typescript
   ```

2. Install the required dependencies:
   ```bash
   npm install cdk-express-pipeline aws-cdk-lib constructs
   ```

3. Update the `lib/my-pipeline-stack.ts` file to extend `ExpressStack` and add an SNS Topic:

   ```typescript
   import * as cdk from 'aws-cdk-lib';
   import { Construct } from 'constructs';
   import {ExpressStack, ExpressStage} from "cdk-express-pipeline";
   import {StackProps} from "aws-cdk-lib";
   
   export class MyPipelineStack extends ExpressStack {
     constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {
       super(scope, id, stage, stackProps);
   
       new cdk.aws_sns.Topic(this, 'MyTopic');
       // ... more resources
     }
   }
   ```

4. Update the `bin/my-pipeline.ts` file to define the pipeline:

   ```typescript
   #!/usr/bin/env node
   import 'source-map-support/register';
   import {MyPipelineStack} from '../lib/my-pipeline-stack';
   import {App} from "aws-cdk-lib";
   import {CdkExpressPipeline} from "cdk-express-pipeline";
   
   const app = new App();
   const expressPipeline = new CdkExpressPipeline();
   
   // === Wave 1 ===
   const wave1 = expressPipeline.addWave('Default');
   
   // --- Wave 1, Stage US ---
   const wave1StageUs = wave1.addStage('MyAppUS');
   new MyPipelineStack(app, 'AppStack', wave1StageUs, {env: { account: "581184285249", region: "us-east-1" }});
   
   // --- Wave 1, Stage EU ---
   const wave1StageEu = wave1.addStage('MyAppEU');
   new MyPipelineStack(app, 'AppStack', wave1StageEu, {env: { account: "581184285249", region: "eu-west-1" }});
   
   expressPipeline.synth([
     wave1,
   ]);
   ```

5. Check the changes locally:
   ```bash
   cdk diff '**' --profile ADMIN_PROFILE
   ```

   The output will show the deployment order and new resources:
   ```bash 
   ORDER OF DEPLOYMENT
   🌊 Waves  - Deployed sequentially
   🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time
   📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, is deployed
   
   🌊 Default
     🔲 MyAppUS
       📄 AppStack (Default_MyAppUS_AppStack)
     🔲 MyAppEU
       📄 AppStack (Default_MyAppEU_AppStack)
   
   Stack Default_MyAppUS_AppStack (AppStack)
   Parameters
   [+] Parameter BootstrapVersion BootstrapVersion: {"Type":"AWS::SSM::Parameter::Value<String>","Default":"/cdk-bootstrap/hnb659fds/version","Description":"Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"}
   Resources
   [+] AWS::SNS::Topic MyTopic MyTopic86869434
   
   Stack Default_MyAppEU_AppStack (AppStack)
   Parameters
   [+] Parameter BootstrapVersion BootstrapVersion: {"Type":"AWS::SSM::Parameter::Value<String>","Default":"/cdk-bootstrap/hnb659fds/version","Description":"Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"}
   Resources
   [+] AWS::SNS::Topic MyTopic MyTopic86869434
   
   
   ✨  Number of stacks with differences: 2
   ```
6. Deploy the stack from your machine:
   ```bash
   cdk deploy '**' --concurrency 10 --profile ADMIN_PROFILE
   ```
7. Create a GitHub Workflow for our pipeline, that will run on push to the `main` branch. Create `.github/workflows/cdk-deploy.yml`:

   ```yaml
   name: Deploy
   on:
      push:
         branches:
            - main
   
   env:
      FORCE_COLOR: 1
   
   jobs:
      deploy:
         name: CDK Diff and Deploy
         runs-on: ubuntu-latest
         permissions:
            actions: write
            contents: read
            id-token: write
         steps:
            - name: Checkout repo
              uses: actions/checkout@v4
   
            - name: Set up node
              uses: actions/setup-node@v3
              with:
                 node-version: 20
                 cache: npm
   
            - name: Install dependencies
              run: npm install ci
   
            # TODO: Alternatively use an AWS IAM user and set the credentials in GitHub Secrets (less secure than GH OIDC below)
            - name: Configure AWS credentials
              uses: aws-actions/configure-aws-credentials@v4
              with:
                 role-to-assume: # TODO: Your role to assume
                 aws-region: # TODO: your region
   
            - name: CDK diff
              run: npm run cdk -- diff '**'
   
            - name: CDK deploy
              run: npm run cdk -- deploy '**' --require-approval never --concurrency 10
   ```

## Understanding Core Concepts

### Waves and Stages

CDK Express Pipeline organizes deployments into Waves and Stages:

1. **Waves**: Top-level groups that deploy sequentially, one after another
2. **Stages**: Groups of stacks within a wave that can deploy in parallel by default (can be configured to be sequentially)

<br>

Here's an example:

```bash
Wave1
  ├── Stage1
  │   ├── StackA
  │   └── StackB
  └── Stage2
      └── StackC
Wave2
  └── Stage1
      └── StackD
```

All stacks in Wave1 deploy at the same time since they're in stages that can run in parallel. The two stacks in Wave1_Stage1 also
deploy together since they don't depend on each other.

Wave2_Stage1_StackD needs to wait for all Wave1 stacks to finish. This is created with `.addDependency` between these stacks:

- Wave2_Stage1_StackD depends on Wave1_Stage1_StackA
- Wave2_Stage1_StackD depends on Wave1_Stage1_StackB
- Wave2_Stage1_StackD depends on Wave1_Stage2_StackC

<br>

CDK Express Pipeline handles creating these dependencies for you. The `addWave` and `addStage` functions, along with stack
stage inheritance, build this structure. When you call `expressPipeline.synth(waves)`, it builds the dependency graph
and lets CDK handle the rest.

### Concurrency

The `--concurrency` flag in the `cdk deploy` command lets CDK deploy multiple stacks at once when possible:

```bash
cdk deploy '**' --concurrency 10 --profile ADMIN_PROFILE
```

CDK Express Pipeline uses this feature to speed up deployments by running independent stacks in parallel.

## Conclusion

CDK Express Pipeline makes AWS infrastructure deployments simple and fast. This tutorial showed you how to create organized
deployment pipelines using AWS CDK.
