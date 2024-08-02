import { Stack } from 'aws-cdk-lib';
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

export interface ExpressStackProps {
  /**
   * The parent of this stack, usually an `App` but could be any construct.
   */
  readonly scope: Construct;

  /**
   * The stack identifier which will be used to construct the final id as a combination of the wave, stage and stack id.
   */
  readonly id: string;

  /**
   * The stage that the stack belongs to.
   */
  readonly stage: ExpressStage;

  /**
   * Stack properties
   */
  readonly stackProps?: StackProps;
}

export interface ExpressStackPropsOmitStage {
  /**
   * The parent of this stack, usually an `App` but could be any construct.
   */
  readonly scope: Construct;

  /**
   * The stack identifier which will be used to construct the final id as a combination of the wave, stage and stack id.
   */
  readonly id: string;

  /**
   * The stage that the stack belongs to.
   */
  readonly stackProps?: StackProps;
}


/**
 * A CDK Express Pipeline Stack that belongs to an ExpressStage
 */
export class ExpressStack extends Stack implements IExpressStack {
  public id: string;
  public stage: ExpressStage;
  private expressStackDependencies: ExpressStack[] = [];

  constructor(props: ExpressStackProps) {

    let stackId: string;
    let stackProps: StackProps | undefined;

    // Create a composite key to address waves, stages and stacks
    if (props.id.includes(props.stage.wave.separator)) {
      throw new Error(`ExpressStack '${props.id}' cannot contain a '${props.stage.wave.separator}' (separator)`);
    }
    stackId = [props.stage.wave.id, props.stage.id, props.id].join(props.stage.wave.separator);

    // Use the id as the stack name if the stack name is not provided
    stackProps = !props.stackProps?.stackName ? {
      ...props.stackProps,
      stackName: props.id,
    } : { ...props.stackProps };

    super(props.scope, stackId, stackProps);

    this.id = stackId;
    this.stage = props.stage;
    this.stage.stacks.push(this);
  }


  /**
   * @deprecated Use `expressDependencies()` instead of `dependencies` to get the dependencies of an `ExpressStack`.
   */
  get dependencies(): Stack[] {
    throw new Error('Use `expressDependencies()` instead of `dependencies` to get the dependencies of an `ExpressStack`.');
    return super.dependencies; //Redundant but specify to make TS & ESLint happy
  }


  /**
   * @deprecated Use `addExpressDependency` instead of `addDependency` to add to an `ExpressStack` dependency.
   * @param target
   * @param reason
   */
  addDependency(target: Stack, reason?: string) {
    throw new Error('Use `addExpressDependency` instead of `addDependency` to add to an `ExpressStack` dependency.');
    super.addDependency(target, reason); //Redundant but specify to make TS & ESLint happy
  }

  expressDependencies(): ExpressStack[] {
    return this.expressStackDependencies;
  }

  addExpressDependency(target: ExpressStack, reason?: string) {
    if (reason != CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON && target.stage !== this.stage) {
      throw new Error('Incorrect Stack Dependency. ' +
        `Stack ${this.id} in [${this.stage.wave.id} & ${this.stage.id}] can not depend on ` +
        `${target.id} in Stage [${target.stage.wave.id} & ${target.stage.id}]. ` +
        'Stacks can only depend on other stacks within the same [Wave & Stage].');
    }
    this.expressStackDependencies.push(target);
    super.addDependency(target, reason);
  }
}

