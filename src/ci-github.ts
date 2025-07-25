import * as fs from 'fs';
import * as path from 'path';
import { stringify } from 'yaml';
import { IExpressStack } from './express-stack';
import { IExpressStage } from './express-stage';
import { IExpressWave } from './express-wave';
import { JsonPatch, Patch } from './utils/json-patch';

export interface GitHubWorkflowConfig {
  /**
   * Configuration for the synth workflow
   */
  readonly synth: SynthWorkflowConfig;

  /**
   * Configuration for the diff workflow
   */
  readonly diff: DiffWorkflowConfig[];

  /**
   * Configuration for the deploy workflow
   */
  readonly deploy: DeployWorkflowConfig[];
}

export interface SynthWorkflowConfig {
  /**
   * Configuration for the build workflow
   */
  readonly buildConfig: BuildConfig;

  /**
   * Commands to run for synthesis
   */
  readonly commands: Record<string, string>[];
}

export interface BuildConfig {
  /**
   * The type of workflow to use
   */
  readonly type: 'preset-npm' | 'workflow';

  /**
   * Only required if type is 'workflow'. Specify the workflow or reusable action to use for building
   */
  readonly workflow?: WorkflowLocation;
}

export interface WorkflowLocation {
  /**
   * The path of the workflow to call before synthesis
   */
  readonly path: string;
}

export interface WorkflowTriggersPullRequests {
  readonly branches?: string[];
}
export interface WorkflowTriggersPush {
  readonly branches?: string[];
}
export interface WorkflowTriggers {
  readonly pullRequest?: WorkflowTriggersPullRequests;
  readonly push?: WorkflowTriggersPush;
}

export interface DiffWorkflowConfig {
  /**
   * Unique identifier, postfixed to the generated workflow name. Can be omitted if only one workflow is specified.
   */
  readonly id?: string;

  /**
  * Conditions that trigger the diff workflow
  * */
  readonly on: WorkflowTriggers;

  /**
   * ARN of the role to assume for the diff operation
   */
  readonly assumeRoleArn: string;

  /**
   * AWS region to assume for the diff operation
   */
  readonly assumeRegion: string;

  /**
   * Selector for the stack type
   */
  readonly stackSelector: 'wave' | 'stage' | 'stack';

  /**
   * Commands to run for synthesis
   */
  readonly commands: Record<string, string>[];

  /**
   * Whether to write the diff as a comment
   * @default true
   */
  readonly writeAsComment?: boolean;
}

export interface DeployWorkflowConfig {

  /**
   * Unique identifier, postfixed to the generated workflow name. Can be omitted if only one workflow is specified.
   */
  readonly id?: string;

  /**
   * Conditions that trigger the deploy workflow
   */
  readonly on: WorkflowTriggers;

  /**
   * ARN of the role to assume for the diff operation
   */
  readonly assumeRoleArn: string;

  /**
   * AWS region to assume for the diff operation
   */
  readonly assumeRegion: string;

  /**
   * Selector for the stack type
   */
  readonly stackSelector: 'wave' | 'stage' | 'stack';

  /**
   * Commands to run for synthesis
   */
  readonly commands: Record<string, string>[];
}


export class GithubWorkflow {

  public json: object;

  constructor(json: object) {
    this.json = json;
  }

  /**
   * Applies a set of JSON-Patch (RFC-6902) operations to this object and returns the result.
   * @param ops The operations to apply
   * @returns The result object
   */
  public patch(...ops: Patch[]): GithubWorkflow {
    const jsonPatch = new JsonPatch();
    const result = jsonPatch.patch({ ...this.json }, ...ops);
    this.json = result;
    return new GithubWorkflow(result);
  }
}

export interface GithubWorkflowFile {
  readonly fileName: string;
  readonly content: GithubWorkflow;
}


const AUTO_GENERATED_COMMENT = '# ~~ Generated by cdk-express-pipeline. To modify, edit your pipeline and run `cdk synth`';

