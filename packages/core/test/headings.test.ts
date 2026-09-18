import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

describe('headings rule', () => {
  it('promotes ### to # and keeps relative depth', () => {
    const md = '### 标题\n\n正文\n\n#### 子标题\n\n##### 孙标题';
    const out = convert(md, { from: 'chatgpt', to: 'obsidian' });
    expect(out).toContain('# 标题');
    expect(out).toContain('## 子标题');
    expect(out).toContain('### 孙标题');
  });

  it('does nothing when headings already start at #', () => {
    const md = '# Title\n\n## Sub';
    expect(convert(md, { from: 'chatgpt', to: 'obsidian' })).toBe(md + '\n');
  });

  it('can be disabled via override', () => {
    const md = '### 深层标题';
    const out = convert(md, {
      from: 'chatgpt',
      to: 'obsidian',
      rules: { headings: 'keep' },
    });
    expect(out).toContain('### 深层标题');
  });
});
