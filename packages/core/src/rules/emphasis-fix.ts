import { visit } from 'unist-util-visit';
import type { PhrasingContent, Root } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';
import { spliceTextSegments, textNode } from '../pipeline/inline-nodes.js';

/**
 * emphasisFix: safety net for `**bold**` that failed to parse and therefore
 * survived as literal asterisks in a text node. The common leftover shape is
 * inner-edge whitespace (`** 加粗 **`), which CommonMark can never parse as
 * emphasis. We rebuild it as a real strong node with trimmed content (node
 * construction, because `**` written into a text node would get escaped).
 *
 * Note: intraword asterisk emphasis (`a**b**c`) *does* parse in CommonMark,
 * so CJK-adjacent bold needs no fix here — that was a `_`/legacy-renderer
 * problem, not an asterisk one.
 */

const UNPARSED_BOLD_RE = /\*\*([^*\n]+)\*\*/g;

export const emphasisFixRule: AstRule = {
  name: 'emphasisFix',
  description: 'Rebuild **bold** that failed to parse (e.g. `** 加粗 **`) as real strong nodes.',
  when: (rules) => rules.emphasisFix,
  apply: (tree: Root): void => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value.includes('**')) return;

      const segments: PhrasingContent[] = [];
      let last = 0;
      let changed = false;

      for (const m of node.value.matchAll(UNPARSED_BOLD_RE)) {
        const whole = m[0] ?? '';
        const body = m[1] ?? '';
        if (body === body.trim()) continue; // parseable shape — leave alone
        changed = true;
        const start = m.index ?? 0;
        if (start > last) segments.push(textNode(node.value.slice(last, start)));
        const trimmed = body.trim();
        if (trimmed.length > 0) {
          segments.push({ type: 'strong', children: [textNode(trimmed)] });
        } else {
          segments.push(textNode(whole));
        }
        last = start + whole.length;
      }

      if (!changed) return;
      if (last < node.value.length) segments.push(textNode(node.value.slice(last)));
      spliceTextSegments(parent, index, segments);
    });
  },
};
