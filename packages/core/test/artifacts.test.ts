import { describe, expect, it } from 'vitest';
import { artifactsRule } from '../src/rules/artifacts.js';
import { BASE_RULES } from '../src/types.js';

const rules = { ...BASE_RULES, stripArtifacts: true };

describe('stripArtifacts rule', () => {
  it('collapses 3+ newlines to a single blank line', () => {
    const md = 'para one\n\n\n\n\npara two';
    expect(artifactsRule.apply(md, rules)).toBe('para one\n\npara two');
  });

  it('strips trailing whitespace per line', () => {
    const md = 'line one   \nline two\t';
    expect(artifactsRule.apply(md, rules)).toBe('line one\nline two');
  });

  it('removes zero-width characters in text but not in code', () => {
    const md = 'invis\u200Bible\n```\nkeep\u200Bme\n```\n';
    expect(artifactsRule.apply(md, rules)).toBe('invisible\n```\nkeep\u200Bme\n```\n');
  });

  it('removes "Copy code" / "复制代码" chrome lines', () => {
    const md = 'intro\n\nCopy code\n\n复制代码\n\nbody';
    expect(artifactsRule.apply(md, rules)).toBe('intro\n\nbody');
  });

  it('does not touch trailing spaces inside code fences', () => {
    const md = '```\nline with trailing   \n```';
    expect(artifactsRule.apply(md, rules)).toBe(md);
  });
});
