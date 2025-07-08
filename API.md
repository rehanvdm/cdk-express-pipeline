# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### ExpressStack <a name="ExpressStack" id="cdk-express-pipeline.ExpressStack"></a>

- *Implements:* <a href="#cdk-express-pipeline.IExpressStack">IExpressStack</a>

A CDK Express Pipeline Stack that belongs to an ExpressStage.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.ExpressStack.Initializer"></a>

```typescript
import { ExpressStack } from 'cdk-express-pipeline'

new ExpressStack(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStack.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | The parent of this stack, usually an `App` but could be any construct. |
| <code><a href="#cdk-express-pipeline.ExpressStack.Initializer.parameter.id">id</a></code> | <code>string</code> | The stack identifier which will be used to construct the final id as a combination of the wave, stage and stack id. |
| <code><a href="#cdk-express-pipeline.ExpressStack.Initializer.parameter.stage">stage</a></code> | <code><a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a></code> | The stage that the stack belongs to. |
| <code><a href="#cdk-express-pipeline.ExpressStack.Initializer.parameter.stackProps">stackProps</a></code> | <code>aws-cdk-lib.StackProps</code> | Stack properties. |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-express-pipeline.ExpressStack.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

The parent of this stack, usually an `App` but could be any construct.

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressStack.Initializer.parameter.id"></a>

- *Type:* string

The stack identifier which will be used to construct the final id as a combination of the wave, stage and stack id.

---

##### `stage`<sup>Required</sup> <a name="stage" id="cdk-express-pipeline.ExpressStack.Initializer.parameter.stage"></a>

- *Type:* <a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>

The stage that the stack belongs to.

---

##### `stackProps`<sup>Optional</sup> <a name="stackProps" id="cdk-express-pipeline.ExpressStack.Initializer.parameter.stackProps"></a>

- *Type:* aws-cdk-lib.StackProps

Stack properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStack.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-express-pipeline.ExpressStack.addDependency">addDependency</a></code> | Use `addDependency` for dependencies between stacks in an ExpressStage. |
| <code><a href="#cdk-express-pipeline.ExpressStack.addMetadata">addMetadata</a></code> | Adds an arbitary key-value pair, with information you want to record about the stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.addTransform">addTransform</a></code> | Add a Transform to this stack. A Transform is a macro that AWS CloudFormation uses to process your template. |
| <code><a href="#cdk-express-pipeline.ExpressStack.exportStringListValue">exportStringListValue</a></code> | Create a CloudFormation Export for a string list value. |
| <code><a href="#cdk-express-pipeline.ExpressStack.exportValue">exportValue</a></code> | Create a CloudFormation Export for a string value. |
| <code><a href="#cdk-express-pipeline.ExpressStack.formatArn">formatArn</a></code> | Creates an ARN from components. |
| <code><a href="#cdk-express-pipeline.ExpressStack.getLogicalId">getLogicalId</a></code> | Allocates a stack-unique CloudFormation-compatible logical identity for a specific resource. |
| <code><a href="#cdk-express-pipeline.ExpressStack.regionalFact">regionalFact</a></code> | Look up a fact value for the given fact for the region of this stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.renameLogicalId">renameLogicalId</a></code> | Rename a generated logical identities. |
| <code><a href="#cdk-express-pipeline.ExpressStack.reportMissingContextKey">reportMissingContextKey</a></code> | Indicate that a context key was expected. |
| <code><a href="#cdk-express-pipeline.ExpressStack.resolve">resolve</a></code> | Resolve a tokenized value in the context of the current stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.splitArn">splitArn</a></code> | Splits the provided ARN into its components. |
| <code><a href="#cdk-express-pipeline.ExpressStack.toJsonString">toJsonString</a></code> | Convert an object, potentially containing tokens, to a JSON string. |
| <code><a href="#cdk-express-pipeline.ExpressStack.toYamlString">toYamlString</a></code> | Convert an object, potentially containing tokens, to a YAML string. |
| <code><a href="#cdk-express-pipeline.ExpressStack.addExpressDependency">addExpressDependency</a></code> | Only use to create dependencies between Stacks in Waves and Stages for building the Pipeline, where having cyclic dependencies is not possible. |
| <code><a href="#cdk-express-pipeline.ExpressStack.expressDependencies">expressDependencies</a></code> | The ExpressStack dependencies of the stack. |

---

##### `toString` <a name="toString" id="cdk-express-pipeline.ExpressStack.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `addDependency` <a name="addDependency" id="cdk-express-pipeline.ExpressStack.addDependency"></a>

```typescript
public addDependency(target: Stack, reason?: string): void
```

Use `addDependency` for dependencies between stacks in an ExpressStage.

Otherwise, use `addExpressDependency`
to construct the Pipeline of stacks between Waves and Stages.

###### `target`<sup>Required</sup> <a name="target" id="cdk-express-pipeline.ExpressStack.addDependency.parameter.target"></a>

- *Type:* aws-cdk-lib.Stack

---

###### `reason`<sup>Optional</sup> <a name="reason" id="cdk-express-pipeline.ExpressStack.addDependency.parameter.reason"></a>

- *Type:* string

---

##### `addMetadata` <a name="addMetadata" id="cdk-express-pipeline.ExpressStack.addMetadata"></a>

```typescript
public addMetadata(key: string, value: any): void
```

Adds an arbitary key-value pair, with information you want to record about the stack.

These get translated to the Metadata section of the generated template.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html)

###### `key`<sup>Required</sup> <a name="key" id="cdk-express-pipeline.ExpressStack.addMetadata.parameter.key"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="cdk-express-pipeline.ExpressStack.addMetadata.parameter.value"></a>

- *Type:* any

---

##### `addTransform` <a name="addTransform" id="cdk-express-pipeline.ExpressStack.addTransform"></a>

```typescript
public addTransform(transform: string): void
```

Add a Transform to this stack. A Transform is a macro that AWS CloudFormation uses to process your template.

Duplicate values are removed when stack is synthesized.

> [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/transform-section-structure.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/transform-section-structure.html)

*Example*

```typescript
declare const stack: Stack;

