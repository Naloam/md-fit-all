import type { RuleConfig } from '../types.js';
import { artifactsRule } from '../rules/artifacts.js';
import { mathDelimitersRule, wrapLatexEnvRule } from '../rules/math-delimiters.js';
import { citationsRule } from '../rules/citations.js';

/**
 * String-level rule contract. `apply` receives the whole document and must do
 * its own regex work through `protectedTransform`.
 */
export interface PreRule {
  name: string;
  description: string;
  when: (rules: RuleConfig) => boolean;
  apply: (md: string, rules: RuleConfig) => string;
}

/**
 * Ordered: noise first, then math (so math never sees citation markers and
 * freshly created $$ blocks are protected for later passes).
 */
export const PRE_RULES: PreRule[] = [
  artifactsRule,
  mathDelimitersRule,
  wrapLatexEnvRule,
  citationsRule,
];

export function runPreRules(md: string, rules: RuleConfig): string {
  return PRE_RULES.filter((rule) => rule.when(rules)).reduce(
    (doc, rule) => rule.apply(doc, rules),
    md,
  );
}
