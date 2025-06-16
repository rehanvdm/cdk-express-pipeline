import { Stack } from 'aws-cdk-lib';
import { CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON } from './cdk-express-pipeline';
import { getStackPatternToFilter, targetIdentifier } from './utils';

export interface IExpressStageLegacy {
  /**
   * The stage identifier
   */
  id: string;

  /**
   * The stacks in the stage
   */
  stacks: Stack[];
}

/**
 * A stage that holds stacks
 */
export class ExpressStageLegacy implements IExpressStageLegacy {
  public id: string;
  public stacks: Stack[];

  constructor(id: string, stacks: Stack[] = []) {
    this.id = id;
    this.stacks = stacks;
  }

  /**
   * Add a stack to the stage
   * @param stack The stack to add
   */
  addStack(stack: Stack): Stack {
    this.stacks.push(stack);
    return stack;
  }
}

export interface IExpressWaveLegacy {
  /**
   * The wave identifier
   */
  id: string;

  /**
   * The ExpressStages in the wave
   */
  stages: IExpressStageLegacy[];

  /**
   * If true, the stages in the wave will be executed sequentially
   * @default false
   */
  sequentialStages?: boolean;
}

/**
 * A CDK Express Pipeline Legacy Wave that contains Legacy Stages
 */
export class ExpressWaveLegacy implements IExpressWaveLegacy {
  public id: string;
  public stages: IExpressStageLegacy[] = [];
  public sequentialStages?: boolean = false;

  /**
   * Constructs a new instance of the ExpressWaveLegacy class
   * @param id
   * @param sequentialStages If true, the stages in the wave will be executed sequentially. Default: false.
   */
  constructor(id: string, sequentialStages: boolean = false) {
    this.id = id;
    this.sequentialStages = sequentialStages;
  }

  /**
   * Add a stage to the wave
   * @param id The stage identifier
   */
  addStage(id: string): ExpressStageLegacy {
    const stage = new ExpressStageLegacy(id);
    this.stages.push(stage);
    return stage;
  }
}

/**
 * A CDK Express Pipeline that defines the order in which the stacks are deployed.
 *
 * This is the legacy version of the pipeline that uses the `Stack` class, for plug and play compatibility with existing CDK projects that can not
 * use the `ExpressStack` class. For new projects, use the `CdkExpressPipeline` class.
 */
export class CdkExpressPipelineLegacy {
  public waves: IExpressWaveLegacy[] = [];

  constructor(waves: IExpressWaveLegacy[] = []) {
    this.waves = waves;
  }

  /** Add a wave to the pipeline
   * @param id The wave identifier
   * @param sequentialStages If true, the stages in the wave will be executed sequentially. Default: false.
   */
  public addWave(id: string, sequentialStages: boolean = false): ExpressWaveLegacy {
    const wave = new ExpressWaveLegacy(id, sequentialStages);
    this.waves.push(wave);
    return wave;
  }

  /** Synthesize the pipeline which creates the dependencies between the stacks in the correct order
   * @param waves The waves to synthesize
   * @param print Whether to print the order of deployment to the console
   */
  public synth(waves?: IExpressWaveLegacy[], print: boolean = true) {
    if (!waves) {
      waves = this.waves;
    }

    for (let w = 1; w < waves.length; w++) {
      for (let s = 0; s < waves[w].stages.length; s++) {
        // All the stacks in this stage needs to depend on all the stacks in the previous stage
        for (const dependantStage of waves[w - 1].stages) {
          for (const stageStack of waves[w].stages[s].stacks) {
            for (const dependantStack of dependantStage.stacks) {
              stageStack.addDependency(dependantStack, CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON);
            }
          }
        }
      }
    }

    for (let w = 0; w < waves.length; w++) {
      if (waves[w].sequentialStages) {
        // If the wave has sequential stages, all stacks in this stage need to depend on all stacks in the previous stage
        for (let s = 1; s < waves[w].stages.length; s++) {
          for (const dependantStack of waves[w].stages[s - 1].stacks) {
            for (const stageStack of waves[w].stages[s].stacks) {
              stageStack.addDependency(dependantStack, CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON);
            }
          }
        }
      }
    }

    if (print) {
      this.printWaves(waves);
    }
  }

  /**
   * Print the order of deployment to the console
   * @param waves
   */
  public printWaves(waves: IExpressWaveLegacy[]) {
    console.log('');
    console.log('ORDER OF DEPLOYMENT');
    console.log('🌊 Waves  - Deployed sequentially.');
    console.log('🏗 Stages - Deployed in parallel by default, unless the wave is marked `[Seq 🏗]` for sequential stage execution.');
    console.log('📦 Stacks - Deployed after their dependent stacks within the stage.');
    console.log('           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.');
    console.log('');

    const patternToFilter = getStackPatternToFilter();
    for (const wave of waves) {
      console.log(`  🌊 ${wave.id}${wave.sequentialStages ? ' [Seq 🏗]' : ''}`);
      for (const stage of wave.stages) {
        console.log(`    🏗 ${stage.id}`);
        for (const stack of stage.stacks) {
          const targetStack = targetIdentifier(patternToFilter, stack.stackName);
          const stackTargetCharacter = targetStack ? '|    ' : '     ';

          console.log(`${stackTargetCharacter} 📦 ${stack.stackName}`);
        }
      }
    }
    console.log('');
  }
}

export default CdkExpressPipelineLegacy;
