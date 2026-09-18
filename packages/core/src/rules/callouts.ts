import { visit } from 'unist-util-visit';
import type { Blockquote, Paragraph, Root, Strong } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';

/**
 * callouts: when the target is not Obsidian, `> [!note] Title` callouts are
 * rewritten as a plain blockquote whose first line is a bold title:
 *
 *   > [!tip] 小贴士   →   > **小贴士**
 *   > [!note]         →   > **Note**
 *
 * The title is real AST (a strong node), because `**` written into a text
 * node would be escaped on serialization.
 */

const CALLOUT_MARKER_RE = /^\[!([\w-]+)\][+-]?[ \t]*/;

function isParagraph(node: Blockquote['children'][number] | undefined): node is Paragraph {
  return node?.type === 'paragraph';
}

export const calloutsRule: AstRule = {
  name: 'callouts',
  description: 'Rewrite Obsidian > [!note] Title callouts as plain blockquotes with a bold title.',
  when: (rules) => rules.callouts === 'blockquote',
  apply: (tree: Root): void => {
    visit(tree, 'blockquote', (bq: Blockquote) => {
      const first = bq.children[0];
      if (!isParagraph(first)) return;
      const firstInline = first.children[0];
      if (firstInline?.type !== 'text') return;

      const match = CALLOUT_MARKER_RE.exec(firstInline.value);
      if (!match) return;

      const afterMarker = firstInline.value.slice(match[0].length);
      const nlIdx = afterMarker.indexOf('\n');
      const title = (nlIdx === -1 ? afterMarker : afterMarker.slice(0, nlIdx)).trim();
      const remainder = nlIdx === -1 ? '' : afterMarker.slice(nlIdx);

      const type = match[1] ?? '';
      const label = title.length > 0 ? title : type.charAt(0).toUpperCase() + type.slice(1);

      const strong: Strong = { type: 'strong', children: [{ type: 'text', value: label }] };
      const restChildren = first.children.slice(1);
      first.children =
        remainder.trim().length > 0
          ? [strong, { type: 'text', value: remainder }, ...restChildren]
          : [strong, ...restChildren];
    });
  },
};
