import { visit } from 'unist-util-visit';
import type { Code, Root } from 'mdast';
import type { AstRule } from '../pipeline/ast.js';

/**
 * codeFence: normalize code block language tags.
 * `text`/`plaintext` carry no highlighting → dropped. Common short aliases
 * map to canonical names. Everything lowercased. No-op on already-clean tags
 * (idempotent).
 */
const LANG_ALIASES: Record<string, string | null> = {
  text: null,
  plaintext: null,
  plain: null,
  txt: null,
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  py: 'python',
  'c++': 'cpp',
  yml: 'yaml',
  md: 'markdown',
  golang: 'go',
};

export const codeFenceRule: AstRule = {
  name: 'codeFence',
  description: 'Normalize code fence language tags (drop text/plaintext, canonicalize aliases).',
  when: (rules) => rules.codeFence === 'normalize',
  apply: (tree: Root): void => {
    visit(tree, 'code', (node: Code) => {
      const raw = (node.lang ?? '').trim();
      if (raw === '') {
        node.lang = undefined;
        return;
      }
      const lower = raw.toLowerCase();
      const mapped = LANG_ALIASES[lower];
      node.lang = mapped === undefined ? lower : (mapped ?? undefined);
    });
  },
};
