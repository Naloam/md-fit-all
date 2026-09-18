import { protectedTransform } from '../pipeline/protected.js';
import type { PreRule } from '../pipeline/pre.js';

/**
 * mathDelimiters + wrapLatexEnv (both pre-rules live here because they share
 * the LaTeX-surface logic):
 *
 *   \( ... \)        →  $...$
 *   \[ ... \]        →  $$...$$
 *   bare \begin{align}...\end{align} blocks → wrapped in $$
 *
 * All transforms run through protectedTransform, so LaTeX *inside* code
 * samples is never rewritten. Existing $$..$$ is already protected.
 */

const INLINE_MATH_RE = /\\\(([\s\S]+?)\\\)/g;
const DISPLAY_MATH_RE = /\\\[([\s\S]+?)\\\]/g;

/** Display-style environments that should live inside $$ when bare. */
const LATEX_ENV_RE =
  /(^|\n)[ \t]*(\\begin\{(?:align|aligned|equation|gather|gathered|multline|split|eqnarray)\*?\}[\s\S]*?\\end\{(?:align|aligned|equation|gather|gathered|multline|split|eqnarray)\*?\})[ \t]*(?=\n|$)/g;

/** True if this text piece contains LaTeX-ish commands (heuristic guard). */
function looksLikeLatex(s: string): boolean {
  return /\\(?:frac|sqrt|sum|prod|int|oint|partial|nabla|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|infty|cdot|cdots|ldots|vdots|ddots|times|div|pm|mp|leq|geq|neq|approx|equiv|sim|propto|in|notin|subset|supset|subseteq|supseteq|cup|cap|forall|exists|nabla|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|Leftrightarrow|mapsto|to|gets|uparrow|downarrow|mathbf|mathbb|mathcal|mathfrak|mathrm|mathit|text|left|right|begin|end|operatorname|hat|bar|vec|dot|tilde|widehat|overline|underline|boxed|underset|overset|binom|stackrel)\b/.test(
    s,
  );
}

/** True if this looks like actual math content (guards prose that merely mentions delimiters). */
function isMathBody(raw: string): boolean {
  const body = raw.trim();
  if (body.length === 0) return false;
  if (looksLikeLatex(body)) return true;
  if (/[$}^_]/.test(body)) return true;
  // Short space-free body with a latin letter or backslash: single variables
  // like \(K\), \(r\), \(C_o\) are math. Pure CJK words (和, 的) are prose.
  return body.length <= 24 && !/\s/.test(body) && /[A-Za-z\\^_]/.test(body);
}

export const mathDelimitersRule: PreRule = {
  name: 'mathDelimiters',
  description: 'Convert \\( .. \\) and \\[ .. \\] math delimiters to $..$ and $$..$$.',
  when: (rules) => rules.mathDelimiters === 'convert',
  apply: (md: string): string =>
    protectedTransform(md, (text) => {
      let out = text;
      out = out.replace(INLINE_MATH_RE, (whole, body: string) =>
        isMathBody(body) ? `$${body.trim()}$` : whole,
      );
      // Display math gets the multi-line $$ form so remark-math parses it as
      // a math *block*; inline `$$..$$` would degrade to inline math.
      out = out.replace(DISPLAY_MATH_RE, (whole, body: string) =>
        isMathBody(body) ? `$$\n${body.trim()}\n$$` : whole,
      );
      return out;
    }),
};

export const wrapLatexEnvRule: PreRule = {
  name: 'wrapLatexEnv',
  description: 'Wrap bare LaTeX environments (\\begin{align}…) in $$ blocks.',
  when: (rules) => rules.wrapLatexEnv,
  apply: (md: string): string =>
    protectedTransform(md, (text) =>
      text.replace(
        LATEX_ENV_RE,
        (_whole, lead: string, block: string) => `${lead}$$\n${block}\n$$`,
      ),
    ),
};
