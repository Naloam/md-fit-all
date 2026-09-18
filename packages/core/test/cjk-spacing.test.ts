import { describe, expect, it } from 'vitest';
import { convert } from '../src/convert.js';

describe('cjkSpacing rule', () => {
  it('inserts space between Han and Latin/digits', () => {
    const out = convert('这里使用Python和JavaScript实现', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('使用 Python 和 JavaScript 实现');
  });

  it('inserts space between digits and Han', () => {
    const out = convert('增长了35%，共120个', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('增长了 35%，共 120 个');
  });

  it('collapses nothing when spacing already correct', () => {
    const out = convert('正确 English 排版 already fine', { from: 'generic', to: 'obsidian' });
    expect(out).toContain('正确 English 排版 already fine');
  });

  it('is off for github target by default', () => {
    const out = convert('中文abc混排', { from: 'generic', to: 'github' });
    expect(out).toContain('中文abc混排');
  });

  it('never touches code or math content', () => {
    const md = '中文`code_X`结束，公式 $x_a$ 完毕';
    const out = convert(md, { from: 'generic', to: 'obsidian' });
    expect(out).toContain('`code_X`');
    expect(out).toContain('$x_a$');
  });

  it('is idempotent', () => {
    const once = convert('中文English混排', { from: 'generic', to: 'obsidian' });
    expect(convert(once, { from: 'generic', to: 'obsidian' })).toBe(once);
  });
});