export function createGitHubWorkflows(githubConfig: GitHubWorkflowConfig, waves: IExpressWave[]) {

  const workflowFiles: GithubWorkflowFile[] = [];
  workflowFiles.push(synthReusableAction(githubConfig.synth));
  workflowFiles.push(diffReusableAction());
  workflowFiles.push(deployReusableAction());


  for (const diffConfig of githubConfig.diff) {
    const hasMultipleWorkflows = githubConfig.diff.length > 1;
    if (!diffConfig.id && hasMultipleWorkflows) {
      throw new Error('Diff workflow configuration must have an id');
    }

    workflowFiles.push(diffWorkflow(diffConfig, waves, hasMultipleWorkflows));
  }

  for (const deployConfig of githubConfig.deploy) {
    const hasMultipleWorkflows = githubConfig.deploy.length > 1;
    if (!deployConfig.id && hasMultipleWorkflows) {
      throw new Error('Deploy workflow configuration must have an id');
    }

    workflowFiles.push(deployWorkflow(deployConfig, waves, hasMultipleWorkflows));
  }

  return workflowFiles;
}

export function saveWorkflowTemplates(templates: GithubWorkflowFile[]) {
  const githubDir = path.join(process.cwd(), '.github');
  if (!fs.existsSync(githubDir)) {
    fs.mkdirSync(githubDir, { recursive: true });
  }

  templates.forEach(template => {
    const filePath = path.join(githubDir, template.fileName);
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const yamlContent = `${AUTO_GENERATED_COMMENT}\n${stringify(template.content.json)}`;
    fs.writeFileSync(filePath, yamlContent);
  });
}

