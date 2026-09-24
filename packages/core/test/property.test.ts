import fc from 'fast-check';
import { describe, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convert } from '../src/convert.js';
import type { SourceFlavor, TargetFlavor } from '../src/types.js';

/**
 * Property-based tests: the corpus blocks are the safest building material —
 * individually valid, individually idempotent — so random recombinations must
 * satisfy the three hard invariants for ANY chat/generic source and ANY
 * target:
 *
 *   1. convert never throws
 *   2. convert is idempotent:  convert(convert(x)) === convert(x)
 *   3. fenced code blocks survive byte-identical
 */

const CASES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'corpus',
  'cases',
);

/** Split a document into atomic blocks: fenced code stays whole, rest by paragraph. */
function collectBlocks(md: string): string[] {
  const blocks: string[] = [];
  const fence = /```[\s\S]*?(?:```|$)/g;
  let last = 0;
  for (const m of md.matchAll(fence)) {
    const start = m.index ?? 0;
    pushText(blocks, md.slice(last, start));
    blocks.push(m[0]);
    last = start + m[0].length;
  }
  pushText(blocks, md.slice(last));
  return blocks.filter((b) => b.trim().length > 0);
}

function pushText(blocks: string[], text: string): void {
  for (const para of text.split(/\n{2,}/)) {
    if (para.trim().length > 0) blocks.push(para);
  }
}

// Skip the HTML case: its input is HTML, not Markdown block material.
const blocks: string[] = readdirSync(CASES_DIR)
  .filter((name) => existsSync(join(CASES_DIR, name, 'input.md')))
  .filter((name) => name !== 'html-katex-table')
  .flatMap((name) => collectBlocks(readFileSync(join(CASES_DIR, name, 'input.md'), 'utf8')));

const sources: Array<SourceFlavor | 'auto'> = ['auto', 'chatgpt', 'claude', 'gemini', 'generic'];
const targets: TargetFlavor[] = ['obsidian', 'typora', 'github', 'commonmark'];

const docArbitrary = fc
  .uniqueArray(fc.nat({ max: blocks.length - 1 }), { minLength: 1, maxLength: 12 })
  .map((idxs) => idxs.map((i) => blocks[i] as string).join('\n\n'));

const comboArbitrary = fc.record({
  doc: docArbitrary,
  from: fc.constantFrom(...sources),
  to: fc.constantFrom(...targets),
});

function fencedBlocks(md: string): string[] {
  return [...md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1] ?? '');
}

describe('property: convert over random corpus recombinations', () => {
  it('never throws', { timeout: 60_000 }, () => {
    fc.assert(
      fc.property(comboArbitrary, ({ doc, from, to }) => {
        convert(doc, { from, to });
      }),
      { numRuns: 150 },
    );
  });

  it('is idempotent', { timeout: 60_000 }, () => {
    fc.assert(
      fc.property(comboArbitrary, ({ doc, from, to }) => {
        const once = convert(doc, { from, to });
        const twice = convert(once, { from, to });
        if (twice !== once) {
          throw new Error(
            `Not idempotent (${from}→${to}):\n--- once ---\n${once}\n--- twice ---\n${twice}`,
          );
        }
      }),
      { numRuns: 150 },
    );
  });

  it('keeps fenced code byte-identical', { timeout: 60_000 }, () => {
    fc.assert(
      fc.property(comboArbitrary, ({ doc, from, to }) => {
        const out = convert(doc, { from, to });
        for (const block of fencedBlocks(doc)) {
          if (!out.includes(block)) {
            throw new Error(`Code block lost (${from}→${to}):\n${block}`);
          }
        }
      }),
      { numRuns: 150 },
    );
  });
});