stack.addTransform('AWS::Serverless-2016-10-31')
```


###### `transform`<sup>Required</sup> <a name="transform" id="cdk-express-pipeline.ExpressStack.addTransform.parameter.transform"></a>

- *Type:* string

The transform to add.

---

##### `exportStringListValue` <a name="exportStringListValue" id="cdk-express-pipeline.ExpressStack.exportStringListValue"></a>

```typescript
public exportStringListValue(exportedValue: any, options?: ExportValueOptions): string[]
```

Create a CloudFormation Export for a string list value.

Returns a string list representing the corresponding `Fn.importValue()`
expression for this Export. The export expression is automatically wrapped with an
`Fn::Join` and the import value with an `Fn::Split`, since CloudFormation can only
export strings. You can control the name for the export by passing the `name` option.

If you don't supply a value for `name`, the value you're exporting must be
a Resource attribute (for example: `bucket.bucketName`) and it will be
given the same name as the automatic cross-stack reference that would be created
if you used the attribute in another Stack.

One of the uses for this method is to *remove* the relationship between
two Stacks established by automatic cross-stack references. It will
temporarily ensure that the CloudFormation Export still exists while you
remove the reference from the consuming stack. After that, you can remove
the resource and the manual export.

See `exportValue` for an example of this process.

###### `exportedValue`<sup>Required</sup> <a name="exportedValue" id="cdk-express-pipeline.ExpressStack.exportStringListValue.parameter.exportedValue"></a>

- *Type:* any

---

###### `options`<sup>Optional</sup> <a name="options" id="cdk-express-pipeline.ExpressStack.exportStringListValue.parameter.options"></a>

- *Type:* aws-cdk-lib.ExportValueOptions

---

##### `exportValue` <a name="exportValue" id="cdk-express-pipeline.ExpressStack.exportValue"></a>

```typescript
public exportValue(exportedValue: any, options?: ExportValueOptions): string
```

Create a CloudFormation Export for a string value.

Returns a string representing the corresponding `Fn.importValue()`
expression for this Export. You can control the name for the export by
passing the `name` option.

If you don't supply a value for `name`, the value you're exporting must be
a Resource attribute (for example: `bucket.bucketName`) and it will be
given the same name as the automatic cross-stack reference that would be created
if you used the attribute in another Stack.

One of the uses for this method is to *remove* the relationship between
two Stacks established by automatic cross-stack references. It will
temporarily ensure that the CloudFormation Export still exists while you
remove the reference from the consuming stack. After that, you can remove
the resource and the manual export.

## Example

Here is how the process works. Let's say there are two stacks,
`producerStack` and `consumerStack`, and `producerStack` has a bucket
called `bucket`, which is referenced by `consumerStack` (perhaps because
an AWS Lambda Function writes into it, or something like that).

It is not safe to remove `producerStack.bucket` because as the bucket is being
deleted, `consumerStack` might still be using it.

Instead, the process takes two deployments:

### Deployment 1: break the relationship

- Make sure `consumerStack` no longer references `bucket.bucketName` (maybe the consumer
  stack now uses its own bucket, or it writes to an AWS DynamoDB table, or maybe you just
  remove the Lambda Function altogether).
- In the `ProducerStack` class, call `this.exportValue(this.bucket.bucketName)`. This
  will make sure the CloudFormation Export continues to exist while the relationship
  between the two stacks is being broken.
- Deploy (this will effectively only change the `consumerStack`, but it's safe to deploy both).

### Deployment 2: remove the bucket resource

- You are now free to remove the `bucket` resource from `producerStack`.
- Don't forget to remove the `exportValue()` call as well.
- Deploy again (this time only the `producerStack` will be changed -- the bucket will be deleted).

###### `exportedValue`<sup>Required</sup> <a name="exportedValue" id="cdk-express-pipeline.ExpressStack.exportValue.parameter.exportedValue"></a>

- *Type:* any

---

###### `options`<sup>Optional</sup> <a name="options" id="cdk-express-pipeline.ExpressStack.exportValue.parameter.options"></a>

- *Type:* aws-cdk-lib.ExportValueOptions

---

##### `formatArn` <a name="formatArn" id="cdk-express-pipeline.ExpressStack.formatArn"></a>

```typescript
public formatArn(components: ArnComponents): string
```

Creates an ARN from components.

If `partition`, `region` or `account` are not specified, the stack's
partition, region and account will be used.

If any component is the empty string, an empty string will be inserted
into the generated ARN at the location that component corresponds to.

The ARN will be formatted as follows:

  arn:{partition}:{service}:{region}:{account}:{resource}{sep}{resource-name}

The required ARN pieces that are omitted will be taken from the stack that
the 'scope' is attached to. If all ARN pieces are supplied, the supplied scope
can be 'undefined'.

###### `components`<sup>Required</sup> <a name="components" id="cdk-express-pipeline.ExpressStack.formatArn.parameter.components"></a>

- *Type:* aws-cdk-lib.ArnComponents

---

##### `getLogicalId` <a name="getLogicalId" id="cdk-express-pipeline.ExpressStack.getLogicalId"></a>

```typescript
public getLogicalId(element: CfnElement): string
```

Allocates a stack-unique CloudFormation-compatible logical identity for a specific resource.

This method is called when a `CfnElement` is created and used to render the
initial logical identity of resources. Logical ID renames are applied at
this stage.

This method uses the protected method `allocateLogicalId` to render the
logical ID for an element. To modify the naming scheme, extend the `Stack`
class and override this method.

###### `element`<sup>Required</sup> <a name="element" id="cdk-express-pipeline.ExpressStack.getLogicalId.parameter.element"></a>

- *Type:* aws-cdk-lib.CfnElement

The CloudFormation element for which a logical identity is needed.

---

##### `regionalFact` <a name="regionalFact" id="cdk-express-pipeline.ExpressStack.regionalFact"></a>

```typescript
public regionalFact(factName: string, defaultValue?: string): string
```

Look up a fact value for the given fact for the region of this stack.

Will return a definite value only if the region of the current stack is resolved.
If not, a lookup map will be added to the stack and the lookup will be done at
CDK deployment time.

What regions will be included in the lookup map is controlled by the
`@aws-cdk/core:target-partitions` context value: it must be set to a list
of partitions, and only regions from the given partitions will be included.
If no such context key is set, all regions will be included.

This function is intended to be used by construct library authors. Application
builders can rely on the abstractions offered by construct libraries and do
not have to worry about regional facts.

If `defaultValue` is not given, it is an error if the fact is unknown for
the given region.

###### `factName`<sup>Required</sup> <a name="factName" id="cdk-express-pipeline.ExpressStack.regionalFact.parameter.factName"></a>

- *Type:* string

---

###### `defaultValue`<sup>Optional</sup> <a name="defaultValue" id="cdk-express-pipeline.ExpressStack.regionalFact.parameter.defaultValue"></a>

- *Type:* string

---

##### `renameLogicalId` <a name="renameLogicalId" id="cdk-express-pipeline.ExpressStack.renameLogicalId"></a>

```typescript
public renameLogicalId(oldId: string, newId: string): void
```

Rename a generated logical identities.

To modify the naming scheme strategy, extend the `Stack` class and
override the `allocateLogicalId` method.

###### `oldId`<sup>Required</sup> <a name="oldId" id="cdk-express-pipeline.ExpressStack.renameLogicalId.parameter.oldId"></a>

- *Type:* string

---

###### `newId`<sup>Required</sup> <a name="newId" id="cdk-express-pipeline.ExpressStack.renameLogicalId.parameter.newId"></a>

- *Type:* string

---

##### `reportMissingContextKey` <a name="reportMissingContextKey" id="cdk-express-pipeline.ExpressStack.reportMissingContextKey"></a>

```typescript
public reportMissingContextKey(report: MissingContext): void
```

Indicate that a context key was expected.

Contains instructions which will be emitted into the cloud assembly on how
the key should be supplied.

###### `report`<sup>Required</sup> <a name="report" id="cdk-express-pipeline.ExpressStack.reportMissingContextKey.parameter.report"></a>

- *Type:* aws-cdk-lib.cloud_assembly_schema.MissingContext

The set of parameters needed to obtain the context.

---

##### `resolve` <a name="resolve" id="cdk-express-pipeline.ExpressStack.resolve"></a>

```typescript
public resolve(obj: any): any
```

Resolve a tokenized value in the context of the current stack.

###### `obj`<sup>Required</sup> <a name="obj" id="cdk-express-pipeline.ExpressStack.resolve.parameter.obj"></a>

- *Type:* any

---

##### `splitArn` <a name="splitArn" id="cdk-express-pipeline.ExpressStack.splitArn"></a>

```typescript
public splitArn(arn: string, arnFormat: ArnFormat): ArnComponents
```

Splits the provided ARN into its components.

Works both if 'arn' is a string like 'arn:aws:s3:::bucket',
and a Token representing a dynamic CloudFormation expression
(in which case the returned components will also be dynamic CloudFormation expressions,
encoded as Tokens).

###### `arn`<sup>Required</sup> <a name="arn" id="cdk-express-pipeline.ExpressStack.splitArn.parameter.arn"></a>

- *Type:* string

the ARN to split into its components.

---

###### `arnFormat`<sup>Required</sup> <a name="arnFormat" id="cdk-express-pipeline.ExpressStack.splitArn.parameter.arnFormat"></a>

- *Type:* aws-cdk-lib.ArnFormat

the expected format of 'arn' - depends on what format the service 'arn' represents uses.

---

##### `toJsonString` <a name="toJsonString" id="cdk-express-pipeline.ExpressStack.toJsonString"></a>

```typescript
public toJsonString(obj: any, space?: number): string
```

Convert an object, potentially containing tokens, to a JSON string.

###### `obj`<sup>Required</sup> <a name="obj" id="cdk-express-pipeline.ExpressStack.toJsonString.parameter.obj"></a>

- *Type:* any

---

###### `space`<sup>Optional</sup> <a name="space" id="cdk-express-pipeline.ExpressStack.toJsonString.parameter.space"></a>

- *Type:* number

---

##### `toYamlString` <a name="toYamlString" id="cdk-express-pipeline.ExpressStack.toYamlString"></a>

```typescript
public toYamlString(obj: any): string
```

Convert an object, potentially containing tokens, to a YAML string.

###### `obj`<sup>Required</sup> <a name="obj" id="cdk-express-pipeline.ExpressStack.toYamlString.parameter.obj"></a>

- *Type:* any

---

##### `addExpressDependency` <a name="addExpressDependency" id="cdk-express-pipeline.ExpressStack.addExpressDependency"></a>

```typescript
public addExpressDependency(target: ExpressStack, reason?: string): void
```

Only use to create dependencies between Stacks in Waves and Stages for building the Pipeline, where having cyclic dependencies is not possible.

If the `addExpressDependency` is used outside the Pipeline construction,
it will not be safe. Use `addDependency` to create stack dependency within the same Stage.

###### `target`<sup>Required</sup> <a name="target" id="cdk-express-pipeline.ExpressStack.addExpressDependency.parameter.target"></a>

- *Type:* <a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>

---

###### `reason`<sup>Optional</sup> <a name="reason" id="cdk-express-pipeline.ExpressStack.addExpressDependency.parameter.reason"></a>

- *Type:* string

---

##### `expressDependencies` <a name="expressDependencies" id="cdk-express-pipeline.ExpressStack.expressDependencies"></a>

```typescript
public expressDependencies(): ExpressStack[]
```

The ExpressStack dependencies of the stack.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStack.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#cdk-express-pipeline.ExpressStack.isStack">isStack</a></code> | Return whether the given object is a Stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.of">of</a></code> | Looks up the first stack scope in which `construct` is defined. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-express-pipeline.ExpressStack.isConstruct"></a>

```typescript
import { ExpressStack } from 'cdk-express-pipeline'

ExpressStack.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-express-pipeline.ExpressStack.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isStack` <a name="isStack" id="cdk-express-pipeline.ExpressStack.isStack"></a>

```typescript
import { ExpressStack } from 'cdk-express-pipeline'

ExpressStack.isStack(x: any)
```

Return whether the given object is a Stack.

We do attribute detection since we can't reliably use 'instanceof'.

###### `x`<sup>Required</sup> <a name="x" id="cdk-express-pipeline.ExpressStack.isStack.parameter.x"></a>

- *Type:* any

---

##### `of` <a name="of" id="cdk-express-pipeline.ExpressStack.of"></a>

```typescript
import { ExpressStack } from 'cdk-express-pipeline'

ExpressStack.of(construct: IConstruct)
```

Looks up the first stack scope in which `construct` is defined.

Fails if there is no stack up the tree.

###### `construct`<sup>Required</sup> <a name="construct" id="cdk-express-pipeline.ExpressStack.of.parameter.construct"></a>

- *Type:* constructs.IConstruct

The construct to start the search from.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.account">account</a></code> | <code>string</code> | The AWS account into which this stack will be deployed. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.artifactId">artifactId</a></code> | <code>string</code> | The ID of the cloud assembly artifact for this stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.availabilityZones">availabilityZones</a></code> | <code>string[]</code> | Returns the list of AZs that are available in the AWS environment (account/region) associated with this stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.bundlingRequired">bundlingRequired</a></code> | <code>boolean</code> | Indicates whether the stack requires bundling or not. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.dependencies">dependencies</a></code> | <code>aws-cdk-lib.Stack[]</code> | Return the stacks this stack depends on. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.environment">environment</a></code> | <code>string</code> | The environment coordinates in which this stack is deployed. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.nested">nested</a></code> | <code>boolean</code> | Indicates if this is a nested stack, in which case `parentStack` will include a reference to it's parent. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.notificationArns">notificationArns</a></code> | <code>string[]</code> | Returns the list of notification Amazon Resource Names (ARNs) for the current stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.partition">partition</a></code> | <code>string</code> | The partition in which this stack is defined. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.region">region</a></code> | <code>string</code> | The AWS region into which this stack will be deployed (e.g. `us-west-2`). |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.stackId">stackId</a></code> | <code>string</code> | The ID of the stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.stackName">stackName</a></code> | <code>string</code> | The concrete CloudFormation physical stack name. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.synthesizer">synthesizer</a></code> | <code>aws-cdk-lib.IStackSynthesizer</code> | Synthesis method for this stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.tags">tags</a></code> | <code>aws-cdk-lib.TagManager</code> | Tags to be applied to the stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.templateFile">templateFile</a></code> | <code>string</code> | The name of the CloudFormation template file emitted to the output directory during synthesis. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.templateOptions">templateOptions</a></code> | <code>aws-cdk-lib.ITemplateOptions</code> | Options for CloudFormation template (like version, transform, description). |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.urlSuffix">urlSuffix</a></code> | <code>string</code> | The Amazon domain suffix for the region in which this stack is defined. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.nestedStackParent">nestedStackParent</a></code> | <code>aws-cdk-lib.Stack</code> | If this is a nested stack, returns it's parent stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.nestedStackResource">nestedStackResource</a></code> | <code>aws-cdk-lib.CfnResource</code> | If this is a nested stack, this represents its `AWS::CloudFormation::Stack` resource. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.terminationProtection">terminationProtection</a></code> | <code>boolean</code> | Whether termination protection is enabled for this stack. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.id">id</a></code> | <code>string</code> | The stack identifier which is a combination of the wave, stage and stack id. |
| <code><a href="#cdk-express-pipeline.ExpressStack.property.stage">stage</a></code> | <code><a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a></code> | The stage that the stack belongs to. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-express-pipeline.ExpressStack.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `account`<sup>Required</sup> <a name="account" id="cdk-express-pipeline.ExpressStack.property.account"></a>

```typescript
public readonly account: string;
```

- *Type:* string

The AWS account into which this stack will be deployed.

This value is resolved according to the following rules:

1. The value provided to `env.account` when the stack is defined. This can
   either be a concrete account (e.g. `585695031111`) or the
   `Aws.ACCOUNT_ID` token.
3. `Aws.ACCOUNT_ID`, which represents the CloudFormation intrinsic reference
   `{ "Ref": "AWS::AccountId" }` encoded as a string token.

Preferably, you should use the return value as an opaque string and not
attempt to parse it to implement your logic. If you do, you must first
check that it is a concrete value an not an unresolved token. If this
value is an unresolved token (`Token.isUnresolved(stack.account)` returns
`true`), this implies that the user wishes that this stack will synthesize
into a **account-agnostic template**. In this case, your code should either
fail (throw an error, emit a synth error using `Annotations.of(construct).addError()`) or
implement some other region-agnostic behavior.

---

##### `artifactId`<sup>Required</sup> <a name="artifactId" id="cdk-express-pipeline.ExpressStack.property.artifactId"></a>

```typescript
public readonly artifactId: string;
```

- *Type:* string

The ID of the cloud assembly artifact for this stack.

---

##### `availabilityZones`<sup>Required</sup> <a name="availabilityZones" id="cdk-express-pipeline.ExpressStack.property.availabilityZones"></a>

```typescript
public readonly availabilityZones: string[];
```

- *Type:* string[]

Returns the list of AZs that are available in the AWS environment (account/region) associated with this stack.

If the stack is environment-agnostic (either account and/or region are
tokens), this property will return an array with 2 tokens that will resolve
at deploy-time to the first two availability zones returned from CloudFormation's
`Fn::GetAZs` intrinsic function.

If they are not available in the context, returns a set of dummy values and
reports them as missing, and let the CLI resolve them by calling EC2
`DescribeAvailabilityZones` on the target environment.

To specify a different strategy for selecting availability zones override this method.

---

##### `bundlingRequired`<sup>Required</sup> <a name="bundlingRequired" id="cdk-express-pipeline.ExpressStack.property.bundlingRequired"></a>

```typescript
public readonly bundlingRequired: boolean;
```

- *Type:* boolean

Indicates whether the stack requires bundling or not.

---

##### `dependencies`<sup>Required</sup> <a name="dependencies" id="cdk-express-pipeline.ExpressStack.property.dependencies"></a>

```typescript
public readonly dependencies: Stack[];
```

- *Type:* aws-cdk-lib.Stack[]

Return the stacks this stack depends on.

---

##### `environment`<sup>Required</sup> <a name="environment" id="cdk-express-pipeline.ExpressStack.property.environment"></a>

```typescript
public readonly environment: string;
```

- *Type:* string

The environment coordinates in which this stack is deployed.

In the form
`aws://account/region`. Use `stack.account` and `stack.region` to obtain
the specific values, no need to parse.

