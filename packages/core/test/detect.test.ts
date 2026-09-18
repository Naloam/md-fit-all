import { describe, expect, it } from 'vitest';
import { detect } from '../src/detect.js';

describe('detect (source auto-detection)', () => {
  it('identifies ChatGPT output with paren math and citations', () => {
    const md = '### 结论\n\n能量满足 \\(E = mc^2\\) 关系【1†source】。';
    const d = detect(md);
    expect(d.source).toBe('chatgpt');
    expect(d.confidence).toBeGreaterThanOrEqual(0.6);
    expect(d.signals.length).toBeGreaterThanOrEqual(2);
  });

  it('identifies Claude-flavored output by mentions', () => {
    const md = '作为 Claude，我建议 \\(\\frac{a}{b}\\) 这样处理。';
    const d = detect(md);
    expect(d.source).toBe('claude');
  });

  it('falls back to generic for plain notes', () => {
    const d = detect('# 我的笔记\n\n普通内容，没有公式。');
    expect(d.source).toBe('generic');
  });

  it('ignores LaTeX inside code blocks', () => {
    const md = '说明\n\n```latex\n\\(x^2\\) \\frac{a}{b}\n```\n结束';
    const d = detect(md);
    expect(d.source).toBe('generic');
  });

  it('detects copy-button chrome', () => {
    const d = detect('代码如下：\n\nCopy code\n\n说明');
    expect(d.source).toBe('chatgpt');
    expect(d.signals.some((s) => s.includes('copy-button'))).toBe(true);
  });
});
