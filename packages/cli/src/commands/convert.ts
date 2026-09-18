import type { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { convertDetailed } from 'mdfit-core';
import type { SourceFlavor, TargetFlavor } from 'mdfit-core';
import { parseRuleOverrides } from '../rule-override.js';
import { renderDiff } from '../diff.js';
import { loadConfig } from '../config.js';

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

export function registerConvertCommand(program: Command): void {
  const config = loadConfig();

  program
    .command('convert')
    .description('convert a Markdown file (or stdin) to a target flavor')
    .argument('[file]', 'input .md file (defaults to stdin)')
    .option('-o, --output <file>', 'write result to a file (defaults to stdout)')
    .option('--from <source>', 'source flavor: auto|chatgpt|claude|gemini|generic', 'auto')
    .option(
      '--to <target>',
      `target flavor: obsidian|typora|github|commonmark (default: ${config.defaultTo ?? 'obsidian'})`,
      config.defaultTo ?? 'obsidian',
    )
    .option('--rule <k=v...>', 'rule overrides, e.g. --rule cjkSpacing=false headings=keep')
    .option('--diff', 'show a colored diff instead of writing output')
    .option('-v, --verbose', 'print detection signals and effective rules to stderr')
    .action(async (file: string | undefined, opts: Record<string, unknown>) => {
      const input = file ? readFileSync(file, 'utf8') : await readStdin();
      const rules = parseRuleOverrides((opts.rule as string[] | undefined) ?? []);

      const result = convertDetailed(input, {
        from: (opts.from as SourceFlavor | 'auto') ?? 'auto',
        to: (opts.to as TargetFlavor) ?? 'obsidian',
        rules,
      });

      if (opts.verbose) {
        console.error(`source: ${result.source} (from=${String(opts.from)})`);
        if (result.detection) {
          console.error(`confidence: ${result.detection.confidence}`);
          for (const s of result.detection.signals) console.error(`  signal: ${s}`);
        }
      }

      if (opts.diff) {
        console.log(renderDiff(input, result.markdown));
        return;
      }
      if (opts.output) {
        writeFileSync(opts.output as string, result.markdown, 'utf8');
        if (opts.verbose) console.error(`written: ${String(opts.output)}`);
      } else {
        process.stdout.write(result.markdown);
      }
    });
}
