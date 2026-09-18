import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

const opts = { from: 'generic', to: 'github' } as const;

describe('citations rule', () => {
  it('strips ChatGPT browsing markers', () => {
    const out = convert('根据公开资料【1†source】，结论成立。', opts);
    expect(out).not.toContain('【');
    expect(out).toContain('根据公开资料，结论成立。');
  });

  it('strips variant markers with line ranges', () => {
    const out = convert('数据见【4:2†L15-L20】。', opts);
    expect(out).not.toContain('【');
  });

  it('strips sentence-adjacent bare [n] markers', () => {
    const out = convert('This is a fact [3]. And another [12]；next line.', opts);
    expect(out).not.toMatch(/\[\d+\]/);
  });

  it('never strips array indexing or links', () => {
    const md = '数组取值 a[1] 和 [链接](https://example.com) 与定义式 [1]: http://x';
    const out = convert(md, opts);
    // Literal brackets in text are serializer-escaped (a\[1]) but content is intact.
    expect(out.replace(/\\(\[|\])/g, '$1')).toContain('a[1]');
    expect(out).toContain('[链接](https://example.com)');
  });

  it('keeps plain 【】 brackets that are not citations', () => {
    const out = convert('这是一段【重点标注】的正文。', opts);
    expect(out).toContain('【重点标注】');
  });

  it('footnote mode converts markers to footnotes with definitions', () => {
    const out = convert('依据【2†OpenAI docs】得出。', {
      ...opts,
      rules: { citations: 'footnote' },
    });
    expect(out).toContain('[^2]');
    expect(out).toContain('[^2]: OpenAI docs');
  });
});
