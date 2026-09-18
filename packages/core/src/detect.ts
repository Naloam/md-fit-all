import type { DetectionResult, SourceFlavor } from './types.js';
import { walkSegments } from './pipeline/protected.js';

/**
 * Heuristic source detection. Scores telltale signals over the unprotected
 * parts of the document:
 *
 *   - \(..\)/\[..\] with LaTeX commands → chatgpt/claude family (strong)
 *   - 【n†…】 browsing citations        → chatgpt (very strong)
 *   - headings start at ### or deeper  → any LLM chat (weak)
 *   - "Claude"/"Anthropic" mentions    → claude (weak)
 *   - Gemini artifacts ($$ math + [n] refs) are indistinguishable from
 *     generic Markdown → falls back to chatgpt family when math is present.
 *
 * All LLM chat profiles share the same cleanup rules, so a misattribution
 * inside the family is harmless; what matters is chat-vs-generic.
 */
export function detect(md: string): DetectionResult {
  const signals: string[] = [];
  let chatgpt = 0;
  let claude = 0;

  // Skip protected segments (code/math) so LaTeX *samples* don't misfire.
  let unprotected = '';
  walkSegments(md, (segment, isProtected) => {
    if (!isProtected) unprotected += segment;
    return segment;
  });

  const hasParenMath = /\\\(|\\\[/.test(unprotected);
  const hasLatexCommand =
    /\\(?:frac|sum|prod|int|sqrt|partial|nabla|times|div|pm|leq|geq|neq|approx|equiv|infty|cdot|cdots|ldots|rightarrow|leftarrow|Rightarrow|mathbf|mathbb|mathcal|mathrm|text|left|right|begin|end|boxed|hat|vec|bar|dot|underset|overset|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|Omega)/.test(
      unprotected,
    );
  if (hasParenMath && hasLatexCommand) {
    chatgpt += 3;
    claude += 3;
    signals.push('LaTeX \\( \\) / \\[ \\] delimiters with LaTeX commands');
  }

  if (/【\d+(?::\d+)?†/.test(unprotected)) {
    chatgpt += 4;
    signals.push('ChatGPT browsing citation markers 【n†…】');
  }

  if (/(^|\n)#{3,6} /.test(unprotected) && !/(^|\n)# /.test(unprotected)) {
    chatgpt += 1;
    claude += 1;
    signals.push('headings start at ### or deeper');
  }

  if (/\bClaude\b|\bAnthropic\b/.test(unprotected)) {
    claude += 2;
    signals.push('mentions Claude/Anthropic');
  }

  const text = unprotected;
  if (/复制代码|^Copy code$/m.test(text)) {
    chatgpt += 3;
    claude += 3;
    signals.push('copy-button chrome text ("Copy code" / "复制代码")');
  }

  let source: SourceFlavor = 'generic';
  let confidence = 0.2;
  const best = Math.max(chatgpt, claude);
  if (best >= 3) {
    source = claude > chatgpt ? 'claude' : 'chatgpt';
    confidence = Math.min(0.9, 0.4 + best * 0.08);
  }

  return { source, confidence, signals };
}
