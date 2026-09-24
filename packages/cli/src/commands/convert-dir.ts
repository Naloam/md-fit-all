import type { Command } from 'commander';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { convertDetailed } from 'mdfit-core';
import type { SourceFlavor, TargetFlavor } from 'mdfit-core';
import { parseRuleOverrides } from '../rule-override.js';
import { loadProfileFile } from './convert.js';

function collectMarkdownFiles(root: string, ext: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith(ext)) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}

/**
 * mdfit convert-dir — batch-convert a whole directory tree, preserving the
 * relative layout. The workhorse for "publish my Obsidian vault on GitHub":
 *
 *   mdfit convert-dir vault/ -o vault-github/ --to github
 */
export function registerConvertDirCommand(program: Command): void {
  program
    .command('convert-dir')
    .description('batch-convert every Markdown file in a directory tree')
    .argument('<src>', 'source directory')
    .option('-o, --output <dir>', 'output directory (default: <src>-<target>)')
    .option('--from <source>', 'source flavor: auto|chatgpt|claude|gemini|generic', 'auto')
    .option('--to <target>', 'target flavor: obsidian|typora|github|commonmark', 'obsidian')
    .option('--rule <k=v...>', 'rule overrides')
    .option('--profile <file>', 'custom profile JSON')
    .option('--ext <ext>', 'file extension to convert (default: .md)', '.md')
    .option('--dry-run', 'list what would be converted without writing')
    .action((src: string, opts: Record<string, unknown>) => {
      const to = (opts.to as TargetFlavor) ?? 'obsidian';
      const from = (opts.from as SourceFlavor | 'auto') ?? 'auto';
      const rules = parseRuleOverrides((opts.rule as string[] | undefined) ?? []);
      const profile = opts.profile ? loadProfileFile(opts.profile as string) : undefined;
      const ext = (opts.ext as string) ?? '.md';
      const outDir = (opts.output as string) ?? `${src.replace(/[\\/]+$/, '')}-${to}`;

      let files: string[];
      try {
        files = collectMarkdownFiles(src, ext);
      } catch (err) {
        console.error(
          `mdfit: cannot read ${src} — ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exitCode = 1;
        return;
      }
      if (files.length === 0) {
        console.error(`mdfit: no ${ext} files found under ${src}`);
        process.exitCode = 1;
        return;
      }

      if (opts.dryRun) {
        for (const f of files) console.log(relative(src, f).split(sep).join('/'));
        console.log(`${files.length} file(s) would be converted → ${outDir}`);
        return;
      }

      let converted = 0;
      let failed = 0;
      for (const file of files) {
        const rel = relative(src, file);
        try {
          const input = readFileSync(file, 'utf8');
          const result = convertDetailed(input, { from, to, rules, profile });
          const dest = join(outDir, rel);
          mkdirSync(join(dest, '..'), { recursive: true });
          writeFileSync(dest, result.markdown, 'utf8');
          converted++;
        } catch (err) {
          failed++;
          console.error(
            `mdfit: failed on ${rel} — ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      console.log(
        `mdfit: ${converted} file(s) converted → ${outDir}${failed > 0 ? ` (${failed} failed)` : ''}`,
      );
      if (failed > 0) process.exitCode = 1;
    });
}
