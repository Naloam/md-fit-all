import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convert } from '../src/convert.js';
import type { ConvertOptions, TargetFlavor } from '../src/types.js';

const CASES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'corpus',
  'cases',
);

interface CaseOptions extends Partial<ConvertOptions> {
  from: ConvertOptions['from'];
  to: TargetFlavor;
}

function listCases(): Array<{ name: string; dir: string; options: CaseOptions }> {
  return readdirSync(CASES_DIR)
    .filter((name) => existsSync(join(CASES_DIR, name, 'input.md')))
    .map((name) => {
      const dir = join(CASES_DIR, name);
      const options = JSON.parse(readFileSync(join(dir, 'options.json'), 'utf8')) as CaseOptions;
      return { name, dir, options };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Extract fenced code block contents (language line excluded) from a document. */
function fencedCodeBlocks(md: string): string[] {
  const blocks: string[] = [];
  for (const m of md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    blocks.push(m[1] ?? '');
  }
  return blocks;
}

const cases = listCases();

describe('corpus (golden files)', () => {
  it('has cases registered', () => {
    expect(cases.length).toBeGreaterThanOrEqual(18);
  });

  for (const { name, dir, options } of cases) {
    describe(`case: ${name}`, () => {
      const input = readFileSync(join(dir, 'input.md'), 'utf8');
      const expectedPath = join(dir, 'expected', `${options.to}.md`);
      const expected = readFileSync(expectedPath, 'utf8');

      it('matches the golden file', () => {
        expect(convert(input, options)).toBe(expected);
      });

      it('is idempotent', () => {
        const once = convert(input, options);
        const againOpts: ConvertOptions =
          options.from === 'html' ? { from: 'generic', to: options.to } : options;
        const twice = convert(once, againOpts);
        expect(twice).toBe(once);
      });

      it('keeps code blocks byte-identical', () => {
        if (options.from === 'html') return; // input is HTML, not Markdown
        const out = convert(input, options);
        for (const block of fencedCodeBlocks(input)) {
          expect(out).toContain(block);
        }
      });
    });
  }
});
