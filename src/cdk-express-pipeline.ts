import { ExpressWave, IExpressWave } from './express-wave';
import { getStackPatternToFilter, targetIdentifier } from './utils';

export const CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON = 'cdk-express-pipeline wave->stage->stack dependency';
export const CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR = '_';

export interface CdkExpressPipelineProps {
  /**
   * The waves in the pipeline
   */
  readonly waves?: ExpressWave[];

  /** Separator between the wave, stage and stack ids that are concatenated to form the stack id
   * @default _ */
  readonly separator?: string;
}

/**
 * A CDK Express Pipeline that defines the order in which the stacks are deployed
 */
export class CdkExpressPipeline {
  public readonly waves: IExpressWave[] = [];
  private separator: string;

  constructor(props?: CdkExpressPipelineProps) {
    this.waves = props?.waves || [];
    this.separator = props?.separator || CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR;
  }

  /** Add a wave to the pipeline
   * @param id The wave identifier
   * @param sequentialStages If true, the stages in the wave will be executed sequentially. Default: false.
   */
  public addWave(id: string, sequentialStages: boolean = false): IExpressWave {
    const wave = new ExpressWave(id, this.separator, sequentialStages);
    this.waves.push(wave);
    return wave;
  }

  /** Synthesize the pipeline which creates the dependencies between the stacks in the correct order
   * @param waves The waves to synthesize
   * @param print Whether to print the order of deployment to the console
   */
  public synth(waves?: IExpressWave[], print: boolean = true) {
    if (!waves) {
      waves = this.waves;
    }

    for (let w = 1; w < waves.length; w++) {
      if (waves[w].separator !== this.separator) {
        throw new Error(`The wave '${waves[w].id}' separator '${waves[w].separator}' does not match the pipeline separator '${this.separator}'`);
      }

      for (let s = 0; s < waves[w].stages.length; s++) {
        // All the stacks in this stage needs to depend on all the stacks in the previous wave's stage
        for (const dependantStage of waves[w - 1].stages) {
          for (const stageStack of waves[w].stages[s].stacks) {
            for (const dependantStack of dependantStage.stacks) {
              stageStack.addExpressDependency(dependantStack, CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON);
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
              stageStack.addExpressDependency(dependantStack, CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON);
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
   * @private
   */
  public printWaves(waves: IExpressWave[]) {

    console.log('');
    console.log('ORDER OF DEPLOYMENT');
    console.log('🌊 Waves  - Deployed sequentially.');
    console.log('🏗 Stages - Deployed in parallel by default, unless the wave is marked `[Seq 🏗]` for sequential stage execution.');
    console.log('📦 Stacks - Deployed after their dependent stacks within the stage (dependencies shown below them with ↳).');
    console.log('           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.');
    console.log('');

    const patternToFilter = getStackPatternToFilter();
    for (const wave of waves) {
      const targetWave = targetIdentifier(patternToFilter, wave.id);
      const waveTargetCharacter = targetWave ? '|' : ' ';

      console.log(`${waveTargetCharacter} 🌊 ${wave.id}${wave.sequentialStages ? ' [Seq 🏗]' : ''}`);
      for (const stage of wave.stages) {
        const fullStageId = `${wave.id}${wave.separator}${stage.id}`;
        const targetStage = targetIdentifier(patternToFilter, fullStageId);
        const stageTargetCharacter = targetStage ? '|  ' : '   ';

        console.log(`${stageTargetCharacter} 🏗 ${stage.id}`);
        for (const stack of stage.stacks) {
          const targetStack = targetIdentifier(patternToFilter, stack.id);
          const stackTargetCharacter = targetStack ? '|    ' : '     ';

          console.log(`${stackTargetCharacter} 📦 ${stack.stackName} (${stack.id})`);

          const dependantStacks = stack.expressDependencies()
            .filter(dep => dep.stage === stack.stage)
            .map((dep) => dep.stackName);
          if (dependantStacks.length > 0) {
            console.log(`${stackTargetCharacter}    ↳ ${dependantStacks.join(', ')}`);
          }
        }
      }
    }
    console.log('');
  }
}

export default CdkExpressPipeline;
