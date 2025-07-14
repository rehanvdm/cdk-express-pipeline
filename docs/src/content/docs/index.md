---
title: CDK Express Pipeline
description: CDK pipelines provides constructs for Waves, Stages using only native CDK stack dependencies
template: splash
hero:
  tagline: CDK pipelines provides constructs for Waves, Stages using only native CDK stack dependencies
  actions:
    - text: Get Started
      link: /guides/introduction/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/rehanvdm/cdk-express-pipeline
      icon: external
---

## What is CDK Express Pipeline?

CDK Express Pipelines is a library that allows you to define your pipelines in CDK native method. It is built on top of the [AWS CDK](https://aws.amazon.com/cdk/) and is an alternative to [AWS CDK Pipelines](https://aws.amazon.com/cdk/pipelines/) that is build system agnostic.

## Key Features

- **Build System Agnostic**: Works on any system for example your local machine, GitHub, GitLab, etc.
- **Native CDK**: Uses the `cdk deploy` command to deploy your stacks
- **Fast Deployments**: Make use of concurrent/parallel Stack deployments
- **Clean Architecture**: Stages and Waves are plain classes, not constructs, they do not change nested Construct IDs
- **Multi-Language Support**: Supports TS and Python CDK

## Quick Start

```bash
npm install cdk-express-pipeline
```

```typescript
import { CdkExpressPipeline } from 'cdk-express-pipeline';

const app = new App();
const expressPipeline = new CdkExpressPipeline();

// Add waves, stages, and stacks
const wave1 = expressPipeline.addWave('Wave1');
const stage1 = wave1.addStage('Stage1');
const stackA = new StackA(app, 'StackA', stage1);

expressPipeline.synth([wave1]);
```

## Resources

- [CDK Express Pipeline Tutorial](https://rehanvdm.com/blog/cdk-express-pipeline-tutorial)
- [Migrate from CDK Pipelines to CDK Express Pipeline](https://rehanvdm.com/blog/migrate-from-cdk-pipelines-to-cdk-express-pipeline)
- [Exploring CI/CD with AWS CDK Express Pipeline](https://www.youtube.com/watch?v=pma4zP7mhMU) 