/**
 * Core types: flavors, rule configuration, profiles, and conversion options.
 *
 * Effective rules are resolved by layered merge:
 *   BASE_RULES ← source.cleanup ← target.style ← user overrides (CLI --rule / config)
 */

export type SourceFlavor = 'chatgpt' | 'claude' | 'gemini' | 'generic' | 'html';
export type TargetFlavor = 'obsidian' | 'typora' | 'github' | 'commonmark';

/** All conversion knobs. Every rule reads its config from here. */
export interface RuleConfig {
  /** Convert \(..\)/\[..\] math delimiters to $..$/$$..$$. */
  mathDelimiters: 'convert' | 'keep';
  /** What to do with chat citations like 【1†L2-L5】 or dangling [1] markers. */
  citations: 'strip' | 'footnote' | 'keep';
  /** Normalize heading depth: 'top-level' promotes the highest heading to #; 'keep' does nothing. */
  headings: 'top-level' | 'keep';
  /** Normalize code fence language aliases (text/plaintext → stripped, lowercase, etc.). */
  codeFence: 'normalize' | 'keep';
  /** Output list bullet marker. */
  bullet: '-' | '*' | '+';
  /** Output emphasis/strong marker. */
  emphasis: '*' | '_';
  /** Fix emphasis that fails to parse at CJK boundaries (leftover literal `**` in text nodes). */
  emphasisFix: boolean;
  /** Normalize spacing between CJK and Latin/digit runs (text nodes only). */
  cjkSpacing: boolean;
  /** Callout style for output: Obsidian `> [!note]` or a plain blockquote with a bold title. */
  callouts: 'obsidian' | 'blockquote';
  /** Link style for output: keep `[[wiki]]` or convert to `[label](target.md)`. */
  wikilinks: 'wiki' | 'markdown';
  /** Remove UI artifacts: excess blank lines, trailing spaces, zero-width chars, "Copy code" text. */
  stripArtifacts: boolean;
  /** Wrap bare LaTeX environments (\begin{align} …) in $$ delimiters. */
  wrapLatexEnv: boolean;
}

/** Rules every conversion starts from. Sources and targets override subsets. */
export const BASE_RULES: RuleConfig = {
  mathDelimiters: 'convert',
  citations: 'strip',
  headings: 'keep',
  codeFence: 'normalize',
  bullet: '-',
  emphasis: '*',
  emphasisFix: true,
  cjkSpacing: false,
  callouts: 'blockquote',
  wikilinks: 'markdown',
  stripArtifacts: true,
  wrapLatexEnv: true,
};

export interface SourceProfile {
  name: SourceFlavor;
  description: string;
  /** Cleanup rules enabled because this source is known to produce them. */
  cleanup: Partial<RuleConfig>;
}

export interface TargetProfile {
  name: TargetFlavor;
  description: string;
  /** Output style rules this target expects. */
  style: Partial<RuleConfig>;
}

export interface ConvertOptions {
  /** Source flavor, or 'auto' to detect heuristically. */
  from: SourceFlavor | 'auto';
  /** Target flavor. */
  to: TargetFlavor;
  /** Partial rule overrides applied last. */
  rules?: Partial<RuleConfig>;
}

export interface DetectionResult {
  source: SourceFlavor;
  /** 0..1 — how confident the heuristics are. */
  confidence: number;
  /** Human-readable signals that fired, for --verbose output. */
  signals: string[];
}

export interface ConvertResult {
  markdown: string;
  /** The source actually used (post auto-detection). */
  source: SourceFlavor;
  /** The effective rule config (useful for debugging/verbose output). */
  rules: RuleConfig;
  detection?: DetectionResult;
}
