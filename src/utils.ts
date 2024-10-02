import { DeploymentStatus } from './cli/manifest';
import { RollbackStatus } from './cli/rollback';
import { ExpressStack } from './express-stack';
import { ExpressStage } from './express-stage';

/* ================================= Printing Waves ============================== */
export function getStackPatternToFilter() {
  const cdkContextJson = JSON.parse(process.env.CDK_CONTEXT_JSON || '{}');
  let bundlingStacks: string | undefined = cdkContextJson['aws:cdk:bundling-stacks'];
  if (bundlingStacks && Array.isArray(bundlingStacks) && bundlingStacks.length > 1) {
    throw new Error('Multiple stacks patterns are not supported');
  }

  let stacksPattern = bundlingStacks ? bundlingStacks[0] : undefined;
  let patternToFilter: string | undefined;
  if (stacksPattern == '**') {
    patternToFilter = undefined;
  } else if (stacksPattern && stacksPattern.length > 2 && stacksPattern.endsWith('*')) {
    patternToFilter = stacksPattern.slice(0, -1);
  } else {
    patternToFilter = stacksPattern;
  }
  return patternToFilter;
}

/**
 * Check if the CDK stack identifier matches the wave/stage/stack
 * @param patternToFilter
 * @param identifier
 */
export function targetIdentifier(patternToFilter: string | undefined, identifier: string): boolean {
  return patternToFilter === undefined || patternToFilter.startsWith(identifier) || identifier.startsWith(patternToFilter);
}

export function printStackDependencies(stage: ExpressStage, stack: ExpressStack, indentationLevel: number, targetCharacter: string) {
  if (stack.stage !== stage) {
    return;
  }
  console.log(`${targetCharacter} ${' '.repeat(indentationLevel)} ↳ ${stack.stackName}`);

  stack.expressDependencies().forEach(dependantStack => {
    printStackDependencies(stage, dependantStack, indentationLevel + 1, targetCharacter);
  });
}

/* =================================================================================== */

export type DeploymentOrderStack = {
  id: string;
  stackName: string;
  dependencies: DeploymentOrderStack[];
  deployStatus?: DeploymentStatus;
  rollbackStatus?: RollbackStatus;
}
export type DeploymentOrderStage = {
  id: string;
  stacks: DeploymentOrderStack[];
}
export type DeploymentOrderWave = {
  id: string;
  stages: DeploymentOrderStage[];
  separator: string;
}