import type { Command } from 'commander';
import { convertDetailed } from 'mdfit-core';
import type { SourceFlavor, TargetFlavor } from 'mdfit-core';
import { getClipboardAdapter } from '../clipboard/index.js';
import { parseRuleOverrides } from '../rule-override.js';
import { renderDiff, diffStats } from '../diff.js';
import { loadConfig } from '../config.js';
import * as readline from 'node:readline/promises';

export function registerClipCommand(program: Command): void {
  const config = loadConfig();

  program
    .command('clip')
    .description('transform the system clipboard in place (the hotkey entry point)')
    .option('--from <source>', 'source flavor: auto|chatgpt|claude|gemini|generic|html', 'auto')
    .option(
      '--to <target>',
      `target flavor: obsidian|typora|github|commonmark (default: ${config.defaultTo ?? 'obsidian'})`,
      config.defaultTo ?? 'obsidian',
    )
    .option('--rule <k=v...>', 'rule overrides, e.g. --rule cjkSpacing=false')
    .option('--html', 'prefer the clipboard HTML flavor (for copies from rendered pages)')
    .option('--diff', 'preview changes before applying (confirm interactively)')
    .option('-y, --yes', 'skip confirmation when used with --diff (non-interactive apply)')
    .option('-v, --verbose', 'print detection signals to stderr')
    .action(async (opts: Record<string, unknown>) => {
      const adapter = getClipboardAdapter();
      const rules = parseRuleOverrides((opts.rule as string[] | undefined) ?? []);
      const preferHtml = opts.html === true;
      const from = (opts.from as SourceFlavor | 'auto') ?? 'auto';

      let input: string;
      let effectiveFrom: SourceFlavor | 'auto' = from;
      if (preferHtml || from === 'html') {
        const html = await adapter.readHtml();
        if (html === undefined) {
          console.error('No HTML flavor on clipboard; falling back to plain text.');
          input = await adapter.readText();
          effectiveFrom = from === 'html' ? 'auto' : from;
        } else {
          input = html;
          effectiveFrom = 'html';
        }
      } else {
        input = await adapter.readText();
      }

      if (input.trim().length === 0) {
        console.error('Clipboard is empty — nothing to convert.');
        process.exitCode = 1;
        return;
      }

      const result = convertDetailed(input, {
        from: effectiveFrom,
        to: (opts.to as TargetFlavor) ?? 'obsidian',
        rules,
      });

      if (opts.verbose && result.detection) {
        console.error(`detected source: ${result.source} (${result.detection.confidence})`);
        for (const s of result.detection.signals) console.error(`  signal: ${s}`);
      }

      if (opts.diff && !opts.yes) {
        console.log(renderDiff(input, result.markdown));
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question('Apply to clipboard? [y/N] ');
        rl.close();
        if (answer.trim().toLowerCase() !== 'y') {
          console.error('Aborted — clipboard unchanged.');
          return;
        }
      } else if (opts.diff) {
        console.log(renderDiff(input, result.markdown));
      }

      await adapter.writeText(result.markdown);
      const { added, removed } = diffStats(input, result.markdown);
      console.log(
        `mdfit: ${result.source} → ${String(opts.to)} (+${added}/-${removed} lines) — clipboard updated.`,
      );
    });
}
