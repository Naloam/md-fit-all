/**
 * Protected-segment transformer — the quality cornerstone of mdfit-core.
 *
 * Any string-level (regex) transformation MUST run through `protectedTransform`
 * so that fenced code blocks, inline code and existing $$ math are never
 * modified. Competing tools regex over the whole document and corrupt code
 * samples; we structurally refuse to.
 */

const PROTECTED_RE =
  /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`|\$\$[\s\S]*?(?:\$\$|$))/g;

/**
 * Apply `fn` only to the non-protected parts of `md`, leaving code fences,
 * indented inline code spans and `$$` math blocks byte-identical.
 */
export function protectedTransform(md: string, fn: (text: string) => string): string {
  let out = '';
  let last = 0;
  for (const match of md.matchAll(PROTECTED_RE)) {
    const idx = match.index ?? 0;
    out += fn(md.slice(last, idx));
    out += match[0]; // protected segment: copied verbatim
    last = idx + match[0].length;
  }
  out += fn(md.slice(last));
  return out;
}

/**
 * Like `protectedTransform`, but maps over *all* segments, telling the callback
 * whether the segment is protected. Useful for detection-style scans.
 */
export function walkSegments(
  md: string,
  fn: (segment: string, protected_: boolean) => string,
): string {
  let out = '';
  let last = 0;
  for (const match of md.matchAll(PROTECTED_RE)) {
    const idx = match.index ?? 0;
    out += fn(md.slice(last, idx), false);
    out += fn(match[0], true);
    last = idx + match[0].length;
  }
  out += fn(md.slice(last), false);
  return out;
}
