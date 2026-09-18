import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

interface TexSourceHolder {
  querySelector?: (selector: string) => { textContent: string | null } | null;
}

interface MaybeClassList {
  classList?: { contains(cls: string): boolean };
}

function texOf(node: unknown): string {
  const holder = node as TexSourceHolder;
  const el = holder.querySelector?.('annotation[encoding="application/x-tex"]');
  return el?.textContent?.trim() ?? '';
}

function hasClass(node: { nodeName: string } & MaybeClassList, cls: string): boolean {
  return node.nodeName === 'SPAN' && node.classList?.contains(cls) === true;
}

/**
 * htmlToMarkdown: clipboard rich-text (text/html) → Markdown.
 *
 * Turndown with GFM support (tables, strikethrough, task lists), plus a rule
 * that recovers the exact LaTeX source from ChatGPT's KaTeX DOM — the
 * original TeX lives in <annotation encoding="application/x-tex">.
 */
export function htmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  td.use(gfm);

  td.addRule('katexDisplay', {
    filter: (node) => hasClass(node, 'katex-display'),
    replacement: (_content, node) => {
      const tex = texOf(node);
      return tex ? `\n\n$$\n${tex}\n$$\n\n` : '';
    },
  });

  td.addRule('katexInline', {
    filter: (node) => hasClass(node, 'katex'),
    replacement: (_content, node) => {
      const tex = texOf(node);
      return tex ? `$${tex}$` : '';
    },
  });

  return td.turndown(html);
}
