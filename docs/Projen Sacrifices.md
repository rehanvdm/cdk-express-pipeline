# Projen Sacrifices

## Index signatures and union types

The initial `DeploymentOrder` was defined as:

```typescript
export interface DeploymentOrder {
  [wave: string]: {
    [stage: string]: Stack[] | ExpressStack[];
  };
}
```

But JSII can not do indexed signatures. Union types should work but
are [discouraged](https://aws.github.io/jsii/specification/2-type-system/#type-unions) in JSII.

## No generics

The idea would have been to make underlying stack generic so that you can bring your own stack class, good for legacy
projects. But JSII does not support generics.

```typescript
<T extends IExpressStage> 
```

## CDK Stack does not have an interface

The `.addDependency` function can not be overloaded with `IExpressStack` because it does not have all the properties of
`Stack` that are required.

So we can't do this:

```typescript
export class ExpressStack extends Stack implements IExpressStack {
  addDependency(target: IExpressStack, reason ?: string)
}
```

And have to do this
So we can't do this:

```typescript
export class ExpressStack extends Stack implements IExpressStack {
  addDependency(target: ExpressStack, reason ?: string)
}
```

With that in mind, we can't pass interfaces to all our functions and classes. To align the whole project with this,
all classes will be passed as concrete classes.
