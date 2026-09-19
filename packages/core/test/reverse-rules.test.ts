import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

describe('calloutize rule (obsidian target)', () => {
  it('turns a bold-label paragraph into a callout', () => {
    const out = convert('**Note:** remember to back up.', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('> [!note] remember to back up.');
  });

  it('recognizes CJK labels', () => {
    const out = convert('**警告：** 操作不可逆。', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('> [!warning] 操作不可逆。');
  });

  it('fixes the marker inside an existing blockquote without nesting', () => {
    const out = convert('> **Tip:** 用 git mv 保留历史。', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('> [!tip] 用 git mv 保留历史。');
    expect(out).not.toContain('> >');
  });

  it('keeps bold text that is not a known label', () => {
    const out = convert('**重点**内容不是标记。', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('**重点**');
  });

  it('is off for non-obsidian targets', () => {
    const out = convert('**Note:** keep me plain.', { from: 'generic', to: 'github' });
    expect(out).toContain('**Note:**');
    expect(out).not.toContain('[!note]');
  });
});

describe('wikiLinkify rule (obsidian target)', () => {
  it('converts plain relative .md links', () => {
    const out = convert('参见[项目笔记](项目笔记.md)。', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('[[项目笔记]]');
  });

  it('keeps alias, decodes spaces and headings', () => {
    const out = convert('见[别名](my%20note.md#section%20one)。', {
      from: 'generic',
      to: 'obsidian',
    });
    expect(out).toContain('[[my note#section one|别名]]');
  });

  it('converts local images to embeds', () => {
    const out = convert('图：![说明](diagram.png)', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('![[diagram.png]]');
  });

  it('never touches external links', () => {
    const md = '看[官网](https://example.com)和[邮箱](mailto:a@b.c)。';
    const out = convert(md, { from: 'generic', to: 'obsidian' });
    expect(out).toContain('[官网](https://example.com)');
    expect(out).toContain('[邮箱](mailto:a@b.c)');
  });

  it('is off for non-obsidian targets', () => {
    const out = convert('见[笔记](笔记.md)', { from: 'generic', to: 'github' });
    expect(out).toContain('[笔记](笔记.md)');
  });

  it('is idempotent', () => {
    const once = convert('见[笔记](笔记.md)与![x](i.png)', { from: 'generic', to: 'obsidian' });
    expect(convert(once, { from: 'generic', to: 'obsidian' })).toBe(once);
  });
});

describe('custom profile layer', () => {
  it('layers between target style and rule overrides', () => {
    const out = convert('**Note:** x 与 [n](n.md)', {
      from: 'generic',
      to: 'obsidian',
      profile: { calloutize: false },
    });
    expect(out).toContain('**Note:**'); // profile disabled the rule
    expect(out).toContain('[[n]]'); // other obsidian behavior intact
  });
});

describe('table alignment', () => {
  it('pads GFM table columns to equal width', () => {
    const out = convert('| a | 超长列名 |\n| --- | --- |\n| 1 | x |\n', {
      from: 'generic',
      to: 'obsidian',
    });
    const lines = out.split('\n').filter((l) => l.startsWith('|'));
    const widths = new Set(lines.map((l) => l.length));
    expect(widths.size).toBe(1);
  });
});
