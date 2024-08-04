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


/**
 * A CDK Express Pipeline Stage that belongs to an ExpressWave
 */
export class ExpressStage implements IExpressStage {
  public id: string;
  public wave: ExpressWave;
  public stacks: ExpressStack[] = [];

  /**
   * Constructs a new instance of the ExpressStage class
   * @param id The stage identifier
   * @param wave The wave that the stage belongs to
   * @param stacks The ExpressStacks in the stage
   */
  constructor(id: string, wave: ExpressWave, stacks: ExpressStack[] = []) {
    this.id = id;
    this.wave = wave;
    this.wave.stages.push(this);
    this.stacks = stacks;
    if (this.id.includes(this.wave.separator)) {
      throw new Error(`ExpressStage '${id}' cannot contain a '${this.wave.separator} ' (separator)`);
    }
  }
}