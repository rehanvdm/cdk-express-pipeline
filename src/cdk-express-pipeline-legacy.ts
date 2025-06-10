import { Stack } from 'aws-cdk-lib';
import { CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON } from './cdk-express-pipeline';
import { getStackPatternToFilter, targetIdentifier } from './utils';

export interface IExpressStageLegacy {
  id: string;
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
  id: string;
  stages: IExpressStageLegacy[];
}

/**
 * A wave that holds stages
 */
export class ExpressWaveLegacy implements IExpressWaveLegacy {
  public id: string;
  public stages: IExpressStageLegacy[];

  constructor(id: string, stages: IExpressStageLegacy[] = []) {
    this.id = id;
    this.stages = stages;
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
   */
  public addWave(id: string): ExpressWaveLegacy {
    const wave = new ExpressWaveLegacy(id);
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

    for (let i = 1; i < waves.length; i++) {
      for (const stage of waves[i].stages) {
        // All the stacks in this stage needs to depend on all the stacks in the previous stage
        for (const dependantStage of waves[i - 1].stages) {
          for (const stageStack of stage.stacks) {
            for (const dependantStack of dependantStage.stacks) {
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
    console.log('🌊 Waves  - Deployed sequentially, one after another.');
    console.log('🏗️ Stages - Deployed in parallel, all stages within a wave are deployed at the same time.');
    console.log('📦 Stacks - Deployed after their dependent stacks within the stage.');
    console.log('           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.');
    console.log('');

    const patternToFilter = getStackPatternToFilter();
    for (const wave of waves) {
      console.log(`  🌊 ${wave.id}`);
      for (const stage of wave.stages) {
        console.log(`    🏗️ ${stage.id}`);
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