You can use this value to determine if two stacks are targeting the same
environment.

If either `stack.account` or `stack.region` are not concrete values (e.g.
`Aws.ACCOUNT_ID` or `Aws.REGION`) the special strings `unknown-account` and/or
`unknown-region` will be used respectively to indicate this stack is
region/account-agnostic.

---

##### `nested`<sup>Required</sup> <a name="nested" id="cdk-express-pipeline.ExpressStack.property.nested"></a>

```typescript
public readonly nested: boolean;
```

- *Type:* boolean

Indicates if this is a nested stack, in which case `parentStack` will include a reference to it's parent.

---

##### `notificationArns`<sup>Required</sup> <a name="notificationArns" id="cdk-express-pipeline.ExpressStack.property.notificationArns"></a>

```typescript
public readonly notificationArns: string[];
```

- *Type:* string[]

Returns the list of notification Amazon Resource Names (ARNs) for the current stack.

---

##### `partition`<sup>Required</sup> <a name="partition" id="cdk-express-pipeline.ExpressStack.property.partition"></a>

```typescript
public readonly partition: string;
```

- *Type:* string

The partition in which this stack is defined.

---

##### `region`<sup>Required</sup> <a name="region" id="cdk-express-pipeline.ExpressStack.property.region"></a>

```typescript
public readonly region: string;
```

- *Type:* string

The AWS region into which this stack will be deployed (e.g. `us-west-2`).

This value is resolved according to the following rules:

1. The value provided to `env.region` when the stack is defined. This can
   either be a concrete region (e.g. `us-west-2`) or the `Aws.REGION`
   token.
3. `Aws.REGION`, which is represents the CloudFormation intrinsic reference
   `{ "Ref": "AWS::Region" }` encoded as a string token.

Preferably, you should use the return value as an opaque string and not
attempt to parse it to implement your logic. If you do, you must first
check that it is a concrete value an not an unresolved token. If this
value is an unresolved token (`Token.isUnresolved(stack.region)` returns
`true`), this implies that the user wishes that this stack will synthesize
into a **region-agnostic template**. In this case, your code should either
fail (throw an error, emit a synth error using `Annotations.of(construct).addError()`) or
implement some other region-agnostic behavior.

---

##### `stackId`<sup>Required</sup> <a name="stackId" id="cdk-express-pipeline.ExpressStack.property.stackId"></a>

```typescript
public readonly stackId: string;
```

- *Type:* string

The ID of the stack.

---

*Example*

```typescript
// After resolving, looks like
'arn:aws:cloudformation:us-west-2:123456789012:stack/teststack/51af3dc0-da77-11e4-872e-1234567db123'
```


##### `stackName`<sup>Required</sup> <a name="stackName" id="cdk-express-pipeline.ExpressStack.property.stackName"></a>

```typescript
public readonly stackName: string;
```

- *Type:* string

The concrete CloudFormation physical stack name.

This is either the name defined explicitly in the `stackName` prop or
allocated based on the stack's location in the construct tree. Stacks that
are directly defined under the app use their construct `id` as their stack
name. Stacks that are defined deeper within the tree will use a hashed naming
scheme based on the construct path to ensure uniqueness.

If you wish to obtain the deploy-time AWS::StackName intrinsic,
you can use `Aws.STACK_NAME` directly.

---

##### `synthesizer`<sup>Required</sup> <a name="synthesizer" id="cdk-express-pipeline.ExpressStack.property.synthesizer"></a>

```typescript
public readonly synthesizer: IStackSynthesizer;
```

- *Type:* aws-cdk-lib.IStackSynthesizer

Synthesis method for this stack.

---

##### `tags`<sup>Required</sup> <a name="tags" id="cdk-express-pipeline.ExpressStack.property.tags"></a>

```typescript
public readonly tags: TagManager;
```

- *Type:* aws-cdk-lib.TagManager

Tags to be applied to the stack.

---

##### `templateFile`<sup>Required</sup> <a name="templateFile" id="cdk-express-pipeline.ExpressStack.property.templateFile"></a>

```typescript
public readonly templateFile: string;
```

- *Type:* string

The name of the CloudFormation template file emitted to the output directory during synthesis.

Example value: `MyStack.template.json`

---

##### `templateOptions`<sup>Required</sup> <a name="templateOptions" id="cdk-express-pipeline.ExpressStack.property.templateOptions"></a>

```typescript
public readonly templateOptions: ITemplateOptions;
```

- *Type:* aws-cdk-lib.ITemplateOptions

Options for CloudFormation template (like version, transform, description).

---

##### `urlSuffix`<sup>Required</sup> <a name="urlSuffix" id="cdk-express-pipeline.ExpressStack.property.urlSuffix"></a>

```typescript
public readonly urlSuffix: string;
```

- *Type:* string

The Amazon domain suffix for the region in which this stack is defined.

---

##### `nestedStackParent`<sup>Optional</sup> <a name="nestedStackParent" id="cdk-express-pipeline.ExpressStack.property.nestedStackParent"></a>

```typescript
public readonly nestedStackParent: Stack;
```

- *Type:* aws-cdk-lib.Stack

If this is a nested stack, returns it's parent stack.

---

##### `nestedStackResource`<sup>Optional</sup> <a name="nestedStackResource" id="cdk-express-pipeline.ExpressStack.property.nestedStackResource"></a>

```typescript
public readonly nestedStackResource: CfnResource;
```

- *Type:* aws-cdk-lib.CfnResource

If this is a nested stack, this represents its `AWS::CloudFormation::Stack` resource.

`undefined` for top-level (non-nested) stacks.

---

##### `terminationProtection`<sup>Required</sup> <a name="terminationProtection" id="cdk-express-pipeline.ExpressStack.property.terminationProtection"></a>

```typescript
public readonly terminationProtection: boolean;
```

- *Type:* boolean

Whether termination protection is enabled for this stack.

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressStack.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The stack identifier which is a combination of the wave, stage and stack id.

---

##### `stage`<sup>Required</sup> <a name="stage" id="cdk-express-pipeline.ExpressStack.property.stage"></a>

```typescript
public readonly stage: ExpressStage;
```

- *Type:* <a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>

The stage that the stack belongs to.

---


## Structs <a name="Structs" id="Structs"></a>

### BuildWorkflowPathConfig <a name="BuildWorkflowPathConfig" id="cdk-express-pipeline.BuildWorkflowPathConfig"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.BuildWorkflowPathConfig.Initializer"></a>

```typescript
import { BuildWorkflowPathConfig } from 'cdk-express-pipeline'

const buildWorkflowPathConfig: BuildWorkflowPathConfig = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.BuildWorkflowPathConfig.property.type">type</a></code> | <code>string</code> | The type of workflow to use. |
| <code><a href="#cdk-express-pipeline.BuildWorkflowPathConfig.property.workflow">workflow</a></code> | <code><a href="#cdk-express-pipeline.WorkflowLocation">WorkflowLocation</a></code> | Only required if type is 'workflow'. |

---

##### `type`<sup>Required</sup> <a name="type" id="cdk-express-pipeline.BuildWorkflowPathConfig.property.type"></a>

```typescript
public readonly type: string;
```

- *Type:* string

The type of workflow to use.

---

##### `workflow`<sup>Optional</sup> <a name="workflow" id="cdk-express-pipeline.BuildWorkflowPathConfig.property.workflow"></a>

```typescript
public readonly workflow: WorkflowLocation;
```

- *Type:* <a href="#cdk-express-pipeline.WorkflowLocation">WorkflowLocation</a>

Only required if type is 'workflow'.

Specify the workflow or reusable action to use for building

---

### CdkExpressPipelineProps <a name="CdkExpressPipelineProps" id="cdk-express-pipeline.CdkExpressPipelineProps"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.CdkExpressPipelineProps.Initializer"></a>

```typescript
import { CdkExpressPipelineProps } from 'cdk-express-pipeline'

