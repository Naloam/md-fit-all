import { protectedTransform } from '../pipeline/protected.js';
import type { PreRule } from '../pipeline/pre.js';

/**
 * citations:
 *   strip    — remove ChatGPT browsing markers (【1†source】, 【4:2†L3-L9】) and
 *              dangling sentence-adjacent markers like [3] (only when clearly
 *              citation position, never inside links `[3](…)`, definitions
 *              `[3]: …`, footnotes `[^3]`, or array indexing `a[3]`).
 *   footnote — convert browsing markers to real footnotes [^n] with definitions.
 */

/** ChatGPT browsing citation markers. Requires the † dagger — plain 【…】 brackets in prose are left alone. */
const BROWSER_CITATION_RE = /【(\d+)(?::\d+)?†([^】]*)】/g;

/**
 * Sentence-adjacent [n]: must be at line start or after whitespace/terminal
 * punctuation (so `a[3]` survives), and NOT followed by `(`, `:` or a word
 * char (link/definition/inline use).
 */
const BARE_MARKER_RE = /(^|[\s。，、；：！）)])\[(\d{1,3})\](?![(:\w])/gm;

export const citationsRule: PreRule = {
  name: 'citations',
  description:
    'Strip ChatGPT browsing markers (【1†source】) and sentence-adjacent [n], or convert to footnotes.',
  when: (rules) => rules.citations !== 'keep',
  apply: (md: string, rules): string => {
    const footnotes: Array<{ n: number; source: string }> = [];

    let out = protectedTransform(md, (text) =>
      text.replace(BROWSER_CITATION_RE, (_whole, n: string, source: string) => {
        if (rules.citations === 'footnote') {
          footnotes.push({ n: Number(n), source: source.trim() });
          return `[^${n}]`;
        }
        return '';
      }),
    );

    if (rules.citations === 'strip') {
      out = protectedTransform(out, (text) =>
        text.replace(
          BARE_MARKER_RE,
          (whole, lead: string, _n: string, offset: number, full: string) => {
            // "2014 [3]." must become "2014." not "2014 ." — when the marker is
            // directly followed by punctuation, drop the leading space too.
            const next = full.charAt(offset + whole.length);
            const punctNext = /[.,;:!?)\]。，、；：！）】》”]/.test(next);
            return punctNext && /^[ \t]+$/.test(lead) ? '' : lead;
          },
        ),
      );
    }

    if (rules.citations === 'footnote' && footnotes.length > 0) {
      const defs = footnotes
        .map(({ n, source }) => `[^${n}]: ${source.length > 0 ? source : '(source)'}`)
        .join('\n');
      out = `${out.trimEnd()}\n\n${defs}\n`;
    }

    return out;
  },
};
