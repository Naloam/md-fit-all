import { describe, expect, it } from 'vitest';
import { protectedTransform, walkSegments } from '../src/pipeline/protected.js';

describe('protectedTransform', () => {
  it('applies fn to plain text and leaves fenced code untouched', () => {
    const md = 'hello world\n```js\nconst x = 1;\n```\nbye';
    const out = protectedTransform(md, (t) => t.toUpperCase());
    expect(out).toBe('HELLO WORLD\n```js\nconst x = 1;\n```\nBYE');
  });

  it('leaves inline code untouched', () => {
    const md = 'keep `a * b * c` intact';
    const out = protectedTransform(md, (t) => t.replace(/\*/g, 'STAR'));
    expect(out).toBe('keep `a * b * c` intact');
  });

  it('leaves $$ math blocks untouched', () => {
    const md = 'text $$E = mc^2$$ more';
    const out = protectedTransform(md, (t) => t.toUpperCase());
    expect(out).toBe('TEXT $$E = mc^2$$ MORE');
  });

  it('protects an unclosed fence to end of document', () => {
    const md = 'before\n```\nnever transform this';
    const out = protectedTransform(md, (t) => t.toUpperCase());
    expect(out).toBe('BEFORE\n```\nnever transform this');
  });

  it('handles text with no protected segments', () => {
    expect(protectedTransform('abc', (t) => t + '!')).toBe('abc!');
  });

  it('walkSegments reports protection flags', () => {
    const md = 'a `b` c';
    const seen: Array<[string, boolean]> = [];
    walkSegments(md, (seg, p) => {
      seen.push([seg, p]);
      return seg;
    });
    expect(seen).toEqual([
      ['a ', false],
      ['`b`', true],
      [' c', false],
    ]);
  });
});
