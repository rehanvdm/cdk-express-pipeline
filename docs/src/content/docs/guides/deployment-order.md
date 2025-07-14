---
title: Deployment Order
description: Understanding how CDK Express Pipeline determines deployment order
---

## Deployment Order

The Wave, Stage and Stack order is as follows:

- Waves are deployed sequentially, one after the other.
- Stages within a Wave are deployed in parallel by default, unless configured to be sequential.
- Stacks within a Stage are deployed in order of stack dependencies within a Stage.

When used with `cdk deploy '**' --concurrency 10`, it will deploy all stacks in parallel, 10 at a time, where possible while still adhering to the dependency graph.

## Console Output

The Deployment Order can be printed to the console when running the `pipeline.synth` function, it is enabled by default but can be disabled in the function arguments.

## Mermaid Graph File Output

The Deployment Order can also be outputted to a markdown file containing a Mermaid graph. This option is **disabled** by default, and can be enabled when running the `pipeline.synth`.

*Content coming soon...* 