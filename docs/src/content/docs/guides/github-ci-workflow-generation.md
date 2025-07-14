---
title: GitHub CI Workflow Generation
description: Automatically generate GitHub Actions workflows for your CDK Express Pipeline
---

## GitHub CI Workflow Generation

CDK Express Pipeline includes built-in GitHub CI workflow generation that automatically create GitHub Actions workflows based on your pipeline configuration. This feature eliminates the need to manually write and maintain GitHub workflow files.

## Basic Usage

To generate GitHub workflows, you need to specify a `GitHubWorkflowConfig` object when calling the `generateGitHubWorkflows` method on your `CdkExpressPipeline` instance.

## Configuration Options

### Synth Configuration

The `synth` configuration defines how your CDK application is built and synthesized.

### Diff Configuration

The `diff` configuration defines when and how CDK diff operations are performed.

### Deploy Configuration

The `deploy` configuration defines when and how CDK deploy operations are performed.

## Stack Selectors

The `stackSelector` option determines how stacks are targeted in diff and deploy operations:

- **`'wave'`**: Will create a GitHub Job in the Workflow for each wave (e.g., `Wave1_*`)
- **`'stage'`**: Will create a GitHub Job in the Workflow for each wave and stage combination (e.g., `Wave1_Stage1_*`)
- **`'stack'`**: Will create a GitHub Job in the Workflow for each wave, stage and stack combination (e.g., `Wave1_Stage1_Stack1`)

*Content coming soon...* 