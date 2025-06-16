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
   * If true, the stages in the wave will be executed sequentially
   * @default false
   */
  sequentialStages?: boolean;

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
  public sequentialStages?: boolean = false;

  /**
   * Constructs a new instance of the ExpressWave class
   * @param id
   * @param separator Separator between the wave, stage and stack ids that are concatenated to form the stack id. Default: '_'.
   * @param sequentialStages If true, the stages in the wave will be executed sequentially. Default: false.
   */
  constructor(id: string, separator: string = CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR, sequentialStages: boolean = false) {
    this.id = id;
    this.separator = separator;
    this.sequentialStages = sequentialStages;

    if (this.id.includes(this.separator)) {
      throw new Error(`ExpressWave '${this.id}' cannot contain a '${this.separator}' (separator)`);
    }
  }

  public addStage(id: string): ExpressStage {
    return new ExpressStage(id, this);
  }
}