// Verify the globally installed mdfit end-to-end: seed clipboard, run `mdfit clip`, read back.
import { getClipboardAdapter } from '../packages/cli/dist/clipboard/index.js';
import { execFileSync } from 'node:child_process';

const seed = '### 测试标题\n\n公式 \\(E=mc^2\\) 与引用【1†source】';
const adapter = getClipboardAdapter();
await adapter.writeText(seed);

execFileSync('mdfit', ['clip', '--to', 'obsidian', '-y'], { stdio: 'inherit', shell: true });

const out = await adapter.readText();
const checks = {
  'heading promoted': out.includes('# 测试标题'),
  'math converted': out.includes('$E=mc^2$'),
  'citation stripped': !out.includes('【1†'),
};
let failed = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
console.log(failed === 0 ? 'GLOBAL-CLIP-OK' : 'GLOBAL-CLIP-FAILED');
process.exitCode = failed === 0 ? 0 : 1;