const cdkExpressPipelineProps: CdkExpressPipelineProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineProps.property.separator">separator</a></code> | <code>string</code> | Separator between the wave, stage and stack ids that are concatenated to form the stack id. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineProps.property.waves">waves</a></code> | <code><a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a>[]</code> | The waves in the pipeline. |

---

##### `separator`<sup>Optional</sup> <a name="separator" id="cdk-express-pipeline.CdkExpressPipelineProps.property.separator"></a>

```typescript
public readonly separator: string;
```

- *Type:* string
- *Default:* _

Separator between the wave, stage and stack ids that are concatenated to form the stack id.

---

##### `waves`<sup>Optional</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipelineProps.property.waves"></a>

```typescript
public readonly waves: ExpressWave[];
```

- *Type:* <a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a>[]

The waves in the pipeline.

---

### DeployWorkflowConfig <a name="DeployWorkflowConfig" id="cdk-express-pipeline.DeployWorkflowConfig"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.DeployWorkflowConfig.Initializer"></a>

```typescript
import { DeployWorkflowConfig } from 'cdk-express-pipeline'

const deployWorkflowConfig: DeployWorkflowConfig = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.DeployWorkflowConfig.property.assumeRegion">assumeRegion</a></code> | <code>string</code> | AWS region to assume for the diff operation. |
| <code><a href="#cdk-express-pipeline.DeployWorkflowConfig.property.assumeRoleArn">assumeRoleArn</a></code> | <code>string</code> | ARN of the role to assume for the diff operation. |
| <code><a href="#cdk-express-pipeline.DeployWorkflowConfig.property.commands">commands</a></code> | <code>{[ key: string ]: string}[]</code> | Commands to run for synthesis. |
| <code><a href="#cdk-express-pipeline.DeployWorkflowConfig.property.on">on</a></code> | <code><a href="#cdk-express-pipeline.WorkflowTriggers">WorkflowTriggers</a></code> | Conditions that trigger the deploy workflow. |
| <code><a href="#cdk-express-pipeline.DeployWorkflowConfig.property.stackSelector">stackSelector</a></code> | <code>string</code> | Selector for the stack type. |
| <code><a href="#cdk-express-pipeline.DeployWorkflowConfig.property.id">id</a></code> | <code>string</code> | Unique identifier, postfixed to the generated workflow name. |

---

##### `assumeRegion`<sup>Required</sup> <a name="assumeRegion" id="cdk-express-pipeline.DeployWorkflowConfig.property.assumeRegion"></a>

```typescript
public readonly assumeRegion: string;
```

- *Type:* string

AWS region to assume for the diff operation.

---

##### `assumeRoleArn`<sup>Required</sup> <a name="assumeRoleArn" id="cdk-express-pipeline.DeployWorkflowConfig.property.assumeRoleArn"></a>

```typescript
public readonly assumeRoleArn: string;
```

- *Type:* string

ARN of the role to assume for the diff operation.

---

##### `commands`<sup>Required</sup> <a name="commands" id="cdk-express-pipeline.DeployWorkflowConfig.property.commands"></a>

```typescript
public readonly commands: {[ key: string ]: string}[];
```

- *Type:* {[ key: string ]: string}[]

Commands to run for synthesis.

---

##### `on`<sup>Required</sup> <a name="on" id="cdk-express-pipeline.DeployWorkflowConfig.property.on"></a>

```typescript
public readonly on: WorkflowTriggers;
```

- *Type:* <a href="#cdk-express-pipeline.WorkflowTriggers">WorkflowTriggers</a>

Conditions that trigger the deploy workflow.

---

##### `stackSelector`<sup>Required</sup> <a name="stackSelector" id="cdk-express-pipeline.DeployWorkflowConfig.property.stackSelector"></a>

```typescript
public readonly stackSelector: string;
```

- *Type:* string

Selector for the stack type.

---

##### `id`<sup>Optional</sup> <a name="id" id="cdk-express-pipeline.DeployWorkflowConfig.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Unique identifier, postfixed to the generated workflow name.

Can be omitted if only one workflow is specified.

---

### DiffWorkflowConfig <a name="DiffWorkflowConfig" id="cdk-express-pipeline.DiffWorkflowConfig"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.DiffWorkflowConfig.Initializer"></a>

```typescript
import { DiffWorkflowConfig } from 'cdk-express-pipeline'

const diffWorkflowConfig: DiffWorkflowConfig = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.assumeRegion">assumeRegion</a></code> | <code>string</code> | AWS region to assume for the diff operation. |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.assumeRoleArn">assumeRoleArn</a></code> | <code>string</code> | ARN of the role to assume for the diff operation. |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.commands">commands</a></code> | <code>{[ key: string ]: string}[]</code> | Commands to run for synthesis. |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.on">on</a></code> | <code><a href="#cdk-express-pipeline.WorkflowTriggers">WorkflowTriggers</a></code> | Conditions that trigger the diff workflow. |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.stackSelector">stackSelector</a></code> | <code>string</code> | Selector for the stack type. |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.id">id</a></code> | <code>string</code> | Unique identifier, postfixed to the generated workflow name. |
| <code><a href="#cdk-express-pipeline.DiffWorkflowConfig.property.writeAsComment">writeAsComment</a></code> | <code>boolean</code> | Whether to write the diff as a comment. |

---

##### `assumeRegion`<sup>Required</sup> <a name="assumeRegion" id="cdk-express-pipeline.DiffWorkflowConfig.property.assumeRegion"></a>

```typescript
public readonly assumeRegion: string;
```

- *Type:* string

AWS region to assume for the diff operation.

---

##### `assumeRoleArn`<sup>Required</sup> <a name="assumeRoleArn" id="cdk-express-pipeline.DiffWorkflowConfig.property.assumeRoleArn"></a>

```typescript
public readonly assumeRoleArn: string;
```

- *Type:* string

ARN of the role to assume for the diff operation.

---

##### `commands`<sup>Required</sup> <a name="commands" id="cdk-express-pipeline.DiffWorkflowConfig.property.commands"></a>

```typescript
public readonly commands: {[ key: string ]: string}[];
```

- *Type:* {[ key: string ]: string}[]

Commands to run for synthesis.

---

##### `on`<sup>Required</sup> <a name="on" id="cdk-express-pipeline.DiffWorkflowConfig.property.on"></a>

```typescript
public readonly on: WorkflowTriggers;
```

- *Type:* <a href="#cdk-express-pipeline.WorkflowTriggers">WorkflowTriggers</a>

Conditions that trigger the diff workflow.

---

##### `stackSelector`<sup>Required</sup> <a name="stackSelector" id="cdk-express-pipeline.DiffWorkflowConfig.property.stackSelector"></a>

```typescript
public readonly stackSelector: string;
```

- *Type:* string

Selector for the stack type.

---

##### `id`<sup>Optional</sup> <a name="id" id="cdk-express-pipeline.DiffWorkflowConfig.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

Unique identifier, postfixed to the generated workflow name.

Can be omitted if only one workflow is specified.

---

##### `writeAsComment`<sup>Optional</sup> <a name="writeAsComment" id="cdk-express-pipeline.DiffWorkflowConfig.property.writeAsComment"></a>

```typescript
public readonly writeAsComment: boolean;
```

- *Type:* boolean
- *Default:* true

Whether to write the diff as a comment.

---

### ExpressWaveProps <a name="ExpressWaveProps" id="cdk-express-pipeline.ExpressWaveProps"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.ExpressWaveProps.Initializer"></a>

```typescript
import { ExpressWaveProps } from 'cdk-express-pipeline'

const expressWaveProps: ExpressWaveProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWaveProps.property.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-express-pipeline.ExpressWaveProps.property.separator">separator</a></code> | <code>string</code> | Separator between the wave, stage and stack ids that are concatenated to form the stack id. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWaveProps.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

---

##### `separator`<sup>Optional</sup> <a name="separator" id="cdk-express-pipeline.ExpressWaveProps.property.separator"></a>

```typescript
public readonly separator: string;
```

- *Type:* string
- *Default:* `_`

Separator between the wave, stage and stack ids that are concatenated to form the stack id.

---

### GitHubWorkflowConfig <a name="GitHubWorkflowConfig" id="cdk-express-pipeline.GitHubWorkflowConfig"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.GitHubWorkflowConfig.Initializer"></a>

```typescript
import { GitHubWorkflowConfig } from 'cdk-express-pipeline'

const gitHubWorkflowConfig: GitHubWorkflowConfig = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.GitHubWorkflowConfig.property.deploy">deploy</a></code> | <code><a href="#cdk-express-pipeline.DeployWorkflowConfig">DeployWorkflowConfig</a>[]</code> | Configuration for the deploy workflow. |
| <code><a href="#cdk-express-pipeline.GitHubWorkflowConfig.property.diff">diff</a></code> | <code><a href="#cdk-express-pipeline.DiffWorkflowConfig">DiffWorkflowConfig</a>[]</code> | Configuration for the diff workflow. |
| <code><a href="#cdk-express-pipeline.GitHubWorkflowConfig.property.synth">synth</a></code> | <code><a href="#cdk-express-pipeline.SynthWorkflowConfig">SynthWorkflowConfig</a></code> | Configuration for the synth workflow. |
| <code><a href="#cdk-express-pipeline.GitHubWorkflowConfig.property.workingDir">workingDir</a></code> | <code>string</code> | The working directory for the GitHub workflow. |

---

##### `deploy`<sup>Required</sup> <a name="deploy" id="cdk-express-pipeline.GitHubWorkflowConfig.property.deploy"></a>

```typescript
public readonly deploy: DeployWorkflowConfig[];
```

- *Type:* <a href="#cdk-express-pipeline.DeployWorkflowConfig">DeployWorkflowConfig</a>[]

Configuration for the deploy workflow.

---

##### `diff`<sup>Required</sup> <a name="diff" id="cdk-express-pipeline.GitHubWorkflowConfig.property.diff"></a>

```typescript
public readonly diff: DiffWorkflowConfig[];
```

- *Type:* <a href="#cdk-express-pipeline.DiffWorkflowConfig">DiffWorkflowConfig</a>[]

Configuration for the diff workflow.

---

##### `synth`<sup>Required</sup> <a name="synth" id="cdk-express-pipeline.GitHubWorkflowConfig.property.synth"></a>

```typescript
public readonly synth: SynthWorkflowConfig;
```

- *Type:* <a href="#cdk-express-pipeline.SynthWorkflowConfig">SynthWorkflowConfig</a>

Configuration for the synth workflow.

---

##### `workingDir`<sup>Optional</sup> <a name="workingDir" id="cdk-express-pipeline.GitHubWorkflowConfig.property.workingDir"></a>

```typescript
public readonly workingDir: string;
```

