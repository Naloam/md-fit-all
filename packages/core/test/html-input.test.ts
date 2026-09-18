import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '../src/rules/html-input.js';

describe('htmlToMarkdown (clipboard HTML path)', () => {
  it('converts basic HTML structure', () => {
    const html = '<h2>标题</h2><p>段落 <strong>加粗</strong> 与 <em>斜体</em>。</p>';
    const out = htmlToMarkdown(html);
    expect(out).toContain('## 标题');
    expect(out).toContain('**加粗**');
    expect(out).toContain('*斜体*');
  });

  it('converts HTML tables to GFM tables', () => {
    const html =
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>';
    const out = htmlToMarkdown(html);
    expect(out).toContain('| A | B |');
    expect(out).toContain('| --- | --- |');
    expect(out).toContain('| 1 | 2 |');
  });

  it('recovers LaTeX from ChatGPT KaTeX spans (inline)', () => {
    const html =
      '<p>公式 <span class="katex"><span class="katex-mathml"><math><semantics><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">x^2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"></span></span> 完成</p>';
    const out = htmlToMarkdown(html);
    expect(out).toContain('$x^2$');
  });

  it('recovers LaTeX from KaTeX display math', () => {
    const html =
      '<p><span class="katex-display"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>E</mi></mrow><annotation encoding="application/x-tex">E = mc^2</annotation></semantics></math></span></span></span></p>';
    const out = htmlToMarkdown(html);
    expect(out).toContain('$$');
    expect(out).toContain('E = mc^2');
  });

  it('converts fenced code with language class', () => {
    const html = '<pre><code class="language-python">print(1)</code></pre>';
    const out = htmlToMarkdown(html);
    expect(out).toContain('```python');
    expect(out).toContain('print(1)');
  });
});
