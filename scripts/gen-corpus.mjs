/**
 * Regenerate corpus golden files: expected/<target>.md for every case.
 * Maintainer tool — review the diff before committing; golden files must be
 * human-verified, not blind snapshots.
 *
 * Run: pnpm build && node scripts/gen-corpus.mjs
 */
import { convert } from '../packages/core/dist/index.js';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = join(root, 'corpus', 'cases');

let count = 0;
for (const name of readdirSync(casesDir)) {
  const dir = join(casesDir, name);
  const inputPath = join(dir, 'input.md');
  if (!existsSync(inputPath)) continue;
  const options = JSON.parse(readFileSync(join(dir, 'options.json'), 'utf8'));
  const input = readFileSync(inputPath, 'utf8');
  const output = convert(input, options);
  const expectedDir = join(dir, 'expected');
  mkdirSync(expectedDir, { recursive: true });
  writeFileSync(join(expectedDir, `${options.to}.md`), output, 'utf8');
  count++;
  console.log(`generated: ${name} → expected/${options.to}.md`);
}
console.log(`\n${count} case(s) generated. Review the outputs before committing.`);
