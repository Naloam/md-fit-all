import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  choosePasteInput,
  mergeSettings,
  htmlCarriesStructure,
  transformPaste,
} from '../src/paste-transform.js';

const settings = { ...DEFAULT_SETTINGS };

describe('htmlCarriesStructure', () => {
  it('detects KaTeX spans', () => {
    expect(htmlCarriesStructure('<p><span class="katex">x</span></p>')).toBe(true);
  });

  it('detects tables', () => {
    expect(htmlCarriesStructure('<table><tr><td>1</td></tr></table>')).toBe(true);
  });

  it('ignores plain formatting-only HTML', () => {
    expect(htmlCarriesStructure('<p><strong>bold</strong> text</p>')).toBe(false);
  });
});

describe('choosePasteInput', () => {
  it('prefers structured HTML', () => {
    const chosen = choosePasteInput(
      { markdown: null, text: 'plain', html: '<table><tr><td>1</td></tr></table>' },
      settings,
    );
    expect(chosen).toEqual({ input: '<table><tr><td>1</td></tr></table>', from: 'html' });
  });

  it('uses markdown/text otherwise', () => {
    const chosen = choosePasteInput(
      { markdown: '### md', text: 'plain', html: '<p><b>x</b></p>' },
      settings,
    );
    expect(chosen).toEqual({ input: '### md', from: 'auto' });
  });

  it('falls back to text when markdown is null', () => {
    const chosen = choosePasteInput({ markdown: null, text: 'just text', html: '' }, settings);
    expect(chosen).toEqual({ input: 'just text', from: 'auto' });
  });

  it('returns null for empty clipboards', () => {
    expect(choosePasteInput({ markdown: null, text: '', html: '' }, settings)).toBeNull();
  });
});

describe('transformPaste', () => {
  it('converts ChatGPT-style text end to end', () => {
    const out = transformPaste(
      { markdown: null, text: '### 标题\n\n公式 \\(x^2\\) 引用【1†s】', html: '' },
      settings,
    );
    expect(out).toContain('# 标题');
    expect(out).toContain('$x^2$');
    expect(out).not.toContain('【1†');
  });

  it('recovers LaTeX from KaTeX HTML', () => {
    const html =
      '<p><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>E</mi></mrow><annotation encoding="application/x-tex">E = mc^2</annotation></semantics></math></span></span></p>';
    const out = transformPaste({ markdown: null, text: 'E', html }, settings);
    expect(out).toContain('$E = mc^2$');
  });

  it('respects the disabled switch', () => {
    const out = transformPaste(
      { markdown: null, text: '### stays', html: '' },
      { enabled: false, preferHtml: 'auto' },
    );
    expect(out).toBeNull();
  });

  it('leaves already-clean notes untouched in effect (idempotent shape)', () => {
    const once = transformPaste({ markdown: null, text: '# Title\n\nplain', html: '' }, settings);
    expect(once).toBe('# Title\n\nplain\n');
  });
});

describe('mergeSettings', () => {
  it('falls back to defaults for absent or non-object data', () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings('junk')).toEqual(DEFAULT_SETTINGS);
  });

  it('applies valid stored values', () => {
    expect(mergeSettings({ enabled: false, preferHtml: 'never' })).toEqual({
      enabled: false,
      preferHtml: 'never',
    });
  });

  it('validates per key so a malformed data.json cannot break pasting', () => {
    expect(mergeSettings({ enabled: 'yes', preferHtml: 'always' })).toEqual(DEFAULT_SETTINGS);
    expect(mergeSettings({ enabled: false, preferHtml: 42 })).toEqual({
      enabled: false,
      preferHtml: DEFAULT_SETTINGS.preferHtml,
    });
    expect(mergeSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });
});
