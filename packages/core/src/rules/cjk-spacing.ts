import { visit } from 'unist-util-visit';
import type { Root, Text } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';

/**
 * cjkSpacing: normalize a single space between Han characters and Latin
 * letters/digits (中文abc → 中文 abc). Runs on text nodes only, so code,
 * inline code and math are structurally excluded.
 */

const HAN = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const CJK_BEFORE_LATIN = new RegExp(`([${HAN}])([A-Za-z0-9])`, 'g');
const LATIN_BEFORE_CJK = new RegExp(`([A-Za-z0-9])([${HAN}])`, 'g');

export const cjkSpacingRule: AstRule = {
  name: 'cjkSpacing',
  description: 'Normalize a single space between Han characters and Latin letters/digits.',
  when: (rules) => rules.cjkSpacing,
  apply: (tree: Root): void => {
    visit(tree, 'text', (node: Text) => {
      if (!/[\u3400-\u9fff\uf900-\ufaff]/.test(node.value)) return;
      let out = node.value.replace(CJK_BEFORE_LATIN, '$1 $2');
      out = out.replace(LATIN_BEFORE_CJK, '$1 $2');
      node.value = out;
    });
  },
};
