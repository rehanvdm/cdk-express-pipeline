import * as fs from 'fs';
import * as path from 'path';
import { Stack } from 'aws-cdk-lib';
import { CDK_EXPRESS_PIPELINE_DEPENDENCY_REASON } from './cdk-express-pipeline';
import { MermaidDiagramOutput } from './shared';
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
   * @param saveMermaidDiagram If provided, saves a Mermaid diagram of the deployment order to the specified path
   */
  public synth(waves?: IExpressWaveLegacy[], print: boolean = true, saveMermaidDiagram?: MermaidDiagramOutput) {
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
   */
  public printWaves(waves: IExpressWaveLegacy[]) {
    console.log('');
    console.log('ORDER OF DEPLOYMENT');
    console.log('🌊 Waves  - Deployed sequentially.');
    console.log('🏗 Stages - Deployed in parallel by default, unless the wave is marked `[Seq 🏗]` for sequential stage execution.');
    console.log('📦 Stacks - Deployed after their dependent stacks within the stage.');
    console.log('           - Lines prefixed with a pipe (|) indicate stacks matching the CDK pattern.');
    console.log('           - Stack deployment order within the stage is shown in square brackets (ex: [1])');
    console.log('');

    const patternToFilter = getStackPatternToFilter();
    for (const wave of waves) {
      console.log(`  🌊 ${wave.id}${wave.sequentialStages ? ' [Seq 🏗]' : ''}`);
      for (const stage of wave.stages) {
        const stackOrderMap = this.calculateStackOrderNumbers(stage.stacks);
        console.log(`    🏗 ${stage.id}`);

        for (const stack of stage.stacks) {
          const targetStack = targetIdentifier(patternToFilter, stack.stackName);
          const stackTargetCharacter = targetStack ? '|    ' : '     ';
          const stackOrder = stackOrderMap.get(stack.stackId);

          console.log(`${stackTargetCharacter} 📦 ${stack.stackName} [${stackOrder}]`);
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
  private calculateStackOrderNumbers(stacks: Stack[]): Map<string, number> {
    const orderMap = new Map<string, number>();
    const visited = new Set<string>();
    const depthMap = new Map<string, number>();

    // Helper function to get dependencies for a stack, only within the same stage
    const getDependencies = (stack: Stack): Stack[] => {
      return stack.dependencies.filter(dep => stacks.includes(dep));
    };

    // Helper function to calculate the maximum depth of dependencies for a stack
    const calculateDepth = (stack: Stack): number => {
      if (depthMap.has(stack.stackId)) {
        return depthMap.get(stack.stackId)!;
      }

      if (visited.has(stack.stackId)) {
        // If we've already visited this stack, return its current depth
        return depthMap.get(stack.stackId) || 1;
      }

      visited.add(stack.stackId);
      const dependencies = getDependencies(stack);

      if (dependencies.length === 0) {
        depthMap.set(stack.stackId, 1);
        return 1;
      }

      const maxDepth = Math.max(...dependencies.map(dep => calculateDepth(dep))) + 1;
      depthMap.set(stack.stackId, maxDepth);
      return maxDepth;
    };

    // Calculate depths for all stacks
    for (const stack of stacks) {
      if (!visited.has(stack.stackId)) {
        calculateDepth(stack);
      }
    }

    // Assign order numbers based on depths
    const depths = Array.from(depthMap.values());
    const uniqueDepths = [...new Set(depths)].sort((a, b) => a - b);

    for (const stack of stacks) {
      const depth = depthMap.get(stack.stackId)!;
      const order = uniqueDepths.indexOf(depth) + 1;
      orderMap.set(stack.stackId, order);
    }

    return orderMap;
  }

  /**
   * Generate a Mermaid diagram showing the deployment order
   * @param waves The waves to include in the diagram
   * @private
   */
  public generateMermaidDiagram(waves: IExpressWaveLegacy[]): string {
    let diagram = '```mermaid\ngraph TD\n';

    // Add waves as subgraphs
    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      const waveId = `Wave${w}`;
      diagram += `    subgraph ${waveId}["🌊 ${wave.id}"]\n`;

      // Add stages as subgraphs
      for (let s = 0; s < wave.stages.length; s++) {
        const stage = wave.stages[s];
        const stageId = `${waveId}Stage${s}`;
        diagram += `        subgraph ${stageId}["🏗 ${stage.id}"]\n`;

        // Calculate stack order numbers
        const stackOrderMap = this.calculateStackOrderNumbers(stage.stacks);

        // Add stacks
        for (const stack of stage.stacks) {
          const stackId = `Stack${stack.stackId.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const stackOrder = stackOrderMap.get(stack.stackId);
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
          const stackId = `Stack${stack.stackId.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const dependantStacks = stack.dependencies
            .filter(dep => stage.stacks.includes(dep))
            .map((dep) => `Stack${dep.stackId.replace(/[^a-zA-Z0-9]/g, '_')}`);

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
}

export default CdkExpressPipelineLegacy;
