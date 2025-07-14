import * as fs from 'fs';
import * as path from 'path';
import { createGitHubWorkflows, saveWorkflowTemplates, GitHubWorkflowConfig, GithubWorkflowFile } from './ci-github';
import { ExpressStack } from './express-stack';
import { ExpressWave, IExpressWave } from './express-wave';
import { MermaidDiagramOutput } from './shared';
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
   * @param saveMermaidDiagram If provided, saves a Mermaid diagram of the deployment order to the specified path
   */
  public synth(waves?: IExpressWave[], print: boolean = true, saveMermaidDiagram?: MermaidDiagramOutput) {
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

    if (saveMermaidDiagram) {
      const mermaidDiagram = this.generateMermaidDiagram(waves);

      // Write Mermaid diagram to file
      const outputPath = saveMermaidDiagram.path || process.cwd();
      const fileName = saveMermaidDiagram.fileName || 'pipeline-deployment-order.md';
      if (!fileName.endsWith('.md')) {
        throw new Error('Mermaid diagram file name must end with .md');
      }
      const fullPath = path.join(outputPath, fileName);
      fs.writeFileSync(fullPath, mermaidDiagram);
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
    console.log('           - Stack deployment order within the stage is shown in square brackets (ex: [1])');
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
        const stackOrderMap = this.calculateStackOrderNumbers(stage.stacks);

        console.log(`${stageTargetCharacter} 🏗 ${stage.id}`);
        for (const stack of stage.stacks) {
          const targetStack = targetIdentifier(patternToFilter, stack.id);
          const stackTargetCharacter = targetStack ? '|    ' : '     ';
          const stackOrder = stackOrderMap.get(stack.id);

          console.log(`${stackTargetCharacter} 📦 ${stack.stackName} (${stack.id}) [${stackOrder}]`);

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

  /**
   * Calculate deployment order numbers for stacks within a stage
   * @param stacks The stacks in the stage
   * @private
   */
  private calculateStackOrderNumbers(stacks: ExpressStack[]): Map<string, number> {
    const orderMap = new Map<string, number>();
    const visited = new Set<string>();
    const depthMap = new Map<string, number>();

    // Helper function to get dependencies for a stack
    const getDependencies = (stack: ExpressStack): ExpressStack[] => {
      return stack.expressDependencies()
        .filter(dep => dep.stage === stack.stage)
        .map(dep => dep);
    };

    // Helper function to calculate the maximum depth of dependencies for a stack
    const calculateDepth = (stack: ExpressStack): number => {
      if (depthMap.has(stack.id)) {
        return depthMap.get(stack.id)!;
      }

      if (visited.has(stack.id)) {
        // If we've already visited this stack, return its current depth
        return depthMap.get(stack.id) || 1;
      }

      visited.add(stack.id);
      const dependencies = getDependencies(stack);

      if (dependencies.length === 0) {
        depthMap.set(stack.id, 1);
        return 1;
      }

      const maxDepth = Math.max(...dependencies.map(dep => calculateDepth(dep))) + 1;
      depthMap.set(stack.id, maxDepth);
      return maxDepth;
    };

    // Calculate depths for all stacks
    for (const stack of stacks) {
      if (!visited.has(stack.id)) {
        calculateDepth(stack);
      }
    }

    // Assign order numbers based on depths
    const depths = Array.from(depthMap.values());
    const uniqueDepths = [...new Set(depths)].sort((a, b) => a - b);

    for (const stack of stacks) {
      const depth = depthMap.get(stack.id)!;
      const order = uniqueDepths.indexOf(depth) + 1;
      orderMap.set(stack.id, order);
    }

    return orderMap;
  }

  // /**
  //  * Calculate deployment order numbers for stages within a wave
  //  * @param stages The stages in the wave
  //  * @param sequentialStages Whether stages should be executed sequentially
  //  * @private
  //  */
  // private calculateStageOrderNumbers(stages: ExpressStage[], sequentialStages: boolean = false): Map<string, number> {
  //   const orderMap = new Map<string, number>();
  //
  //   if (sequentialStages) {
  //     // If stages are sequential, assign increasing order numbers
  //     stages.forEach((stage, index) => {
  //       orderMap.set(stage.id, index + 1);
  //     });
  //   } else {
  //     // If stages are parallel, all get order 1
  //     stages.forEach(stage => {
  //       orderMap.set(stage.id, 1);
  //     });
  //   }
  //
  //   return orderMap;
  // }

  /**
   * Generate a Mermaid diagram showing the deployment order
   * @param waves The waves to include in the diagram
   * @private
   */
  public generateMermaidDiagram(waves: IExpressWave[]): string {
    let diagram = '```mermaid\ngraph TD\n';

    // Add waves as subgraphs
    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      const waveId = `Wave${w}`;
      diagram += `    subgraph ${waveId}["🌊 ${wave.id}"]\n`; // (${w + 1})

      // Calculate stage order numbers
      // const stageOrderMap = this.calculateStageOrderNumbers(wave.stages, wave.sequentialStages);

      // Add stages as subgraphs
      for (let s = 0; s < wave.stages.length; s++) {
        const stage = wave.stages[s];
        const stageId = `${waveId}Stage${s}`;
        // const stageOrder = stageOrderMap.get(stage.id);
        diagram += `        subgraph ${stageId}["🏗 ${stage.id}"]\n`; // (${stageOrder})

        // Calculate stack order numbers
        const stackOrderMap = this.calculateStackOrderNumbers(stage.stacks);

        // Add stacks
        for (const stack of stage.stacks) {
          const stackId = `Stack${stack.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const stackOrder = stackOrderMap.get(stack.id);
          diagram += `            ${stackId}["📦 ${stack.stackName} [${stackOrder}]"]\n`;
        }
        diagram += '        end\n';

        if (wave.sequentialStages && s > 0) {
          // Add dependency between stages
          const prevStageId = `${waveId}Stage${s-1}`;
          diagram += `        ${prevStageId} --> ${stageId}\n`;
        }

      }
      diagram += '    end\n';

      // Add dependencies between stacks
      for (const stage of wave.stages) {
        for (const stack of stage.stacks) {
          const stackId = `Stack${stack.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const dependantStacks = stack.expressDependencies()
            .filter(dep => dep.stage === stack.stage)
            .map((dep) => `Stack${dep.id.replace(/[^a-zA-Z0-9]/g, '_')}`);

          for (const dep of dependantStacks) {
            diagram += `    ${dep} --> ${stackId}\n`;
          }
        }
      }
    }

    // Add wave dependencies
    for (let w = 1; w < waves.length; w++) {
      diagram += `    Wave${w-1} --> Wave${w}\n`;
    }

    diagram += '```\n';
    return diagram;
  }

  public generateGitHubWorkflows(gitHubWorkflowConfig: GitHubWorkflowConfig, saveToFiles:boolean = true) {
    const workflows = createGitHubWorkflows(gitHubWorkflowConfig, this.waves);
    if (saveToFiles) {
      saveWorkflowTemplates(workflows);
    }
    return workflows;
  }
  public saveGitHubWorkflows(workflows: GithubWorkflowFile[]) {
    saveWorkflowTemplates(workflows);
  }
}

export default CdkExpressPipeline;
