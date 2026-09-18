import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

const opts = { from: 'generic', to: 'github' } as const;

describe('emphasisFix rule', () => {
  it('rebuilds bold broken by inner-edge whitespace as real strong nodes', () => {
    // `** 加粗 **` can never parse as emphasis in CommonMark.
    const out = convert('这有** 加粗 **尾巴', { ...opts, rules: { cjkSpacing: false } });
    expect(out).toContain('**加粗**');
    expect(out).not.toContain('** 加粗 **');
  });

  it('keeps multiple leftovers and surrounding text intact', () => {
    const out = convert('前** 甲 **尾\n\n第二段** 乙 **完', opts);
    expect(out).toContain('前**甲**尾');
    expect(out).toContain('第二段**乙**完');
  });

  it('leaves already-parsed bold alone', () => {
    const out = convert('这很 **重要** 明显，且 a**词内**b 也可解析', opts);
    expect(out).toContain('**重要**');
    expect(out).toContain('**词内**');
  });

  it('is idempotent', () => {
    const once = convert('x** 加粗 **y', opts);
    const twice = convert(once, opts);
    expect(twice).toBe(once);
  });
});
