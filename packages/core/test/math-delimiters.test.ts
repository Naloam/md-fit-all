import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

const opts = { from: 'generic', to: 'github' } as const;

describe('mathDelimiters rule', () => {
  it('converts inline \\(..\\) to $..$', () => {
    const out = convert('值是 \\(x^2 + y^2\\)，其中 y 为常数。', opts);
    expect(out).toContain('$x^2 + y^2$');
    expect(out).not.toContain('\\(');
  });

  it('converts display \\[..\\] to block $$ math', () => {
    const out = convert('推导结果：\n\\[E = mc^2\\]\n完毕', opts);
    expect(out).toContain('$$\nE = mc^2\n$$');
    expect(out).not.toContain('\\[');
  });

  it('never touches LaTeX delimiters inside code blocks', () => {
    const md = '说明：\n\n```latex\n\\(x^2\\)\n```\n';
    expect(convert(md, opts)).toContain('\\(x^2\\)');
  });

  it('keeps prose that merely mentions the delimiters', () => {
    const md = '在 LaTeX 中，\\( 和 \\) 是行内公式定界符。';
    const out = convert(md, opts);
    // Not turned into math…
    expect(out).not.toContain('$');
    // …the backslashes are consumed as markdown escapes, rendering the same.
    expect(out).toContain('( 和 )');
  });

  it('wraps bare align environments in $$', () => {
    const md = '推导：\n\\begin{align}\na &= b \\\\\nc &= d\n\\end{align}\n结束';
    const out = convert(md, opts);
    expect(out).toContain('$$');
    expect(out).toContain('\\begin{align}');
    expect(out).toContain('\\end{align}');
  });

  it('is idempotent', () => {
    const md =
      '公式 \\(\\frac{a}{b}\\) 与\n\\[\\int_0^1 x dx\\]\n以及 \\begin{align}\na = b\n\\end{align}';
    const once = convert(md, opts);
    const twice = convert(once, opts);
    expect(twice).toBe(once);
  });

  it('preserves existing math through the round trip', () => {
    // Inline `$$..$$` inside a paragraph is inline math in remark-math; the
    // round trip normalizes it to single dollars — same rendering, value intact.
    expect(convert('已有 $$E=mc^2$$ 公式', opts)).toContain('$E=mc^2$');
  });
});
