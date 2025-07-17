---
title: Options
description: Configure CDK Express Pipeline with custom separators and sequential stages
---

### Separator
By default, the library uses an underscore (`_`) as the separator between Wave, Stage and Stack IDs. Not available in
the Legacy classes. This can be customized by passing a different separator to the `CdkExpressPipeline` constructor:

```typescript
const expressPipeline = new CdkExpressPipeline({
  separator: '-', // Now stack IDs will be like: Wave1-Stage1-StackA
});
```

### Sequential Stages
By default, stages within a wave are deployed in parallel. You can configure a wave to deploy its stages sequentially
by setting the `sequentialStages` option:

```typescript
const wave1 = expressPipeline.addWave('Wave1', {
  sequentialStages: true, // Stages in this wave will be deployed one after another
});
```

When a wave's stages are configured to be sequential, the wave will be marked with `[Seq 🏗️]` in the deployment order
output:

```plaintext
🌊 Wave1 [Seq 🏗️]
  🏗️ Stage1
    📦 StackA (Wave1_Stage1_StackA) [1]
  🏗️ Stage2
    📦 StackB (Wave1_Stage2_StackB) [1]
```