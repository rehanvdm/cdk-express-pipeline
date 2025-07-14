---
title: Introduction
description: Learn about CDK Express Pipeline and how it works
---

## Introduction

CDK Express Pipelines is a library that allows you to define your pipelines in CDK native method. It is built on top of the [AWS CDK](https://aws.amazon.com/cdk/) and is an alternative to [AWS CDK Pipelines](https://aws.amazon.com/cdk/pipelines/) that is build system agnostic.

## Features

- **Works on any system** for example your local machine, GitHub, GitLab, etc.
- **Uses the `cdk deploy` command** to deploy your stacks
- **It's fast**. Make use of concurrent/parallel Stack deployments
- **Stages and Waves are plain classes**, not constructs, they do not change nested Construct IDs (like CDK Pipelines)
- **Supports TS and Python CDK**

## How does it work?

This library makes use of the fact that the CDK CLI computes the dependency graph of your stacks and deploys them in the correct order. It creates the correct dependency graph between Waves, Stages and Stacks with the help of the native `.addDependency` method of the CDK Stack. The `cdk deploy '**'` command will deploy all stacks in the correct order.

## Resources

- [CDK Express Pipeline Tutorial](https://rehanvdm.com/blog/cdk-express-pipeline-tutorial)
- [Migrate from CDK Pipelines to CDK Express Pipeline](https://rehanvdm.com/blog/migrate-from-cdk-pipelines-to-cdk-express-pipeline)
- [Exploring CI/CD with AWS CDK Express Pipeline](https://www.youtube.com/watch?v=pma4zP7mhMU) (YouTube channel [CI and CD on Amazon Web Services (AWS)](https://www.youtube.com/watch?v=pma4zP7mhMU)) 