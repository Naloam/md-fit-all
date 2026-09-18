import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkStringify from 'remark-stringify';
import type { Root } from 'mdast';
import type { ConvertOptions, ConvertResult } from './types.js';
import { detect } from './detect.js';
import { resolveRules } from './profiles/index.js';
import { runPreRules } from './pipeline/pre.js';
import { runAstRules } from './pipeline/ast.js';
import { stringifyOptions } from './pipeline/serialize.js';
import { htmlToMarkdown } from './rules/html-input.js';

/**
 * Convert Markdown (or clipboard HTML) between dialects.
 *
 * Pipeline: [html→md] → pre-rules (protected string transforms) → parse →
 * ast-rules → stringify with target style → final newline hygiene.
 */
export function convertDetailed(input: string, opts: ConvertOptions): ConvertResult {
  let detection: DetectionResultLike | undefined;
  let source = opts.from;
  if (source === 'auto') {
    detection = detect(input);
    source = detection.source;
  }

  const rules = resolveRules(source, opts.to, opts.rules);

  let md = source === 'html' ? htmlToMarkdown(input) : input;
  md = runPreRules(md, rules);

  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
  const tree = processor.parse(md) as Root;

  runAstRules(tree, rules);

  const out = unified()
    .use(remarkStringify, stringifyOptions(rules))
    .use(remarkGfm)
    .use(remarkMath)
    .stringify(tree) as string;

  return {
    markdown: finalize(out, rules),
    source,
    rules,
    detection,
  };
}

/** Convenience wrapper returning just the Markdown string. */
export function convert(input: string, opts: ConvertOptions): string {
  return convertDetailed(input, opts).markdown;
}

/**
 * Single trailing newline, no trailing spaces. For wiki-link targets, undo
 * the serializer's escaping of `[[` so Obsidian still sees real wikilinks.
 */
function finalize(md: string, rules: ConvertResult['rules']): string {
  let out = md.replace(/[ \t]+\n/g, '\n').trimEnd() + '\n';
  if (rules.wikilinks === 'wiki') {
    out = out.replaceAll('\\[\\[', '[[');
  }
  return out;
}

type DetectionResultLike = ConvertResult['detection'];
