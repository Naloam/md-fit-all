import { visit } from 'unist-util-visit';
import type { Blockquote, Paragraph, Parent, Root, Text } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';

/**
 * calloutize (reverse direction, obsidian targets): a paragraph that opens
 * with a bold label — `**Note:** text`, `**警告：** 内容` — becomes an
 * Obsidian callout:
 *
 *   **Note:** text        →  > [!note] text
 *   > **提示：** 说明      →  > [!tip] 说明   (marker fixed in place)
 */

const LABELS: Record<string, string> = {
  note: 'note',
  info: 'info',
  tip: 'tip',
  hint: 'tip',
  important: 'important',
  warning: 'warning',
  caution: 'warning',
  danger: 'danger',
  attention: 'warning',
  abstract: 'abstract',
  summary: 'abstract',
  tldr: 'abstract',
  success: 'success',
  check: 'success',
  question: 'question',
  faq: 'question',
  failure: 'failure',
  fail: 'failure',
  bug: 'bug',
  example: 'example',
  quote: 'quote',
  cite: 'quote',
  注: 'note',
  说明: 'note',
  提示: 'tip',
  注意: 'warning',
  警告: 'warning',
  重要: 'important',
  危险: 'danger',
  摘要: 'abstract',
};

function calloutType(label: string): string | undefined {
  const cleaned = label
    .trim()
    .replace(/[：:]+$/, '')
    .trim();
  if (cleaned.length === 0) return undefined;
  return LABELS[cleaned.toLowerCase()] ?? LABELS[cleaned];
}

function inlineText(node: { children: Array<{ type: string; value?: string }> }): string | null {
  let out = '';
  for (const child of node.children) {
    if (child.type !== 'text') return null;
    out += child.value ?? '';
  }
  return out;
}

export const calloutizeRule: AstRule = {
  name: 'calloutize',
  description: 'Turn **Note:**-style bold-label paragraphs into Obsidian callouts.',
  when: (rules) => rules.calloutize,
  apply: (tree: Root): void => {
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      const container = parent as Parent | undefined;
      if (!container || (container.type !== 'root' && container.type !== 'blockquote')) return;

      const first = node.children[0];
      if (!first || first.type !== 'strong') return;
      const labelText = inlineText(first);
      if (labelText === null) return;
      const type = calloutType(labelText);
      if (!type) return;

      // Inline content after the label; strip its leading colon/space.
      const rest = node.children.slice(1);
      if (rest.length > 0 && rest[0]?.type === 'text') {
        const value = (rest[0].value ?? '').replace(/^[ \t：:]+/, '');
        rest[0] = { ...rest[0], value };
      }

      const marker: Text = { type: 'text', value: `[!${type}] ` };
      const body = rest.filter((n) => n.type !== 'text' || (n.value ?? '') !== '') as Array<
        Text | (typeof rest)[number]
      >;

      if (container.type === 'blockquote' && container.children[0] === node) {
        // `> **Note:** x` — rewrite the marker in place, no extra nesting.
        node.children = [marker, ...body];
        return;
      }

      const callout: Blockquote = {
        type: 'blockquote',
        children: [{ type: 'paragraph', children: [marker, ...body] }],
      };
      container.children.splice(index ?? 0, 1, callout);
    });
  },
};
