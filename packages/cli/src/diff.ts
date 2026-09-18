import { diffLines } from 'diff';

/** Render a colored line diff (ANSI) between two texts. */
export function renderDiff(before: string, after: string): string {
  const parts = diffLines(before, after);
  const out: string[] = [];
  for (const part of parts) {
    const lines = part.value.replace(/\n$/, '').split('\n');
    for (const line of lines) {
      if (line === '' && part.value === '') continue;
      if (part.added) out.push(`\x1b[32m+ ${line}\x1b[0m`);
      else if (part.removed) out.push(`\x1b[31m- ${line}\x1b[0m`);
      else out.push(`  ${line}`);
    }
  }
  return out.join('\n');
}

/** Count added/removed lines between two texts. */
export function diffStats(before: string, after: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const part of diffLines(before, after)) {
    const n = part.value
      .replace(/\n$/, '')
      .split('\n')
      .filter((l) => l !== '').length;
    if (part.added) added += n;
    if (part.removed) removed += n;
  }
  return { added, removed };
}
