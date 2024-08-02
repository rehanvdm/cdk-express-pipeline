import { CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR } from './cdk-express-pipeline';
import { ExpressStage } from './express-stage';

export interface IExpressWave {
  /**
   * The wave identifier
   */
  id: string;

  /**
   * Separator between the wave, stage and stack ids that are concatenated to form the final stack id
   */
  separator: string;

  /**
   * The ExpressStages in the wave
   */
  stages: ExpressStage[];

  /**
   * Add an ExpressStage to the wave
   * @param id The ExpressStage identifier
   */
  addStage(id: string): ExpressStage;
}

export interface ExpressWaveProps {
  readonly id: string;

  /**
   * Separator between the wave, stage and stack ids that are concatenated to form the stack id
   * @default `_`
   */
  readonly separator?: string;
}

/**
 * A CDK Express Pipeline Wave that contains ExpressStages
 */
export class ExpressWave implements IExpressWave {
  public id: string;
  public separator: string;
  public stages: ExpressStage[] = [];

  constructor(props: ExpressWaveProps) {
    this.id = props.id;
    this.separator = props.separator || CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR;
    if (this.id.includes(this.separator)) {
      throw new Error(`ExpressWave '${this.id}' cannot contain a '${this.separator}' (separator)`);
    }
  }

  public addStage(id: string): ExpressStage {
    return new ExpressStage({
      id: id,
      wave: this,
      stacks: [],
    });
    ;
  }
}