import { describe, expect, it } from 'vitest';
import { applyImageMap, extractImgUrls } from '../src/rescue.js';

describe('extractImgUrls', () => {
  it('collects unique non-data src attributes', () => {
    const html =
      '<p><img src="https://a/b.png"><img src="https://a/b.png"><img src="data:image/png;base64,xxx"><img alt="no src"></p>';
    expect(extractImgUrls(html)).toEqual(['https://a/b.png']);
  });

  it('handles src with query strings and multiple images', () => {
    const html = '<img src="https://x/1.png?token=t"><img class="k" src="https://x/2.jpg">';
    expect(extractImgUrls(html)).toEqual(['https://x/1.png?token=t', 'https://x/2.jpg']);
  });
});

describe('applyImageMap', () => {
  it('replaces matching src attributes only', () => {
    const html = '<img src="https://a/b.png"><img src="https://c/d.png">';
    const out = applyImageMap(html, new Map([['https://a/b.png', 'data:image/png;base64,AA']]));
    expect(out).toContain('src="data:image/png;base64,AA"');
    expect(out).toContain('src="https://c/d.png"');
  });

  it('is a no-op with an empty map', () => {
    const html = '<img src="https://a/b.png">';
    expect(applyImageMap(html, new Map())).toBe(html);
  });
});
