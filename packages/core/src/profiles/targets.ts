import type { TargetFlavor, TargetProfile } from '../types.js';

/** Target profiles describe the output dialect every editor wants. */
export const TARGET_PROFILES: Record<TargetFlavor, TargetProfile> = {
  obsidian: {
    name: 'obsidian',
    description: 'Obsidian Flavored Markdown ($ math, callouts, wikilinks, CJK-friendly spacing)',
    style: {
      bullet: '-',
      emphasis: '*',
      cjkSpacing: true,
      callouts: 'obsidian',
      wikilinks: 'wiki',
      wikiLinkify: true,
      calloutize: true,
      codeFence: 'normalize',
    },
  },
  typora: {
    name: 'typora',
    description: 'Typora ($ math, no callouts, standard links)',
    style: {
      bullet: '-',
      emphasis: '*',
      cjkSpacing: true,
      callouts: 'blockquote',
      wikilinks: 'markdown',
      codeFence: 'normalize',
    },
  },
  github: {
    name: 'github',
    description: 'GitHub Flavored Markdown ($ math via MathJax, standard links, no callouts)',
    style: {
      bullet: '-',
      emphasis: '*',
      cjkSpacing: false,
      callouts: 'blockquote',
      wikilinks: 'markdown',
      codeFence: 'normalize',
    },
  },
  commonmark: {
    name: 'commonmark',
    description: 'Strict CommonMark (most conservative output)',
    style: {
      bullet: '-',
      emphasis: '*',
      cjkSpacing: false,
      callouts: 'blockquote',
      wikilinks: 'markdown',
      codeFence: 'normalize',
    },
  },
};