- *Type:* string
- *Default:* "."

The working directory for the GitHub workflow.

---

### GithubWorkflowFile <a name="GithubWorkflowFile" id="cdk-express-pipeline.GithubWorkflowFile"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.GithubWorkflowFile.Initializer"></a>

```typescript
import { GithubWorkflowFile } from 'cdk-express-pipeline'

const githubWorkflowFile: GithubWorkflowFile = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.GithubWorkflowFile.property.content">content</a></code> | <code><a href="#cdk-express-pipeline.GithubWorkflow">GithubWorkflow</a></code> | *No description.* |
| <code><a href="#cdk-express-pipeline.GithubWorkflowFile.property.fileName">fileName</a></code> | <code>string</code> | *No description.* |

---

##### `content`<sup>Required</sup> <a name="content" id="cdk-express-pipeline.GithubWorkflowFile.property.content"></a>

```typescript
public readonly content: GithubWorkflow;
```

- *Type:* <a href="#cdk-express-pipeline.GithubWorkflow">GithubWorkflow</a>

---

##### `fileName`<sup>Required</sup> <a name="fileName" id="cdk-express-pipeline.GithubWorkflowFile.property.fileName"></a>

```typescript
public readonly fileName: string;
```

- *Type:* string

---

### MermaidDiagramOutput <a name="MermaidDiagramOutput" id="cdk-express-pipeline.MermaidDiagramOutput"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.MermaidDiagramOutput.Initializer"></a>

```typescript
import { MermaidDiagramOutput } from 'cdk-express-pipeline'

const mermaidDiagramOutput: MermaidDiagramOutput = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.MermaidDiagramOutput.property.fileName">fileName</a></code> | <code>string</code> | Must end in `.md`. If not provided, defaults to cdk-express-pipeline-deployment-order.md. |
| <code><a href="#cdk-express-pipeline.MermaidDiagramOutput.property.path">path</a></code> | <code>string</code> | The path where the Mermaid diagram will be saved. |

---

##### `fileName`<sup>Optional</sup> <a name="fileName" id="cdk-express-pipeline.MermaidDiagramOutput.property.fileName"></a>

```typescript
public readonly fileName: string;
```

- *Type:* string

Must end in `.md`. If not provided, defaults to cdk-express-pipeline-deployment-order.md.

---

##### `path`<sup>Optional</sup> <a name="path" id="cdk-express-pipeline.MermaidDiagramOutput.property.path"></a>

```typescript
public readonly path: string;
```

- *Type:* string

The path where the Mermaid diagram will be saved.

If not provided defaults to root

---

### Patch <a name="Patch" id="cdk-express-pipeline.Patch"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.Patch.Initializer"></a>

```typescript
import { Patch } from 'cdk-express-pipeline'

const patch: Patch = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.Patch.property.op">op</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-express-pipeline.Patch.property.path">path</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-express-pipeline.Patch.property.from">from</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-express-pipeline.Patch.property.value">value</a></code> | <code>any</code> | *No description.* |

---

##### `op`<sup>Required</sup> <a name="op" id="cdk-express-pipeline.Patch.property.op"></a>

```typescript
public readonly op: string;
```

- *Type:* string

---

##### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.Patch.property.path"></a>

```typescript
public readonly path: string;
```

- *Type:* string

---

##### `from`<sup>Optional</sup> <a name="from" id="cdk-express-pipeline.Patch.property.from"></a>

```typescript
public readonly from: string;
```

- *Type:* string

---

##### `value`<sup>Optional</sup> <a name="value" id="cdk-express-pipeline.Patch.property.value"></a>

```typescript
public readonly value: any;
```

- *Type:* any

---

### SynthWorkflowConfig <a name="SynthWorkflowConfig" id="cdk-express-pipeline.SynthWorkflowConfig"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.SynthWorkflowConfig.Initializer"></a>

```typescript
import { SynthWorkflowConfig } from 'cdk-express-pipeline'

const synthWorkflowConfig: SynthWorkflowConfig = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.SynthWorkflowConfig.property.buildConfig">buildConfig</a></code> | <code><a href="#cdk-express-pipeline.BuildWorkflowPathConfig">BuildWorkflowPathConfig</a></code> | Configuration for the build workflow path. |
| <code><a href="#cdk-express-pipeline.SynthWorkflowConfig.property.commands">commands</a></code> | <code>{[ key: string ]: string}[]</code> | Commands to run for synthesis. |

---

##### `buildConfig`<sup>Required</sup> <a name="buildConfig" id="cdk-express-pipeline.SynthWorkflowConfig.property.buildConfig"></a>

```typescript
public readonly buildConfig: BuildWorkflowPathConfig;
```

- *Type:* <a href="#cdk-express-pipeline.BuildWorkflowPathConfig">BuildWorkflowPathConfig</a>

Configuration for the build workflow path.

---

##### `commands`<sup>Required</sup> <a name="commands" id="cdk-express-pipeline.SynthWorkflowConfig.property.commands"></a>

```typescript
public readonly commands: {[ key: string ]: string}[];
```

- *Type:* {[ key: string ]: string}[]

Commands to run for synthesis.

---

### WorkflowLocation <a name="WorkflowLocation" id="cdk-express-pipeline.WorkflowLocation"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.WorkflowLocation.Initializer"></a>

```typescript
import { WorkflowLocation } from 'cdk-express-pipeline'

const workflowLocation: WorkflowLocation = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.WorkflowLocation.property.path">path</a></code> | <code>string</code> | The path of the workflow to call before synthesis. |

---

##### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.WorkflowLocation.property.path"></a>

```typescript
public readonly path: string;
```

- *Type:* string

The path of the workflow to call before synthesis.

---

### WorkflowTriggers <a name="WorkflowTriggers" id="cdk-express-pipeline.WorkflowTriggers"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.WorkflowTriggers.Initializer"></a>

```typescript
import { WorkflowTriggers } from 'cdk-express-pipeline'

const workflowTriggers: WorkflowTriggers = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.WorkflowTriggers.property.pullRequest">pullRequest</a></code> | <code><a href="#cdk-express-pipeline.WorkflowTriggersPullRequests">WorkflowTriggersPullRequests</a></code> | *No description.* |
| <code><a href="#cdk-express-pipeline.WorkflowTriggers.property.push">push</a></code> | <code><a href="#cdk-express-pipeline.WorkflowTriggersPush">WorkflowTriggersPush</a></code> | *No description.* |

---

##### `pullRequest`<sup>Optional</sup> <a name="pullRequest" id="cdk-express-pipeline.WorkflowTriggers.property.pullRequest"></a>

```typescript
public readonly pullRequest: WorkflowTriggersPullRequests;
```

- *Type:* <a href="#cdk-express-pipeline.WorkflowTriggersPullRequests">WorkflowTriggersPullRequests</a>

---

##### `push`<sup>Optional</sup> <a name="push" id="cdk-express-pipeline.WorkflowTriggers.property.push"></a>

```typescript
public readonly push: WorkflowTriggersPush;
```

- *Type:* <a href="#cdk-express-pipeline.WorkflowTriggersPush">WorkflowTriggersPush</a>

---

### WorkflowTriggersPullRequests <a name="WorkflowTriggersPullRequests" id="cdk-express-pipeline.WorkflowTriggersPullRequests"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.WorkflowTriggersPullRequests.Initializer"></a>

```typescript
import { WorkflowTriggersPullRequests } from 'cdk-express-pipeline'

const workflowTriggersPullRequests: WorkflowTriggersPullRequests = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.WorkflowTriggersPullRequests.property.branches">branches</a></code> | <code>string[]</code> | *No description.* |

---

##### `branches`<sup>Optional</sup> <a name="branches" id="cdk-express-pipeline.WorkflowTriggersPullRequests.property.branches"></a>

```typescript
public readonly branches: string[];
```

- *Type:* string[]

---

### WorkflowTriggersPush <a name="WorkflowTriggersPush" id="cdk-express-pipeline.WorkflowTriggersPush"></a>

#### Initializer <a name="Initializer" id="cdk-express-pipeline.WorkflowTriggersPush.Initializer"></a>

```typescript
import { WorkflowTriggersPush } from 'cdk-express-pipeline'

const workflowTriggersPush: WorkflowTriggersPush = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.WorkflowTriggersPush.property.branches">branches</a></code> | <code>string[]</code> | *No description.* |

---

##### `branches`<sup>Optional</sup> <a name="branches" id="cdk-express-pipeline.WorkflowTriggersPush.property.branches"></a>

```typescript
public readonly branches: string[];
```

- *Type:* string[]

---

## Classes <a name="Classes" id="Classes"></a>

### CdkExpressPipeline <a name="CdkExpressPipeline" id="cdk-express-pipeline.CdkExpressPipeline"></a>

A CDK Express Pipeline that defines the order in which the stacks are deployed.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.CdkExpressPipeline.Initializer"></a>

