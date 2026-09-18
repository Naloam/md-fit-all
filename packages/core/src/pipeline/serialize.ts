import type { Options } from 'remark-stringify';
import type { RuleConfig } from '../types.js';

/** Map effective rules onto remark-stringify style options. */
export function stringifyOptions(rules: RuleConfig): Options {
  return {
    bullet: rules.bullet,
    emphasis: rules.emphasis,
    strong: rules.emphasis,
    listItemIndent: 'one',
    fence: '`',
    fences: true,
    rule: '-',
    ruleSpaces: false,
  };
}
