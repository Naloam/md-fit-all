import { visit } from 'unist-util-visit';
import type { Heading, Root } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';

/**
 * headings: promote (or demote) so the shallowest heading becomes `#`,
 * preserving relative depth. ChatGPT replies typically start at `###`, which
 * lands three levels deep in notes for no reason.
 */
export const headingsRule: AstRule = {
  name: 'headings',
  description: 'Promote headings so the shallowest becomes # (keeps relative depth).',
  when: (rules) => rules.headings === 'top-level',
  apply: (tree: Root): void => {
    const depths: number[] = [];
    visit(tree, 'heading', (node: Heading) => depths.push(node.depth));
    if (depths.length === 0) return;

    const min = Math.min(...depths);
    if (min === 1) return;
    const shift = min - 1;
    visit(tree, 'heading', (node: Heading) => {
      node.depth = Math.max(1, Math.min(6, node.depth - shift)) as Heading['depth'];
    });
  },
};
