import { ExpressStack } from './express-stack';
import { ExpressWave } from './express-wave';

export interface IExpressStage {
  /**
   * The stage identifier
   */
  id: string;

  /**
   * The wave that the stage belongs to
   */
  wave: ExpressWave;

  /**
   * The stacks in the stage
   */
  stacks: ExpressStack[];

}

export interface ExpressStageProps {
  /**
   * The stage identifier
   */
  readonly id: string;

  /**
   * The wave that the stage belongs to
   */
  readonly wave: ExpressWave;

  /**
   * The ExpressStacks in the stage
   */
  readonly stacks?: ExpressStack[];
}


/**
 * A CDK Express Pipeline Stage that belongs to an ExpressWave
 */
export class ExpressStage implements IExpressStage {
  public id: string;
  public wave: ExpressWave;
  public stacks: ExpressStack[] = [];

  constructor(props: ExpressStageProps) {
    this.id = props.id;
    this.wave = props.wave;
    this.wave.stages.push(this);
    this.stacks = props.stacks || [];
    if (this.id.includes(this.wave.separator)) {
      throw new Error(`ExpressStage '${props.id}' cannot contain a '${this.wave.separator} ' (separator)`);
    }
  }
}