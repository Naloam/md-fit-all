import type { Command } from 'commander';
import { convertDetailed } from 'mdfit-core';
import type { RuleConfig, SourceFlavor, TargetFlavor } from 'mdfit-core';
import { getClipboardAdapter } from '../clipboard/index.js';
import { parseRuleOverrides } from '../rule-override.js';
import { renderDiff, diffStats } from '../diff.js';
import { loadConfig } from '../config.js';
import { DEFAULT_PORT } from '../server.js';
import { loadProfileFile } from './convert.js';
import * as readline from 'node:readline/promises';

/** If a serve daemon is alive, delegate the whole clip to it (fast path). */
async function tryServerClip(
  to: string,
  from: string,
  rules: Partial<RuleConfig>,
  profile: Partial<RuleConfig> | undefined,
): Promise<boolean> {
  const base = `http://127.0.0.1:${DEFAULT_PORT}`;
  try {
    const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(120) });
    if (!health.ok) return false;
    const res = await fetch(`${base}/clip`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, from, rules, profile }),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { source?: string; added?: number; removed?: number };
    console.log(
      `mdfit: ${body.source ?? '?'} → ${to} (+${body.added ?? 0}/-${body.removed ?? 0} lines) — clipboard updated (daemon).`,
    );
    return true;
  } catch {
    return false;
  }
}

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
    .option('--profile <file>', 'custom profile JSON layered over the built-in target style')
    .option('--html', 'prefer the clipboard HTML flavor (for copies from rendered pages)')
    .option('--diff', 'preview changes before applying (confirm interactively)')
    .option('-y, --yes', 'skip confirmation when used with --diff (non-interactive apply)')
    .option('-v, --verbose', 'print detection signals to stderr')
    .action(async (opts: Record<string, unknown>) => {
      const rules = parseRuleOverrides((opts.rule as string[] | undefined) ?? []);
      const profile = opts.profile ? loadProfileFile(opts.profile as string) : undefined;
      const to = (opts.to as TargetFlavor) ?? 'obsidian';
      const from = (opts.from as SourceFlavor | 'auto') ?? 'auto';
      const preferHtml = opts.html === true || from === 'html';

      // Fast path: a resident daemon does clipboard I/O without process spawns.
      if (!preferHtml && !opts.diff && !opts.verbose) {
        if (await tryServerClip(to, from, rules, profile)) return;
      }

      const adapter = getClipboardAdapter();
      let input: string;
      let effectiveFrom: SourceFlavor | 'auto' = from;
      if (preferHtml) {
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
        to,
        rules,
        profile,
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
        `mdfit: ${result.source} → ${to} (+${added}/-${removed} lines) — clipboard updated.`,
      );
    });
}