function synthReusableAction(synthConfig: SynthWorkflowConfig): GithubWorkflowFile {
  const synthSteps = synthConfig.commands.map(command => {
    const commandKey = Object.keys(command)[0];
    const commandValue = command[commandKey];
    return {
      name: `CDK synth ${commandKey}`,
      shell: 'bash',
      run: commandValue,
    };
  });

  let buildSteps: object[] = [];
  if (synthConfig.buildConfig.type === 'preset-npm') {
    buildSteps = [{
      name: 'Set up node',
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': 20,
        'cache': 'npm',
      },
    },
    {
      name: 'Install dependencies',
      run: 'npm ci',
      shell: 'bash',
    }];
  } else if (synthConfig.buildConfig.type === 'workflow') {
    if (!synthConfig.buildConfig.workflow?.path) {
      throw new Error('Workflow is required when using "workflow" type for build');
    }
    buildSteps = [
      {
        name: 'Build workflow',
        uses: synthConfig.buildConfig.workflow.path,
      },
    ];
  }

  const workflowContent = new GithubWorkflow({
    name: 'CDK Express Pipeline Synth Action',
    runs: {
      using: 'composite',
      steps: [
        {
          name: 'Checkout repo',
          uses: 'actions/checkout@v4',
        },
        ...buildSteps,
        ...synthSteps,
        {
          name: 'Cache Build',
          uses: 'actions/cache/save@v4',
          with: {
            key: 'cache-build-${{ github.sha }}',
            path: [
              'cdk.out/',
              'node_modules/',
            ].join('\n'),
          },
        },
      ],
    },
  });

  return {
    fileName: 'actions/cdk-express-pipeline-synth/action.yml',
    content: workflowContent,
  };
}
function diffReusableAction(): GithubWorkflowFile {
  const workflowContent = new GithubWorkflow({
    name: 'CDK Diff Action',
    description: 'Run CDK diff for a specific stack pattern and post results to PR',
    inputs: {
      'stack-selector-patterns': {
        required: true,
        description: 'The value of the {stackSelector} replacement in the command',
      },
      'command': {
        required: true,
        description: 'CDK diff command',
      },
      'cloud-assembly-directory': {
        required: true,
        description: 'The directory where the CDK cloud assembly is located',
      },
      'github-token': {
        required: true,
        description: 'GitHub token for posting comments',
      },
      'write-as-comment': {
        required: true,
        description: 'Whether to write the diff as a comment or do the command instead',
      },
      'comment-title': {
        required: true,
        description: 'Title for the diff comment',
      },
      'assume-role-arn': {
        required: true,
        description: 'The ARN of the role to assume for the deploy operation',
      },
      'assume-region': {
        required: true,
        description: 'The AWS region to assume for the deploy operation',
      },
    },
    runs: {
      using: 'composite',
      steps: [
        restoreBuildCacheStep(),
        assumeAwsRoleStep('${{ inputs.assume-role-arn }}', '${{ inputs.assume-region }}'),
        {
          name: 'CDK Diff Comment',
          if: '${{ inputs.write-as-comment == true }} ',
          uses: 'corymhall/cdk-diff-action@v2',
          with: {
            title: '${{ inputs.comment-title }}',
            defaultStageDisplayName: '`**`',
            stackSelectorPatterns: '${{ inputs.stack-selector-patterns }}',
            cdkOutDir: '${{ inputs.cloud-assembly-directory }}',
            githubToken: '${{ inputs.github-token }}',
            failOnDestructiveChanges: false,
          },
        },
        {
          name: 'CDK Diff Command',
          if: '${{ inputs.write-as-comment == false }} ',
          run: '${{ inputs.command }}',
          shell: 'bash',
        },
      ],
    },
  });

  return {
    fileName: 'actions/cdk-express-pipeline-diff/action.yml',
    content: workflowContent,
  };
}
function deployReusableAction(): GithubWorkflowFile {
  const workflowContent = new GithubWorkflow({
    name: 'CDK Deploy Action',
    description: 'Run CDK deploy for a specific stack pattern',
    inputs: {
      'stack-selector-patterns': {
        required: true,
        description: 'The value of the {stackSelector} replacement in the command',
      },
      'command': {
        required: true,
        description: 'CDK deploy command',
      },
      'cloud-assembly-directory': {
        required: true,
        description: 'The directory where the CDK cloud assembly is located',
      },
      'assume-role-arn': {
        required: true,
        description: 'The ARN of the role to assume for the deploy operation',
      },
      'assume-region': {
        required: true,
        description: 'The AWS region to assume for the deploy operation',
      },
    },
    runs: {
      using: 'composite',
      steps: [
        restoreBuildCacheStep(),
        assumeAwsRoleStep('${{ inputs.assume-role-arn }}', '${{ inputs.assume-region }}'),
        {
          name: 'CDK Deploy Command',
          run: '${{ inputs.command }}',
          shell: 'bash',
        },
      ],
    },
  });

  return {
    fileName: 'actions/cdk-express-pipeline-deploy/action.yml',
    content: workflowContent,
  };
}


function checkoutRepoStep() {
  return {
    name: 'Checkout repo',
    uses: 'actions/checkout@v4',
  };
}
function restoreBuildCacheStep() {
  return {
    name: 'Restore Build Cache',
    uses: 'actions/cache/restore@v4',
    with: {
      key: 'cache-build-${{ github.sha }}',
      path: [
        'cdk.out/',
        'node_modules/',
      ].join('\n'),
    },
  };
}
function assumeAwsRoleStep(assumeRoleArn: string, assumeRegion: string) {
  return {
    name: 'Configure AWS credentials',
    uses: 'aws-actions/configure-aws-credentials@v4',
    with: {
      'role-to-assume': assumeRoleArn,
      'aws-region': assumeRegion,
    },
  };
}

function capitalizeFirstLetter(input: string): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}


function extractAppArgument(command: string): string | undefined {
  const match = command.match(/--app(?:=|\s)(?:"([^"]+)"|'([^']+)'|(\S+))/);

  if (!match) return undefined;

  // Return whichever capturing group matched (double quotes, single quotes, or unquoted)
  return match[1] || match[2] || match[3];
}

