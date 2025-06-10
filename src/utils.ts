/**
 * Returns the pattern to filter stacks based on the CDK context.
 */
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