```typescript
import { CdkExpressPipeline } from 'cdk-express-pipeline'

new CdkExpressPipeline(props?: CdkExpressPipelineProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-express-pipeline.CdkExpressPipelineProps">CdkExpressPipelineProps</a></code> | *No description.* |

---

##### `props`<sup>Optional</sup> <a name="props" id="cdk-express-pipeline.CdkExpressPipeline.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-express-pipeline.CdkExpressPipelineProps">CdkExpressPipelineProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.addWave">addWave</a></code> | Add a wave to the pipeline. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.generateGitHubWorkflows">generateGitHubWorkflows</a></code> | *No description.* |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.generateMermaidDiagram">generateMermaidDiagram</a></code> | Generate a Mermaid diagram showing the deployment order. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.printWaves">printWaves</a></code> | Print the order of deployment to the console. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.synth">synth</a></code> | Synthesize the pipeline which creates the dependencies between the stacks in the correct order. |

---

##### `addWave` <a name="addWave" id="cdk-express-pipeline.CdkExpressPipeline.addWave"></a>

```typescript
public addWave(id: string, sequentialStages?: boolean): IExpressWave
```

Add a wave to the pipeline.

###### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.CdkExpressPipeline.addWave.parameter.id"></a>

- *Type:* string

The wave identifier.

---

###### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.CdkExpressPipeline.addWave.parameter.sequentialStages"></a>

- *Type:* boolean

If true, the stages in the wave will be executed sequentially.

Default: false.

---

##### `generateGitHubWorkflows` <a name="generateGitHubWorkflows" id="cdk-express-pipeline.CdkExpressPipeline.generateGitHubWorkflows"></a>

```typescript
public generateGitHubWorkflows(gitHubWorkflowConfig: GitHubWorkflowConfig, saveToFiles: boolean): GithubWorkflowFile[]
```

###### `gitHubWorkflowConfig`<sup>Required</sup> <a name="gitHubWorkflowConfig" id="cdk-express-pipeline.CdkExpressPipeline.generateGitHubWorkflows.parameter.gitHubWorkflowConfig"></a>

- *Type:* <a href="#cdk-express-pipeline.GitHubWorkflowConfig">GitHubWorkflowConfig</a>

---

###### `saveToFiles`<sup>Required</sup> <a name="saveToFiles" id="cdk-express-pipeline.CdkExpressPipeline.generateGitHubWorkflows.parameter.saveToFiles"></a>

- *Type:* boolean

---

##### `generateMermaidDiagram` <a name="generateMermaidDiagram" id="cdk-express-pipeline.CdkExpressPipeline.generateMermaidDiagram"></a>

```typescript
public generateMermaidDiagram(waves: IExpressWave[]): string
```

Generate a Mermaid diagram showing the deployment order.

###### `waves`<sup>Required</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipeline.generateMermaidDiagram.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>[]

The waves to include in the diagram.

---

##### `printWaves` <a name="printWaves" id="cdk-express-pipeline.CdkExpressPipeline.printWaves"></a>

```typescript
public printWaves(waves: IExpressWave[]): void
```

Print the order of deployment to the console.

###### `waves`<sup>Required</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipeline.printWaves.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>[]

---

##### `synth` <a name="synth" id="cdk-express-pipeline.CdkExpressPipeline.synth"></a>

```typescript
public synth(waves?: IExpressWave[], print?: boolean, saveMermaidDiagram?: MermaidDiagramOutput): void
```

Synthesize the pipeline which creates the dependencies between the stacks in the correct order.

###### `waves`<sup>Optional</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipeline.synth.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>[]

The waves to synthesize.

---

###### `print`<sup>Optional</sup> <a name="print" id="cdk-express-pipeline.CdkExpressPipeline.synth.parameter.print"></a>

- *Type:* boolean

Whether to print the order of deployment to the console.

---

###### `saveMermaidDiagram`<sup>Optional</sup> <a name="saveMermaidDiagram" id="cdk-express-pipeline.CdkExpressPipeline.synth.parameter.saveMermaidDiagram"></a>

- *Type:* <a href="#cdk-express-pipeline.MermaidDiagramOutput">MermaidDiagramOutput</a>

If provided, saves a Mermaid diagram of the deployment order to the specified path.

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipeline.property.waves">waves</a></code> | <code><a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>[]</code> | *No description.* |

---

##### `waves`<sup>Required</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipeline.property.waves"></a>

```typescript
public readonly waves: IExpressWave[];
```

- *Type:* <a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>[]

---


### CdkExpressPipelineLegacy <a name="CdkExpressPipelineLegacy" id="cdk-express-pipeline.CdkExpressPipelineLegacy"></a>

A CDK Express Pipeline that defines the order in which the stacks are deployed.

This is the legacy version of the pipeline that uses the `Stack` class, for plug and play compatibility with existing CDK projects that can not
use the `ExpressStack` class. For new projects, use the `CdkExpressPipeline` class.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.CdkExpressPipelineLegacy.Initializer"></a>

```typescript
import { CdkExpressPipelineLegacy } from 'cdk-express-pipeline'

new CdkExpressPipelineLegacy(waves?: IExpressWaveLegacy[])
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineLegacy.Initializer.parameter.waves">waves</a></code> | <code><a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]</code> | *No description.* |

---

##### `waves`<sup>Optional</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipelineLegacy.Initializer.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineLegacy.addWave">addWave</a></code> | Add a wave to the pipeline. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineLegacy.generateMermaidDiagram">generateMermaidDiagram</a></code> | Generate a Mermaid diagram showing the deployment order. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineLegacy.printWaves">printWaves</a></code> | Print the order of deployment to the console. |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineLegacy.synth">synth</a></code> | Synthesize the pipeline which creates the dependencies between the stacks in the correct order. |

---

##### `addWave` <a name="addWave" id="cdk-express-pipeline.CdkExpressPipelineLegacy.addWave"></a>

```typescript
public addWave(id: string, sequentialStages?: boolean): ExpressWaveLegacy
```

Add a wave to the pipeline.

###### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.CdkExpressPipelineLegacy.addWave.parameter.id"></a>

- *Type:* string

The wave identifier.

---

###### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.CdkExpressPipelineLegacy.addWave.parameter.sequentialStages"></a>

- *Type:* boolean

If true, the stages in the wave will be executed sequentially.

Default: false.

---

##### `generateMermaidDiagram` <a name="generateMermaidDiagram" id="cdk-express-pipeline.CdkExpressPipelineLegacy.generateMermaidDiagram"></a>

```typescript
public generateMermaidDiagram(waves: IExpressWaveLegacy[]): string
```

Generate a Mermaid diagram showing the deployment order.

###### `waves`<sup>Required</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipelineLegacy.generateMermaidDiagram.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]

The waves to include in the diagram.

---

##### `printWaves` <a name="printWaves" id="cdk-express-pipeline.CdkExpressPipelineLegacy.printWaves"></a>

```typescript
public printWaves(waves: IExpressWaveLegacy[]): void
```

Print the order of deployment to the console.

###### `waves`<sup>Required</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipelineLegacy.printWaves.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]

---

##### `synth` <a name="synth" id="cdk-express-pipeline.CdkExpressPipelineLegacy.synth"></a>

```typescript
public synth(waves?: IExpressWaveLegacy[], print?: boolean, saveMermaidDiagram?: MermaidDiagramOutput): void
```

Synthesize the pipeline which creates the dependencies between the stacks in the correct order.

###### `waves`<sup>Optional</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipelineLegacy.synth.parameter.waves"></a>

- *Type:* <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]

The waves to synthesize.

---

###### `print`<sup>Optional</sup> <a name="print" id="cdk-express-pipeline.CdkExpressPipelineLegacy.synth.parameter.print"></a>

- *Type:* boolean

Whether to print the order of deployment to the console.

---

###### `saveMermaidDiagram`<sup>Optional</sup> <a name="saveMermaidDiagram" id="cdk-express-pipeline.CdkExpressPipelineLegacy.synth.parameter.saveMermaidDiagram"></a>

- *Type:* <a href="#cdk-express-pipeline.MermaidDiagramOutput">MermaidDiagramOutput</a>

If provided, saves a Mermaid diagram of the deployment order to the specified path.

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.CdkExpressPipelineLegacy.property.waves">waves</a></code> | <code><a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]</code> | *No description.* |

---

##### `waves`<sup>Required</sup> <a name="waves" id="cdk-express-pipeline.CdkExpressPipelineLegacy.property.waves"></a>

```typescript
public readonly waves: IExpressWaveLegacy[];
```

- *Type:* <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>[]

---


### ExpressStage <a name="ExpressStage" id="cdk-express-pipeline.ExpressStage"></a>

- *Implements:* <a href="#cdk-express-pipeline.IExpressStage">IExpressStage</a>

A CDK Express Pipeline Stage that belongs to an ExpressWave.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.ExpressStage.Initializer"></a>

```typescript
import { ExpressStage } from 'cdk-express-pipeline'

new ExpressStage(id: string, wave: ExpressWave, stacks?: ExpressStack[])
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStage.Initializer.parameter.id">id</a></code> | <code>string</code> | The stage identifier. |
| <code><a href="#cdk-express-pipeline.ExpressStage.Initializer.parameter.wave">wave</a></code> | <code><a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a></code> | The wave that the stage belongs to. |
| <code><a href="#cdk-express-pipeline.ExpressStage.Initializer.parameter.stacks">stacks</a></code> | <code><a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>[]</code> | The ExpressStacks in the stage. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressStage.Initializer.parameter.id"></a>

- *Type:* string

The stage identifier.

---

##### `wave`<sup>Required</sup> <a name="wave" id="cdk-express-pipeline.ExpressStage.Initializer.parameter.wave"></a>

- *Type:* <a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a>

The wave that the stage belongs to.

---

##### `stacks`<sup>Optional</sup> <a name="stacks" id="cdk-express-pipeline.ExpressStage.Initializer.parameter.stacks"></a>

- *Type:* <a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>[]

The ExpressStacks in the stage.

---



#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStage.property.id">id</a></code> | <code>string</code> | The stage identifier. |
| <code><a href="#cdk-express-pipeline.ExpressStage.property.stacks">stacks</a></code> | <code><a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>[]</code> | The stacks in the stage. |
| <code><a href="#cdk-express-pipeline.ExpressStage.property.wave">wave</a></code> | <code><a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a></code> | The wave that the stage belongs to. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressStage.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The stage identifier.

---

##### `stacks`<sup>Required</sup> <a name="stacks" id="cdk-express-pipeline.ExpressStage.property.stacks"></a>

```typescript
public readonly stacks: ExpressStack[];
```

- *Type:* <a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>[]

The stacks in the stage.

---

##### `wave`<sup>Required</sup> <a name="wave" id="cdk-express-pipeline.ExpressStage.property.wave"></a>

```typescript
public readonly wave: ExpressWave;
```

- *Type:* <a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a>

The wave that the stage belongs to.

---


### ExpressStageLegacy <a name="ExpressStageLegacy" id="cdk-express-pipeline.ExpressStageLegacy"></a>

- *Implements:* <a href="#cdk-express-pipeline.IExpressStageLegacy">IExpressStageLegacy</a>

A stage that holds stacks.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.ExpressStageLegacy.Initializer"></a>

```typescript
import { ExpressStageLegacy } from 'cdk-express-pipeline'

new ExpressStageLegacy(id: string, stacks?: Stack[])
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStageLegacy.Initializer.parameter.id">id</a></code> | <code>string</code> | The stage identifier. |
| <code><a href="#cdk-express-pipeline.ExpressStageLegacy.Initializer.parameter.stacks">stacks</a></code> | <code>aws-cdk-lib.Stack[]</code> | The stacks in the stage. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressStageLegacy.Initializer.parameter.id"></a>

- *Type:* string

The stage identifier.

---

##### `stacks`<sup>Optional</sup> <a name="stacks" id="cdk-express-pipeline.ExpressStageLegacy.Initializer.parameter.stacks"></a>

- *Type:* aws-cdk-lib.Stack[]

The stacks in the stage.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStageLegacy.addStack">addStack</a></code> | Add a stack to the stage. |

---

##### `addStack` <a name="addStack" id="cdk-express-pipeline.ExpressStageLegacy.addStack"></a>

```typescript
public addStack(stack: Stack): Stack
```

Add a stack to the stage.

###### `stack`<sup>Required</sup> <a name="stack" id="cdk-express-pipeline.ExpressStageLegacy.addStack.parameter.stack"></a>

- *Type:* aws-cdk-lib.Stack

