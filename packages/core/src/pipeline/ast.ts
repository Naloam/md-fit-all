import type { Root } from 'mdast';
import type { RuleConfig } from '../types.js';
import { headingsRule } from '../rules/headings.js';
import { codeFenceRule } from '../rules/code-fence.js';
import { calloutsRule } from '../rules/callouts.js';
import { wikilinksRule } from '../rules/wikilinks.js';
import { wikiLinkifyRule } from '../rules/wiki-linkify.js';
import { calloutizeRule } from '../rules/calloutize.js';
import { emphasisFixRule } from '../rules/emphasis-fix.js';
import { cjkSpacingRule } from '../rules/cjk-spacing.js';

/**
 * AST-level rule contract. Rules mutate/transform the mdast tree in place.
 * Working on the AST (instead of strings) is what makes structure-aware fixes
 * (headings, lists, emphasis boundaries) reliable.
 */
export interface AstRule {
  name: string;
  description: string;
  when: (rules: RuleConfig) => boolean;
  apply: (tree: Root, rules: RuleConfig) => void;
}

/** Order: structure first, then reverse-direction rules, then inline text fixes. */
export const AST_RULES: AstRule[] = [
  headingsRule,
  codeFenceRule,
  calloutsRule,
  wikilinksRule,
  wikiLinkifyRule,
  calloutizeRule,
  emphasisFixRule,
  cjkSpacingRule,
];

export function runAstRules(tree: Root, rules: RuleConfig): void {
  for (const rule of AST_RULES.filter((rule) => rule.when(rules))) {
    rule.apply(tree, rules);
  }
}
