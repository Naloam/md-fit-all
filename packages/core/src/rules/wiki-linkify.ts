import { visit } from 'unist-util-visit';
import type { Image, Link, Parent, Root } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';
import { spliceTextSegments, textNode } from '../pipeline/inline-nodes.js';

/**
 * wikiLinkify (reverse direction, obsidian targets): local relative links
 * become wikilinks — the natural shape for note-to-note connections:
 *
 *   [笔记](笔记.md)          →  [[笔记]]
 *   [别名](笔记.md)          →  [[笔记|别名]]
 *   [x](folder/note.md#sec)  →  [[folder/note#sec|x]]
 *   ![alt](image.png)        →  ![[image.png]]
 *
 * External links (http/mailto/anchors) are left untouched. Markdown syntax
 * is written into a text node — the wiki-target finalize step unescapes `[[`.
 */

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function isLocalUrl(url: string): boolean {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return false; // scheme (http:, mailto:, data:…)
  if (url.startsWith('//')) return false;
  if (url.startsWith('#')) return false;
  return true;
}

function splitHash(url: string): { path: string; hash: string } {
  const idx = url.indexOf('#');
  if (idx === -1) return { path: url, hash: '' };
  return { path: url.slice(0, idx), hash: url.slice(idx + 1) };
}

function labelOf(node: Link | Image): string {
  if (node.type === 'image') return node.alt ?? '';
  let out = '';
  for (const child of node.children) {
    if (child.type === 'text') out += child.value ?? '';
    else return '\0'; // rich label — bail, keep the link
  }
  return out;
}

export const wikiLinkifyRule: AstRule = {
  name: 'wikiLinkify',
  description: 'Convert relative .md links and local images into [[wikilinks]].',
  when: (rules) => rules.wikiLinkify && rules.wikilinks === 'wiki',
  apply: (tree: Root): void => {
    visit(tree, 'link', (node: Link, index, parent) => {
      if (!parent || index === null) return;
      const url = node.url ?? '';
      if (!isLocalUrl(url)) return;

      const { path, hash } = splitHash(url);
      if (!/\.md$/i.test(path)) return; // only note links — assets keep md-link form

      const clean = decode(path.replace(/^\.\//, '')).replace(/\.md$/i, '');
      const heading = hash.length > 0 ? `#${decode(hash)}` : '';
      const name = `${clean}${heading}`;

      const label = labelOf(node);
      if (label === '\0') return;
      const wiki = label === name || label.length === 0 ? `[[${name}]]` : `[[${name}|${label}]]`;
      spliceTextSegments(parent as Parent | undefined, index, [textNode(wiki)]);
    });

    visit(tree, 'image', (node: Image, index, parent) => {
      if (!parent || index === null) return;
      const url = node.url ?? '';
      if (!isLocalUrl(url)) return;
      const name = decode(url);
      spliceTextSegments(parent as Parent | undefined, index, [textNode(`![[${name}]]`)]);
    });
  },
};