The stack to add.

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressStageLegacy.property.id">id</a></code> | <code>string</code> | The stage identifier. |
| <code><a href="#cdk-express-pipeline.ExpressStageLegacy.property.stacks">stacks</a></code> | <code>aws-cdk-lib.Stack[]</code> | The stacks in the stage. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressStageLegacy.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The stage identifier.

---

##### `stacks`<sup>Required</sup> <a name="stacks" id="cdk-express-pipeline.ExpressStageLegacy.property.stacks"></a>

```typescript
public readonly stacks: Stack[];
```

- *Type:* aws-cdk-lib.Stack[]

The stacks in the stage.

---


### ExpressWave <a name="ExpressWave" id="cdk-express-pipeline.ExpressWave"></a>

- *Implements:* <a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>

A CDK Express Pipeline Wave that contains ExpressStages.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.ExpressWave.Initializer"></a>

```typescript
import { ExpressWave } from 'cdk-express-pipeline'

new ExpressWave(id: string, separator?: string, sequentialStages?: boolean)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWave.Initializer.parameter.id">id</a></code> | <code>string</code> | The wave identifier. |
| <code><a href="#cdk-express-pipeline.ExpressWave.Initializer.parameter.separator">separator</a></code> | <code>string</code> | Separator between the wave, stage and stack ids that are concatenated to form the stack id. |
| <code><a href="#cdk-express-pipeline.ExpressWave.Initializer.parameter.sequentialStages">sequentialStages</a></code> | <code>boolean</code> | If true, the stages in the wave will be executed sequentially. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWave.Initializer.parameter.id"></a>

- *Type:* string

The wave identifier.

---

##### `separator`<sup>Optional</sup> <a name="separator" id="cdk-express-pipeline.ExpressWave.Initializer.parameter.separator"></a>

- *Type:* string

Separator between the wave, stage and stack ids that are concatenated to form the stack id.

Default: '_'.

---

##### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.ExpressWave.Initializer.parameter.sequentialStages"></a>

- *Type:* boolean

If true, the stages in the wave will be executed sequentially.

Default: false.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWave.addStage">addStage</a></code> | Add an ExpressStage to the wave. |

---

##### `addStage` <a name="addStage" id="cdk-express-pipeline.ExpressWave.addStage"></a>

```typescript
public addStage(id: string): ExpressStage
```

Add an ExpressStage to the wave.

###### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWave.addStage.parameter.id"></a>

- *Type:* string

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWave.property.id">id</a></code> | <code>string</code> | The wave identifier. |
| <code><a href="#cdk-express-pipeline.ExpressWave.property.separator">separator</a></code> | <code>string</code> | Separator between the wave, stage and stack ids that are concatenated to form the final stack id. |
| <code><a href="#cdk-express-pipeline.ExpressWave.property.stages">stages</a></code> | <code><a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>[]</code> | The ExpressStages in the wave. |
| <code><a href="#cdk-express-pipeline.ExpressWave.property.sequentialStages">sequentialStages</a></code> | <code>boolean</code> | If true, the stages in the wave will be executed sequentially. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWave.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The wave identifier.

---

##### `separator`<sup>Required</sup> <a name="separator" id="cdk-express-pipeline.ExpressWave.property.separator"></a>

```typescript
public readonly separator: string;
```

- *Type:* string

Separator between the wave, stage and stack ids that are concatenated to form the final stack id.

---

##### `stages`<sup>Required</sup> <a name="stages" id="cdk-express-pipeline.ExpressWave.property.stages"></a>

```typescript
public readonly stages: ExpressStage[];
```

- *Type:* <a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>[]

The ExpressStages in the wave.

---

##### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.ExpressWave.property.sequentialStages"></a>

```typescript
public readonly sequentialStages: boolean;
```

- *Type:* boolean

If true, the stages in the wave will be executed sequentially.

---


### ExpressWaveLegacy <a name="ExpressWaveLegacy" id="cdk-express-pipeline.ExpressWaveLegacy"></a>

- *Implements:* <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>

A CDK Express Pipeline Legacy Wave that contains Legacy Stages.

#### Initializers <a name="Initializers" id="cdk-express-pipeline.ExpressWaveLegacy.Initializer"></a>

```typescript
import { ExpressWaveLegacy } from 'cdk-express-pipeline'

new ExpressWaveLegacy(id: string, sequentialStages?: boolean)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWaveLegacy.Initializer.parameter.id">id</a></code> | <code>string</code> | The wave identifier. |
| <code><a href="#cdk-express-pipeline.ExpressWaveLegacy.Initializer.parameter.sequentialStages">sequentialStages</a></code> | <code>boolean</code> | If true, the stages in the wave will be executed sequentially. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWaveLegacy.Initializer.parameter.id"></a>

- *Type:* string

The wave identifier.

---

##### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.ExpressWaveLegacy.Initializer.parameter.sequentialStages"></a>

- *Type:* boolean

If true, the stages in the wave will be executed sequentially.

Default: false.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWaveLegacy.addStage">addStage</a></code> | Add a stage to the wave. |

---

##### `addStage` <a name="addStage" id="cdk-express-pipeline.ExpressWaveLegacy.addStage"></a>

```typescript
public addStage(id: string): ExpressStageLegacy
```

Add a stage to the wave.

###### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWaveLegacy.addStage.parameter.id"></a>

- *Type:* string

The stage identifier.

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.ExpressWaveLegacy.property.id">id</a></code> | <code>string</code> | The wave identifier. |
| <code><a href="#cdk-express-pipeline.ExpressWaveLegacy.property.stages">stages</a></code> | <code><a href="#cdk-express-pipeline.IExpressStageLegacy">IExpressStageLegacy</a>[]</code> | The ExpressStages in the wave. |
| <code><a href="#cdk-express-pipeline.ExpressWaveLegacy.property.sequentialStages">sequentialStages</a></code> | <code>boolean</code> | If true, the stages in the wave will be executed sequentially. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.ExpressWaveLegacy.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The wave identifier.

---

##### `stages`<sup>Required</sup> <a name="stages" id="cdk-express-pipeline.ExpressWaveLegacy.property.stages"></a>

```typescript
public readonly stages: IExpressStageLegacy[];
```

- *Type:* <a href="#cdk-express-pipeline.IExpressStageLegacy">IExpressStageLegacy</a>[]

The ExpressStages in the wave.

---

##### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.ExpressWaveLegacy.property.sequentialStages"></a>

```typescript
public readonly sequentialStages: boolean;
```

- *Type:* boolean

If true, the stages in the wave will be executed sequentially.

---


### GithubWorkflow <a name="GithubWorkflow" id="cdk-express-pipeline.GithubWorkflow"></a>

#### Initializers <a name="Initializers" id="cdk-express-pipeline.GithubWorkflow.Initializer"></a>

```typescript
import { GithubWorkflow } from 'cdk-express-pipeline'

new GithubWorkflow(json: object)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.GithubWorkflow.Initializer.parameter.json">json</a></code> | <code>object</code> | *No description.* |

---

##### `json`<sup>Required</sup> <a name="json" id="cdk-express-pipeline.GithubWorkflow.Initializer.parameter.json"></a>

- *Type:* object

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.GithubWorkflow.patch">patch</a></code> | Applies a set of JSON-Patch (RFC-6902) operations to this object and returns the result. |

---

##### `patch` <a name="patch" id="cdk-express-pipeline.GithubWorkflow.patch"></a>

```typescript
public patch(ops: ...Patch[]): GithubWorkflow
```

Applies a set of JSON-Patch (RFC-6902) operations to this object and returns the result.

###### `ops`<sup>Required</sup> <a name="ops" id="cdk-express-pipeline.GithubWorkflow.patch.parameter.ops"></a>

- *Type:* ...<a href="#cdk-express-pipeline.Patch">Patch</a>[]

The operations to apply.

---


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.GithubWorkflow.property.json">json</a></code> | <code>object</code> | *No description.* |

---

##### `json`<sup>Required</sup> <a name="json" id="cdk-express-pipeline.GithubWorkflow.property.json"></a>

```typescript
public readonly json: object;
```

- *Type:* object

---


### JsonPatch <a name="JsonPatch" id="cdk-express-pipeline.JsonPatch"></a>

Utility for applying RFC-6902 JSON-Patch to a document.

Use the the `JsonPatch.apply(doc, ...ops)` function to apply a set of
operations to a JSON document and return the result.

Operations can be created using the factory methods `JsonPatch.add()`,
`JsonPatch.remove()`, etc.

const output = JsonPatch.apply(input,
  JsonPatch.replace('/world/hi/there', 'goodbye'),
  JsonPatch.add('/world/foo/', 'boom'),
  JsonPatch.remove('/hello'),
);

#### Initializers <a name="Initializers" id="cdk-express-pipeline.JsonPatch.Initializer"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

new JsonPatch()
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.JsonPatch.patch">patch</a></code> | Applies a set of JSON-Patch (RFC-6902) operations to `document` and returns the result. |

---

##### `patch` <a name="patch" id="cdk-express-pipeline.JsonPatch.patch"></a>

```typescript
public patch(document: any, ops: ...Patch[]): any
```

Applies a set of JSON-Patch (RFC-6902) operations to `document` and returns the result.

###### `document`<sup>Required</sup> <a name="document" id="cdk-express-pipeline.JsonPatch.patch.parameter.document"></a>

- *Type:* any

The document to patch.

---

###### `ops`<sup>Required</sup> <a name="ops" id="cdk-express-pipeline.JsonPatch.patch.parameter.ops"></a>

- *Type:* ...<a href="#cdk-express-pipeline.Patch">Patch</a>[]

The operations to apply.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.JsonPatch.add">add</a></code> | Adds a value to an object or inserts it into an array. |
| <code><a href="#cdk-express-pipeline.JsonPatch.copy">copy</a></code> | Copies a value from one location to another within the JSON document. |
| <code><a href="#cdk-express-pipeline.JsonPatch.move">move</a></code> | Moves a value from one location to the other. |
| <code><a href="#cdk-express-pipeline.JsonPatch.remove">remove</a></code> | Removes a value from an object or array. |
| <code><a href="#cdk-express-pipeline.JsonPatch.replace">replace</a></code> | Replaces a value. |
| <code><a href="#cdk-express-pipeline.JsonPatch.test">test</a></code> | Tests that the specified value is set in the document. |

---

##### `add` <a name="add" id="cdk-express-pipeline.JsonPatch.add"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

JsonPatch.add(path: string, value: any)
```

Adds a value to an object or inserts it into an array.

In the case of an
array, the value is inserted before the given index. The - character can be
used instead of an index to insert at the end of an array.

*Example*

```typescript
JsonPatch.add('/biscuits/1', { "name": "Ginger Nut" })
```


###### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.JsonPatch.add.parameter.path"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="cdk-express-pipeline.JsonPatch.add.parameter.value"></a>

- *Type:* any

---

##### `copy` <a name="copy" id="cdk-express-pipeline.JsonPatch.copy"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

