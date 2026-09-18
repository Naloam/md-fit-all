import { protectedTransform } from '../pipeline/protected.js';
import type { PreRule } from '../pipeline/pre.js';

// Zero-width chars. The character class intentionally contains ZWJ/ZWNJ.
// eslint-disable-next-line no-misleading-character-class
const ZERO_WIDTH_RE = /[\u200B\u200C\u200D\uFEFF]/g;
/** UI chrome pasted from chat interfaces. English + Simplified Chinese variants. */
const COPY_CODE_LINE_RE = /^[ \t]*(?:Copy code|复制代码)[ \t]*$/gm;

/**
 * stripArtifacts: remove copy-paste junk that no editor wants.
 * Runs through protectedTransform so code content is never touched.
 */
export const artifactsRule: PreRule = {
  name: 'stripArtifacts',
  description:
    'Remove copy-paste junk: zero-width chars, "Copy code" chrome, trailing spaces, excess blank lines.',
  when: (rules) => rules.stripArtifacts,
  apply: (md: string): string =>
    protectedTransform(md, (text) => {
      let out = text.replace(ZERO_WIDTH_RE, '');
      out = out.replace(COPY_CODE_LINE_RE, '');
      out = out.replace(/[ \t]+$/gm, '');
      // 3+ consecutive newlines (blank line runs) → a single blank line.
      out = out.replace(/\n{3,}/g, '\n\n');
      return out;
    }),
};