function formatWorkflowTriggers(workflowTriggers: WorkflowTriggers) {
  let triggers: any = workflowTriggers;
  if (workflowTriggers.pullRequest) {
    // Need to change `pullRequest` to `pull_request` to match GitHub Actions syntax
    triggers = {
      ...workflowTriggers,
      pull_request: workflowTriggers.pullRequest,
    };
    delete triggers.pullRequest;
  }
  return triggers;
}
function diffWorkflow(diffConfig: DiffWorkflowConfig, waves: IExpressWave[],
  requiresUniqueId: boolean): GithubWorkflowFile {

  function toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2') // handle camelCase or PascalCase
      .replace(/[\s\-]+/g, '_') // replace spaces and hyphens with underscores
      .replace(/([A-Z]+)/g, '_$1') // add underscores before uppercase sequences
      .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
      .toLowerCase();
  }
  function stepStackSelectors(stackSelector: 'wave' | 'stage' | 'stack') {
    const res: { name: string; selector: string }[] = [];
    for (const wave of waves) {
      if (stackSelector === 'wave') {
        res.push({
          name: toSnakeCase(wave.id),
          selector: `${wave.id}${wave.separator}*`,
        });
      } else if (stackSelector === 'stage') {
        for (const stage of wave.stages) {
          res.push({
            name: toSnakeCase(wave.id + '__' + stage.id),
            selector: `${wave.id}${wave.separator}${stage.id}${wave.separator}*`,
          });
        }
      } else if (stackSelector === 'stack') {
        for (const stage of wave.stages) {
          for (const stack of stage.stacks) {
            res.push({
              name: toSnakeCase(wave.id + '__' + stage.id + '__' + stack.id),
              selector: stack.id,
            });
          }
        }
      }
    }
    return res;
  }

  const diffJobs = {};
  for (let command of diffConfig.commands) {
    const commandKey = Object.keys(command)[0];
    const commandValue = command[commandKey];
    if (!commandValue.includes('{stackSelector}')) {
      throw new Error(`Command for diff workflow must include {stackSelector} placeholder, provided: ${commandValue}`);
    }

    const stackSelectors = stepStackSelectors(diffConfig.stackSelector);
    const matrixIncludes: {
      'name': string;
      'cloud-assembly-directory': string;
      'stack-selector-patterns': string;
      'command': string;
      'write-as-comment': boolean;
      'assume-role-arn': string;
      'assume-region': string;
    }[] = [];
    for (const stackSelector of stackSelectors) {
      matrixIncludes.push({
        'name': stackSelector.name,
        'cloud-assembly-directory': extractAppArgument(commandValue) || 'cdk.out',
        'stack-selector-patterns': stackSelector.selector,
        'command': commandValue.replace('{stackSelector}', stackSelector.selector),
        'write-as-comment': !!diffConfig.writeAsComment,
        'assume-role-arn': diffConfig.assumeRoleArn,
        'assume-region': diffConfig.assumeRegion,
      });
    }

    // @ts-ignore
    diffJobs['diff__' + commandKey] = {
      'name': `Diff ${commandKey} - \${{ matrix.name }}`,
      'needs': ['build'],
      'runs-on': 'ubuntu-latest',
      'permissions': {
        'actions': 'write',
        'contents': 'write',
        'id-token': 'write',
        'pull-requests': 'write',
      },
      'strategy': {
        'matrix': {
          include: matrixIncludes,
        },
        'fail-fast': false,
      },
      'steps': [
        checkoutRepoStep(),
        // restoreBuildCacheStep(),
        // assumeAwsRoleStep(diffConfig.assumeRoleArn, diffConfig.assumeRegion),
        {
          name: 'Run CDK Express Pipeline Synth',
          uses: './.github/actions/cdk-express-pipeline-diff',
          with: {
            'stack-selector-patterns': '${{ matrix.stack-selector-patterns }}',
            'cloud-assembly-directory': '${{ matrix.cloud-assembly-directory }}',
            'command': '${{ matrix.command }}',
            'write-as-comment': '${{ matrix.write-as-comment }}',
            'comment-title': `CDK Diff: ${commandKey} - \${{ matrix.name }}`,
            'github-token': '${{ secrets.GITHUB_TOKEN }}',
            'assume-role-arn': '${{ matrix.assume-role-arn }}',
            'assume-region': '${{ matrix.assume-region }}',
          },
        },
      ],
    };
  }

  const workflowContent = new GithubWorkflow({
    name: `CDK Express Pipeline Diff${(requiresUniqueId || diffConfig.id) ? ' - '+ capitalizeFirstLetter(diffConfig.id!) : '' }`,
    on: formatWorkflowTriggers(diffConfig.on),
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        'name': 'Build and Synth',
        'steps': [
          checkoutRepoStep(),
          {
            name: 'Run CDK Express Pipeline Synth',
            uses: './.github/actions/cdk-express-pipeline-synth',
          },
        ],
      },
      ...diffJobs,
    },
  });

  return {
    fileName: `workflows/cdk-express-pipeline-diff${(requiresUniqueId || diffConfig.id) ? '-'+diffConfig.id! : '' }.yml`,
    content: workflowContent,
  };
}