JsonPatch.copy(from: string, path: string)
```

Copies a value from one location to another within the JSON document.

Both
from and path are JSON Pointers.

*Example*

```typescript
JsonPatch.copy('/biscuits/0', '/best_biscuit')
```


###### `from`<sup>Required</sup> <a name="from" id="cdk-express-pipeline.JsonPatch.copy.parameter.from"></a>

- *Type:* string

---

###### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.JsonPatch.copy.parameter.path"></a>

- *Type:* string

---

##### `move` <a name="move" id="cdk-express-pipeline.JsonPatch.move"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

JsonPatch.move(from: string, path: string)
```

Moves a value from one location to the other.

Both from and path are JSON Pointers.

*Example*

```typescript
JsonPatch.move('/biscuits', '/cookies')
```


###### `from`<sup>Required</sup> <a name="from" id="cdk-express-pipeline.JsonPatch.move.parameter.from"></a>

- *Type:* string

---

###### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.JsonPatch.move.parameter.path"></a>

- *Type:* string

---

##### `remove` <a name="remove" id="cdk-express-pipeline.JsonPatch.remove"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

JsonPatch.remove(path: string)
```

Removes a value from an object or array.

*Example*

```typescript
JsonPatch.remove('/biscuits/0')
```


###### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.JsonPatch.remove.parameter.path"></a>

- *Type:* string

---

##### `replace` <a name="replace" id="cdk-express-pipeline.JsonPatch.replace"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

JsonPatch.replace(path: string, value: any)
```

Replaces a value.

Equivalent to a “remove” followed by an “add”.

*Example*

```typescript
JsonPatch.replace('/biscuits/0/name', 'Chocolate Digestive')
```


###### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.JsonPatch.replace.parameter.path"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="cdk-express-pipeline.JsonPatch.replace.parameter.value"></a>

- *Type:* any

---

##### `test` <a name="test" id="cdk-express-pipeline.JsonPatch.test"></a>

```typescript
import { JsonPatch } from 'cdk-express-pipeline'

JsonPatch.test(path: string, value: any)
```

Tests that the specified value is set in the document.

If the test fails,
then the patch as a whole should not apply.

*Example*

```typescript
JsonPatch.test('/best_biscuit/name', 'Choco Leibniz')
```


###### `path`<sup>Required</sup> <a name="path" id="cdk-express-pipeline.JsonPatch.test.parameter.path"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="cdk-express-pipeline.JsonPatch.test.parameter.value"></a>

- *Type:* any

---



## Protocols <a name="Protocols" id="Protocols"></a>

### IExpressStack <a name="IExpressStack" id="cdk-express-pipeline.IExpressStack"></a>

- *Implemented By:* <a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>, <a href="#cdk-express-pipeline.IExpressStack">IExpressStack</a>

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressStack.addExpressDependency">addExpressDependency</a></code> | Add a dependency between this stack and another ExpressStack. |
| <code><a href="#cdk-express-pipeline.IExpressStack.expressDependencies">expressDependencies</a></code> | The ExpressStack dependencies of the stack. |

---

##### `addExpressDependency` <a name="addExpressDependency" id="cdk-express-pipeline.IExpressStack.addExpressDependency"></a>

```typescript
public addExpressDependency(target: ExpressStack, reason?: string): void
```

Add a dependency between this stack and another ExpressStack.

This can be used to define dependencies between any two stacks within an

###### `target`<sup>Required</sup> <a name="target" id="cdk-express-pipeline.IExpressStack.addExpressDependency.parameter.target"></a>

- *Type:* <a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>

The `ExpressStack` to depend on.

---

###### `reason`<sup>Optional</sup> <a name="reason" id="cdk-express-pipeline.IExpressStack.addExpressDependency.parameter.reason"></a>

- *Type:* string

The reason for the dependency.

---

##### `expressDependencies` <a name="expressDependencies" id="cdk-express-pipeline.IExpressStack.expressDependencies"></a>

```typescript
public expressDependencies(): ExpressStack[]
```

The ExpressStack dependencies of the stack.

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressStack.property.id">id</a></code> | <code>string</code> | The stack identifier which is a combination of the wave, stage and stack id. |
| <code><a href="#cdk-express-pipeline.IExpressStack.property.stage">stage</a></code> | <code><a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a></code> | The stage that the stack belongs to. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.IExpressStack.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The stack identifier which is a combination of the wave, stage and stack id.

---

##### `stage`<sup>Required</sup> <a name="stage" id="cdk-express-pipeline.IExpressStack.property.stage"></a>

```typescript
public readonly stage: ExpressStage;
```

- *Type:* <a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>

The stage that the stack belongs to.

---

### IExpressStage <a name="IExpressStage" id="cdk-express-pipeline.IExpressStage"></a>

- *Implemented By:* <a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>, <a href="#cdk-express-pipeline.IExpressStage">IExpressStage</a>


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressStage.property.id">id</a></code> | <code>string</code> | The stage identifier. |
| <code><a href="#cdk-express-pipeline.IExpressStage.property.stacks">stacks</a></code> | <code><a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>[]</code> | The stacks in the stage. |
| <code><a href="#cdk-express-pipeline.IExpressStage.property.wave">wave</a></code> | <code><a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a></code> | The wave that the stage belongs to. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.IExpressStage.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The stage identifier.

---

##### `stacks`<sup>Required</sup> <a name="stacks" id="cdk-express-pipeline.IExpressStage.property.stacks"></a>

```typescript
public readonly stacks: ExpressStack[];
```

- *Type:* <a href="#cdk-express-pipeline.ExpressStack">ExpressStack</a>[]

The stacks in the stage.

---

##### `wave`<sup>Required</sup> <a name="wave" id="cdk-express-pipeline.IExpressStage.property.wave"></a>

```typescript
public readonly wave: ExpressWave;
```

- *Type:* <a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a>

The wave that the stage belongs to.

---

### IExpressStageLegacy <a name="IExpressStageLegacy" id="cdk-express-pipeline.IExpressStageLegacy"></a>

- *Implemented By:* <a href="#cdk-express-pipeline.ExpressStageLegacy">ExpressStageLegacy</a>, <a href="#cdk-express-pipeline.IExpressStageLegacy">IExpressStageLegacy</a>


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressStageLegacy.property.id">id</a></code> | <code>string</code> | The stage identifier. |
| <code><a href="#cdk-express-pipeline.IExpressStageLegacy.property.stacks">stacks</a></code> | <code>aws-cdk-lib.Stack[]</code> | The stacks in the stage. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.IExpressStageLegacy.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The stage identifier.

---

##### `stacks`<sup>Required</sup> <a name="stacks" id="cdk-express-pipeline.IExpressStageLegacy.property.stacks"></a>

```typescript
public readonly stacks: Stack[];
```

- *Type:* aws-cdk-lib.Stack[]

The stacks in the stage.

---

### IExpressWave <a name="IExpressWave" id="cdk-express-pipeline.IExpressWave"></a>

- *Implemented By:* <a href="#cdk-express-pipeline.ExpressWave">ExpressWave</a>, <a href="#cdk-express-pipeline.IExpressWave">IExpressWave</a>

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressWave.addStage">addStage</a></code> | Add an ExpressStage to the wave. |

---

##### `addStage` <a name="addStage" id="cdk-express-pipeline.IExpressWave.addStage"></a>

```typescript
public addStage(id: string): ExpressStage
```

Add an ExpressStage to the wave.

###### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.IExpressWave.addStage.parameter.id"></a>

- *Type:* string

The ExpressStage identifier.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressWave.property.id">id</a></code> | <code>string</code> | The wave identifier. |
| <code><a href="#cdk-express-pipeline.IExpressWave.property.separator">separator</a></code> | <code>string</code> | Separator between the wave, stage and stack ids that are concatenated to form the final stack id. |
| <code><a href="#cdk-express-pipeline.IExpressWave.property.stages">stages</a></code> | <code><a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>[]</code> | The ExpressStages in the wave. |
| <code><a href="#cdk-express-pipeline.IExpressWave.property.sequentialStages">sequentialStages</a></code> | <code>boolean</code> | If true, the stages in the wave will be executed sequentially. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.IExpressWave.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The wave identifier.

---

##### `separator`<sup>Required</sup> <a name="separator" id="cdk-express-pipeline.IExpressWave.property.separator"></a>

```typescript
public readonly separator: string;
```

- *Type:* string

Separator between the wave, stage and stack ids that are concatenated to form the final stack id.

---

##### `stages`<sup>Required</sup> <a name="stages" id="cdk-express-pipeline.IExpressWave.property.stages"></a>

```typescript
public readonly stages: ExpressStage[];
```

- *Type:* <a href="#cdk-express-pipeline.ExpressStage">ExpressStage</a>[]

The ExpressStages in the wave.

---

##### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.IExpressWave.property.sequentialStages"></a>

```typescript
public readonly sequentialStages: boolean;
```

- *Type:* boolean
- *Default:* false

If true, the stages in the wave will be executed sequentially.

---

### IExpressWaveLegacy <a name="IExpressWaveLegacy" id="cdk-express-pipeline.IExpressWaveLegacy"></a>

- *Implemented By:* <a href="#cdk-express-pipeline.ExpressWaveLegacy">ExpressWaveLegacy</a>, <a href="#cdk-express-pipeline.IExpressWaveLegacy">IExpressWaveLegacy</a>


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-express-pipeline.IExpressWaveLegacy.property.id">id</a></code> | <code>string</code> | The wave identifier. |
| <code><a href="#cdk-express-pipeline.IExpressWaveLegacy.property.stages">stages</a></code> | <code><a href="#cdk-express-pipeline.IExpressStageLegacy">IExpressStageLegacy</a>[]</code> | The ExpressStages in the wave. |
| <code><a href="#cdk-express-pipeline.IExpressWaveLegacy.property.sequentialStages">sequentialStages</a></code> | <code>boolean</code> | If true, the stages in the wave will be executed sequentially. |

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-express-pipeline.IExpressWaveLegacy.property.id"></a>

```typescript
public readonly id: string;
```

- *Type:* string

The wave identifier.

---

##### `stages`<sup>Required</sup> <a name="stages" id="cdk-express-pipeline.IExpressWaveLegacy.property.stages"></a>

```typescript
public readonly stages: IExpressStageLegacy[];
```

- *Type:* <a href="#cdk-express-pipeline.IExpressStageLegacy">IExpressStageLegacy</a>[]

The ExpressStages in the wave.

---

##### `sequentialStages`<sup>Optional</sup> <a name="sequentialStages" id="cdk-express-pipeline.IExpressWaveLegacy.property.sequentialStages"></a>

```typescript
public readonly sequentialStages: boolean;
```

- *Type:* boolean
- *Default:* false

If true, the stages in the wave will be executed sequentially.

---

