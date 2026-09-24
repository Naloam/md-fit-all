import type { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { convertDetailed, BASE_RULES } from 'mdfit-core';
import type { RuleConfig, SourceFlavor, TargetFlavor } from 'mdfit-core';
import { parseRuleOverrides } from '../rule-override.js';
import { renderDiff } from '../diff.js';
import { loadConfig } from '../config.js';
import { collectRemoteImages, downloadImages, rewriteImageLinks } from '../images.js';

export function loadProfileFile(path: string): Partial<RuleConfig> {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const valid = new Set(Object.keys(BASE_RULES));
  for (const key of Object.keys(raw)) {
    if (!valid.has(key)) {
      throw new Error(`profile "${path}": unknown rule key "${key}"`);
    }
  }
  return raw as Partial<RuleConfig>;
}

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
    .option('--profile <file>', 'custom profile JSON layered over the built-in target style')
    .option('--download-images', 'download remote images and rewrite links (chat file URLs expire)')
    .option('--images-dir <dir>', 'directory for downloaded images (default: assets)')
    .option('--diff', 'show a colored diff instead of writing output')
    .option('-v, --verbose', 'print detection signals and effective rules to stderr')
    .action(async (file: string | undefined, opts: Record<string, unknown>) => {
      const input = file ? readFileSync(file, 'utf8') : await readStdin();
      const rules = parseRuleOverrides((opts.rule as string[] | undefined) ?? []);
      const profile = opts.profile ? loadProfileFile(opts.profile as string) : undefined;

      const result = convertDetailed(input, {
        from: (opts.from as SourceFlavor | 'auto') ?? 'auto',
        to: (opts.to as TargetFlavor) ?? 'obsidian',
        rules,
        profile,
      });

      let markdown = result.markdown;
      if (opts.downloadImages) {
        const urls = collectRemoteImages(markdown);
        if (urls.length > 0) {
          const dir = (opts.imagesDir as string) ?? 'assets';
          const { map, failed } = await downloadImages(urls, dir);
          markdown = rewriteImageLinks(markdown, map);
          if (failed.length > 0) {
            console.error(
              `mdfit: ${failed.length}/${urls.length} image(s) failed to download (links kept):`,
            );
            for (const f of failed) console.error(`  ${f.url} — ${f.reason}`);
          }
        }
      }

      if (opts.verbose) {
        console.error(`source: ${result.source} (from=${String(opts.from)})`);
        if (result.detection) {
          console.error(`confidence: ${result.detection.confidence}`);
          for (const s of result.detection.signals) console.error(`  signal: ${s}`);
        }
      }

      if (opts.diff) {
        console.log(renderDiff(input, markdown));
        return;
      }
      if (opts.output) {
        writeFileSync(opts.output as string, markdown, 'utf8');
        if (opts.verbose) console.error(`written: ${String(opts.output)}`);
      } else {
        process.stdout.write(markdown);
      }
    });
}