function deployWorkflow(deployConfig: DeployWorkflowConfig, waves: IExpressWave[],
  requiresUniqueId: boolean): GithubWorkflowFile {

  function formatWaveJobId(wave: IExpressWave, commandKey: string): string {
    return `deploy__${commandKey}__${wave.id}`;
  }
  function formatStageJobId(stage: IExpressStage, commandKey: string): string {
    return `deploy__${commandKey}___${stage.wave.id}${stage.wave.separator}${stage.id}`;
  }
  function formatStackJobId(stack: IExpressStack, commandKey: string): string {
    return `deploy__${commandKey}___${stack.id}`;
  }

  const deployJobs = {};
  for (let command of deployConfig.commands) {
    const commandKey = Object.keys(command)[0];
    const commandValue = command[commandKey];
    if (!commandValue.includes('{stackSelector}')) {
      throw new Error(`Command for deploy workflow must include {stackSelector} placeholder, provided: ${commandValue}`);
    }

    // Handle different deployment strategies based on stackSelector
    if (deployConfig.stackSelector === 'wave') {
      for (let w = 0; w < waves.length; w++) {
        const wave = waves[w];
        const waveJobId = formatWaveJobId(wave, commandKey);

        const needs: string[] = ['build'];
        if ( w > 0) {
          const previousWaveJobId = formatWaveJobId(waves[w - 1], commandKey);
          needs.push(previousWaveJobId);
        }

        // @ts-ignore
        deployJobs[waveJobId] = {
          'name': `[${commandKey}] 🌊 ${wave.id}`,
          'needs': needs,
          'runs-on': 'ubuntu-latest',
          'permissions': {
            'actions': 'write',
            'contents': 'write',
            'id-token': 'write',
          },
          'steps': [
            checkoutRepoStep(),
            {
              name: 'Run CDK Express Pipeline Deploy',
              uses: './.github/actions/cdk-express-pipeline-deploy',
              with: {
                'stack-selector-patterns': `${wave.id}${wave.separator}*`,
                'cloud-assembly-directory': extractAppArgument(commandValue) || 'cdk.out',
                'command': commandValue.replace('{stackSelector}', `${wave.id}${wave.separator}*`),
                'assume-role-arn': deployConfig.assumeRoleArn,
                'assume-region': deployConfig.assumeRegion,
              },
            },
          ],
        };
      }
    } else if (deployConfig.stackSelector === 'stage') {

      for (let w = 0; w < waves.length; w++) {
        const wave = waves[w];

        for (let s = 0; s < wave.stages.length; s++) {
          const stage = wave.stages[s];

          const stageJobId = formatStageJobId(stage, commandKey);

          const needs: string[] = ['build'];
          if (w > 0) {
            // Each stage job in this wave needs to depend on the previous wave's stage jobs
            for (const sPrev of waves[w - 1].stages) {
              needs.push(formatStageJobId(sPrev, commandKey));
            }
          }

          if (wave.sequentialStages && s > 0) {
            // Each stage job needs to depend on the previous stage job in the same wave
            const previousStageJobId = formatStageJobId(wave.stages[s - 1], commandKey);
            needs.push(previousStageJobId);
          }

          // @ts-ignore
          deployJobs[stageJobId] = {
            'name': `[${commandKey}] 🏗 ${wave.id}${wave.separator}${stage.id}`,
            'needs': needs,
            'runs-on': 'ubuntu-latest',
            'permissions': {
              'actions': 'write',
              'contents': 'write',
              'id-token': 'write',
            },
            'steps': [
              checkoutRepoStep(),
              {
                name: 'Run CDK Express Pipeline Deploy',
                uses: './.github/actions/cdk-express-pipeline-deploy',
                with: {
                  'stack-selector-patterns': `${wave.id}${wave.separator}${stage.id}${wave.separator}*`,
                  'cloud-assembly-directory': extractAppArgument(commandValue) || 'cdk.out',
                  'command': commandValue.replace('{stackSelector}', `${wave.id}${wave.separator}${stage.id}${wave.separator}*`),
                  'assume-role-arn': deployConfig.assumeRoleArn,
                  'assume-region': deployConfig.assumeRegion,
                },
              },
            ],
          };
        }
      }

    } else if (deployConfig.stackSelector === 'stack') {

      for (let w = 0; w < waves.length; w++) {
        const wave = waves[w];

        for (let s = 0; s < wave.stages.length; s++) {
          const stage = wave.stages[s];

          for (let st = 0; st < stage.stacks.length; st++) {
            const stack = stage.stacks[st];

            const stackJobId = formatStackJobId(stack, commandKey);

            const needs: string[] = ['build'];
            if (w > 0) {
              // Each stack job in this wave needs to depend on the previous wave's stack jobs
              for (const sPrev of waves[w - 1].stages) {
                for (const stPrev of sPrev.stacks) {
                  needs.push(formatStackJobId(stPrev, commandKey));
                }
              }
            }

            if (wave.sequentialStages && s > 0) {
              // Each stack job needs to depend on the previous stage's stack jobs in the same wave
              for (const stPrev of wave.stages[s - 1].stacks) {
                needs.push(formatStackJobId(stPrev, commandKey));
              }
            }

            // @ts-ignore
            deployJobs[stackJobId] = {
              'name': `[${commandKey}] 📦 ${stack.id}`,
              'needs': needs,
              'runs-on': 'ubuntu-latest',
              'permissions': {
                'actions': 'write',
                'contents': 'write',
                'id-token': 'write',
              },
              'steps': [
                checkoutRepoStep(),
                {
                  name: 'Run CDK Express Pipeline Deploy',
                  uses: './.github/actions/cdk-express-pipeline-deploy',
                  with: {
                    'stack-selector-patterns': stack.id,
                    'cloud-assembly-directory': extractAppArgument(commandValue) || 'cdk.out',
                    'command': commandValue.replace('{stackSelector}', stack.id),
                    'assume-role-arn': deployConfig.assumeRoleArn,
                    'assume-region': deployConfig.assumeRegion,
                  },
                },
              ],
            };
          }
        }
      }

    }
  }

  const workflowContent = new GithubWorkflow({
    name: `CDK Express Pipeline Deploy${(requiresUniqueId || deployConfig.id) ? ' - '+ capitalizeFirstLetter(deployConfig.id!) : '' }`,
    concurrency: {
      'group': `cdk-express-pipeline-deploy${(requiresUniqueId || deployConfig.id) ? '-'+deployConfig.id! : '' }`,
      'cancel-in-progress': false,
    },
    on: formatWorkflowTriggers(deployConfig.on),
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        'name': 'Build and Synth',
        'steps': [
          checkoutRepoStep(),
          {
            name: 'Run CDK Express Pipeline Synth',
            uses: './.github/actions/cdk-express-pipeline-synth',
          },
        ],
      },
      ...deployJobs,
    },
  });

  return {
    fileName: `workflows/cdk-express-pipeline-deploy${(requiresUniqueId || deployConfig.id) ? '-'+deployConfig.id! : '' }.yml`,
    content: workflowContent,
  };
}

