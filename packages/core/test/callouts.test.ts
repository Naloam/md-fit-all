import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

describe('callouts rule', () => {
  it('converts titled callouts to bold-title blockquote for non-obsidian targets', () => {
    const md = '> [!tip] 小贴士\n> 内容行';
    const out = convert(md, { from: 'generic', to: 'github' });
    expect(out).toContain('> **小贴士**');
    expect(out).not.toContain('[!tip]');
  });

  it('uses capitalized type when callout has no title', () => {
    const out = convert('> [!note]\n> 内容', { from: 'generic', to: 'typora' });
    expect(out).toContain('> **Note**');
  });

  it('keeps callouts for obsidian target', () => {
    const md = '> [!note] 标题\n> 内容';
    const out = convert(md, { from: 'generic', to: 'obsidian' });
    expect(out).toContain('[!note] 标题');
  });
});
