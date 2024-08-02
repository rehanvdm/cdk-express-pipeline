import { ExpressStack } from './express-stack';
import { ExpressStage } from './express-stage';
import { ExpressWave } from './express-wave';

export const CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON = 'cdk-express-pipeline wave->stage->stack dependency';
export const CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR = '_';


export interface CdkExpressPipelineProps {
  /**
   * The waves in the pipeline
   */
  readonly waves?: ExpressWave[];

  /** Separator between the wave, stage and stack ids that are concatenated to form the stack id
   * @default __ */
  readonly separator?: string;
}

/**
 * A CDK Express Pipeline that defines the order in which the stacks are deployed
 */
export class CdkExpressPipeline {
  public readonly waves: ExpressWave[] = [];
  private separator: string;

  constructor(props?: CdkExpressPipelineProps) {
    this.waves = props?.waves || [];
    this.separator = props?.separator || CDK_EXPRESS_PIPELINE_DEFAULT_SEPARATOR;
  }

  /** Add a wave to the pipeline
   * @param id The wave identifier
   */
  public addWave(id: string): ExpressWave {
    const wave = new ExpressWave({
      id,
      separator: this.separator,
    });
    this.waves.push(wave);
    return wave;
  }

  /** Synthesize the pipeline which creates the dependencies between the stacks in the correct order
   * @param waves The waves to synthesize
   * @param print Whether to print the order of deployment to the console
   */
  public synth(waves?: ExpressWave[], print: boolean = true) {
    if (!waves) {
      waves = this.waves;
    }

    for (let i = 1; i < waves.length; i++) {
      if (waves[i].separator !== this.separator) {
        throw new Error(`The wave '${waves[i].id}' separator '${waves[i].separator}' does not match the pipeline separator '${this.separator}'`);
      }

      for (const stage of waves[i].stages) {
        // All the stacks in this stage needs to depend on all the stacks in the previous stage
        for (const dependantStage of waves[i - 1].stages) {
          for (const stageStack of stage.stacks) {
            for (const dependantStack of dependantStage.stacks) {
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
  private printWaves(waves: ExpressWave[]) {

    function printStackDependencies(stage: ExpressStage, stack: ExpressStack, indentationLevel: number) {
      if (stack.stage !== stage) {
        return;
      }
      console.log(`${'  '.repeat(indentationLevel)}    ↳ ${stack.stackName}`);

      stack.expressDependencies().forEach(dependantStack => {
        printStackDependencies(stage, dependantStack, indentationLevel + 1);
      });
    }

    console.log('');
    console.log('ORDER OF DEPLOYMENT');
    console.log('🌊 Waves  - Deployed sequentially');
    console.log('🔲 Stages - Deployed in parallel, all stages within a wave are deployed at the same time');
    console.log('📄 Stack  - Dependency driven, will be deployed after all its dependent stacks, denoted by ↳ below it, is deployed');
    console.log('');

    for (const wave of waves) {
      console.log(`🌊 ${wave.id}`);
      for (const stage of wave.stages) {
        console.log(`  🔲 ${stage.id}`);
        for (const stack of stage.stacks) {
          console.log(`    📄 ${stack.stackName} (${stack.id})`);
          for (let dependantStack of stack.expressDependencies()) {
            printStackDependencies(stack.stage, dependantStack, 2);
          }
        }
      }
    }
    console.log('');
  }
}

export default CdkExpressPipeline;
