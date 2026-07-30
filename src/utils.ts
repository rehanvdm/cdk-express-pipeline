/**
 * Returns the pattern to filter stacks based on the CDK context.
 */
export function getStackPatternToFilter() {
  const cdkContextJson = JSON.parse(process.env.CDK_CONTEXT_JSON || '{}');
  let bundlingStacks: string | undefined = cdkContextJson['aws:cdk:bundling-stacks'];
  if (bundlingStacks && Array.isArray(bundlingStacks) && bundlingStacks.length > 1) {
    throw new Error('Multiple stacks patterns are not supported');
  }

  const stacksPattern = bundlingStacks ? bundlingStacks[0] : undefined;
  if (stacksPattern === '**') {
    return undefined;
  }
  return stacksPattern;
}

/**
 * Test whether a string matches a glob pattern (supports `*` as wildcard).
 * @param pattern
 * @param str
 */
function globMatch(pattern: string, str: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${regexStr}$`).test(str);
}

/**
 * Check if the CDK stack identifier matches the wave/stage/stack
 * @param patternToFilter
 * @param identifier
 * @param isLeaf Whether the identifier is a leaf node (stack), not a parent (wave/stage)
 */
export function targetIdentifier(patternToFilter: string | undefined, identifier: string, isLeaf: boolean = false): boolean {
  if (patternToFilter === undefined) return true;

  // For leaf nodes (stacks): use exact glob match only
  if (isLeaf) {
    return globMatch(patternToFilter, identifier);
  }

  // For parent nodes (waves/stages): use glob match OR parent prefix check
  if (globMatch(patternToFilter, identifier)) return true;

  // Check if the identifier could be a parent of something matching the pattern.
  // Use the literal prefix of the pattern (the part before the first wildcard) for comparison.
  const literalPrefix = patternToFilter.split('*')[0];
  return literalPrefix.startsWith(identifier) || (literalPrefix.length > 0 && identifier.startsWith(literalPrefix));
}