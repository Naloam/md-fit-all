import { visit } from 'unist-util-visit';
import type { PhrasingContent, Root } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';
import { spliceTextSegments, textNode } from '../pipeline/inline-nodes.js';

/**
 * wikilinks: convert Obsidian `[[wiki links]]` to standard Markdown links
 * (used for github/typora/commonmark targets).
 *
 *   [[Note]]        → [Note](Note.md)
 *   [[Note|别名]]   → [别名](Note.md)
 *   [[Note#章节]]   → [Note#章节](Note.md#章节)  (spaces URL-encoded)
 *   ![[image.png]]  → ![](image.png)
 *
 * We construct real link/image AST nodes — writing markdown syntax into text
 * nodes would get escaped on serialization.
 */

const WIKI_ANY_RE = /(!?)\[\[([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]*))?\]\]/g;

function encodePath(p: string): string {
  return p.trim().replaceAll(' ', '%20');
}

function toTarget(path: string, heading?: string): string {
  const trimmed = path.trim();
  const withExt = /\.[A-Za-z0-9]+$/.test(trimmed) ? trimmed : `${trimmed}.md`;
  const base = encodePath(withExt);
  return heading ? `${base}#${encodePath(heading)}` : base;
}

export const wikilinksRule: AstRule = {
  name: 'wikilinks',
  description: 'Convert [[wiki links]] to standard Markdown links with .md targets.',
  when: (rules) => rules.wikilinks === 'markdown',
  apply: (tree: Root): void => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value.includes('[[')) return;

      const segments: PhrasingContent[] = [];
      let last = 0;
      let changed = false;

      for (const m of node.value.matchAll(WIKI_ANY_RE)) {
        const whole = m[0];
        const bang = m[1] ?? '';
        const path = m[2];
        const heading = m[3];
        const alias = m[4];
        if (whole === undefined || path === undefined) continue;
        if (path.includes('[') || path.includes(']')) continue;
        changed = true;
        const start = m.index ?? 0;
        if (start > last) segments.push(textNode(node.value.slice(last, start)));

        if (bang === '!') {
          segments.push({
            type: 'image',
            url: encodePath(path),
            alt: alias && alias.trim().length > 0 ? alias.trim() : '',
          });
        } else {
          const label =
            alias && alias.trim().length > 0
              ? alias.trim()
              : heading && heading.trim().length > 0
                ? `${path.trim()}#${heading.trim()}`
                : path.trim();
          segments.push({
            type: 'link',
            url: toTarget(path, heading),
            children: [textNode(label)],
          });
        }
        last = start + whole.length;
      }

      if (!changed) return;
      if (last < node.value.length) segments.push(textNode(node.value.slice(last)));
      spliceTextSegments(parent, index, segments);
    });
  },
};
