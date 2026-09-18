import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

describe('wikilinks rule', () => {
  it('converts plain wikilinks to .md links', () => {
    const out = convert('参见[[项目笔记]]的说明', { from: 'generic', to: 'github' });
    expect(out).toContain('[项目笔记](项目笔记.md)');
  });

  it('keeps alias as label', () => {
    const out = convert('见[[项目笔记|别名]]', { from: 'generic', to: 'github' });
    expect(out).toContain('[别名](项目笔记.md)');
  });

  it('handles heading links and encodes spaces', () => {
    const out = convert('见[[我的 笔记#章节 一]]', { from: 'generic', to: 'github' });
    expect(out).toContain('[我的 笔记#章节 一](我的%20笔记.md#章节%20一)');
  });

  it('converts embeds', () => {
    const out = convert('插图：![[image.png]]', { from: 'generic', to: 'github' });
    expect(out).toContain('![](image.png)');
  });

  it('keeps wikilinks for obsidian target', () => {
    const out = convert('参见[[项目笔记]]', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('[[项目笔记]]');
  });

  it('is idempotent', () => {
    const once = convert('见[[笔记]]和[[A|B]]', { from: 'generic', to: 'github' });
    expect(convert(once, { from: 'generic', to: 'github' })).toBe(once);
  });
});
