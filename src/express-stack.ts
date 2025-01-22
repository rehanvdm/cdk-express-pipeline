import { Names, Stack } from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib/core/lib/stack';
import { Construct } from 'constructs';
import { CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON } from './cdk-express-pipeline';
import { ExpressStage } from './express-stage';

export interface IExpressStack {
  /**
   * The stack identifier which is a combination of the wave, stage and stack id
   * */
  id: string;

  /**
   * The stage that the stack belongs to
   */
  stage: ExpressStage;

  /**
   * The ExpressStack dependencies of the stack.
   */
  expressDependencies(): ExpressStack[];

  /**
   * Add a dependency between this stack and another ExpressStack.
   *
   * This can be used to define dependencies between any two stacks within an
   * @param target The `ExpressStack` to depend on
   * @param reason The reason for the dependency
   */
  addExpressDependency(target: ExpressStack, reason?: string): void;
}

/**
 * A CDK Express Pipeline Stack that belongs to an ExpressStage
 */
export class ExpressStack extends Stack implements IExpressStack {
  public id: string;
  public stage: ExpressStage;
  private expressStackDependencies: ExpressStack[] = [];

  /**
   * Constructs a new instance of the ExpressStack class
   * @param scope The parent of this stack, usually an `App` but could be any construct.
   * @param id The stack identifier which will be used to construct the final id as a combination of the wave, stage and stack id.
   * @param stage The stage that the stack belongs to.
   * @param stackProps Stack properties.
   */
  constructor(scope: Construct, id: string, stage: ExpressStage, stackProps?: StackProps) {

    let stackId: string;

    // Create a composite key to address waves, stages and stacks
    if (id.includes(stage.wave.separator)) {
      throw new Error(`ExpressStack '${id}' cannot contain a '${stage.wave.separator}' (separator)`);
    }
    stackId = [stage.wave.id, stage.id, id].join(stage.wave.separator);

    // Use the id as the stack name if the stack name is not provided
    stackProps = !stackProps?.stackName ? {
      ...stackProps,
      stackName: id,
    } : { ...stackProps };

    super(scope, stackId, stackProps);

    this.id = stackId;
    this.stage = stage;
    this.stage.stacks.push(this);
  }

  /**
   * Use `addDependency` for dependencies between stacks in an ExpressStage. Otherwise, use `addExpressDependency`
   * to construct the Pipeline of stacks between Waves and Stages.
   * @param target
   * @param reason
   */
  addDependency(target: Stack, reason?: string) {
    super.addDependency(target, reason);
  }

  expressDependencies(): ExpressStack[] {
    return this.expressStackDependencies;
  }


  /**
   * Only use to create dependencies between Stacks in Waves and Stages for building the Pipeline, where having
   * cyclic dependencies is not possible. If the `addExpressDependency` is used outside the Pipeline construction,
   * it will not be safe. Use `addDependency` to create stack dependency within the same Stage.
   * @param target
   * @param reason
   */
  addExpressDependency(target: ExpressStack, reason?: string) {
    if (reason != CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON && target.stage !== this.stage) {
      throw new Error('Incorrect Stack Dependency. ' +
        `Stack ${this.id} in [${this.stage.wave.id} & ${this.stage.id}] can not depend on ` +
        `${target.id} in Stage [${target.stage.wave.id} & ${target.stage.id}]. ` +
        'Stacks can only depend on other stacks within the same [Wave & Stage].');
    }
    this.expressStackDependencies.push(target);

    /* Similar to `super.addDependency(target, reason);` but it does not do the recursive call to check for cyclic dependencies
    * The recursion and cyclic dependency can be seen within the CDK Stack private function `stackDependencyReasons`:
    * - https://github.com/aws/aws-cdk/blob/d3672674b598266b5521d7af2a1e77822fc4a74e/packages/aws-cdk-lib/core/lib/stack.ts#L942
    *
    * This is only safe as we know this function is only called to construct the dependency tree for the Pipeline which will not
    * have cyclic dependencies. If the `addExpressDependency` is used outside of the Pipeline construction, it will not be safe.
    * */
    (this as any)._stackDependencies[Names.uniqueId(target)] = {
      stack: target,
      reasons: [
        {
          source: this,
          target: target,
          reason: reason,
        },
      ],
    };
  }


}

