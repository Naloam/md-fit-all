import { describe, expect, it, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const cliDir = dirname(fileURLToPath(import.meta.url));
const roots: string[] = [];

function makeTree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'mdfit-convdir-'));
  roots.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return root;
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function runCli(args: string[]): string {
  return execFileSync(process.execPath, [join(cliDir, '..', 'dist', 'index.cjs'), ...args], {
    encoding: 'utf8',
  });
}

describe('mdfit convert-dir', () => {
  it('converts a tree preserving layout', () => {
    const src = makeTree({
      'a.md': '### 甲\n\n公式 \\(x^2\\) 引用【1†s】',
      'sub/b.md': '见[[笔记]]',
      'sub/deep/c.md': '# 正常笔记',
    });
    const out = join(src, '..', 'out-a');
    const stdout = runCli(['convert-dir', src, '-o', out, '--from', 'chatgpt', '--to', 'github']);
    expect(stdout).toContain('3 file(s) converted');

    const a = readFileSync(join(out, 'a.md'), 'utf8');
    expect(a).toContain('# 甲');
    expect(a).toContain('$x^2$');
    expect(a).not.toContain('【1†');
    const b = readFileSync(join(out, 'sub', 'b.md'), 'utf8');
    expect(b).toContain('[笔记](笔记.md)'); // obsidian wiki → github md link
    const c = readFileSync(join(out, 'sub', 'deep', 'c.md'), 'utf8');
    expect(c).toContain('# 正常笔记');
    rmSync(out, { recursive: true, force: true });
  });

  it('dry-run lists files without writing', () => {
    const src = makeTree({ 'x.md': '# x', 'y.md': '# y' });
    const stdout = runCli(['convert-dir', src, '--dry-run', '--to', 'github']);
    expect(stdout).toContain('x.md');
    expect(stdout).toContain('y.md');
    expect(stdout).toContain('2 file(s) would be converted');
  });
});
