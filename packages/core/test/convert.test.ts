import { describe, expect, it } from 'vitest';
import { convert, convertDetailed } from '../src/convert.js';

describe('convert (framework end-to-end)', () => {
  it('passes through a simple document and finalizes the trailing newline', () => {
    const out = convert('# Title\n\nsome text\n\n\n', { from: 'generic', to: 'obsidian' });
    expect(out).toBe('# Title\n\nsome text\n');
  });

  it('runs stripArtifacts end to end', () => {
    const out = convert('a\n\n\n\n\nb\nCopy code\n', { from: 'chatgpt', to: 'obsidian' });
    expect(out).toBe('a\n\nb\n');
  });

  it('is idempotent on the framework pipeline', () => {
    const input = '# T\n\ntext with **bold** and `code`\n\n\n\nmore\n';
    const once = convert(input, { from: 'chatgpt', to: 'obsidian' });
    const twice = convert(once, { from: 'chatgpt', to: 'obsidian' });
    expect(twice).toBe(once);
  });

  it('returns detection info when from is auto', () => {
    const result = convertDetailed('查看 \\(x^2\\) 的结果\n\n【1†source】', {
      from: 'auto',
      to: 'obsidian',
    });
    expect(result.source).toBe('chatgpt');
    expect(result.detection?.signals.length).toBeGreaterThan(0);
  });

  it('applies user rule overrides', () => {
    // Override the emphasis marker for output styling.
    const out = convert('this is **bold** and *italic*', {
      from: 'generic',
      to: 'obsidian',
      rules: { emphasis: '_' },
    });
    expect(out).toContain('__bold__');
    expect(out).toContain('_italic_');
  });
});
