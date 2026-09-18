// End-to-end: seed clipboard with sample, run clip, verify converted content. Run: node scripts/clip-e2e.mjs
import { getClipboardAdapter } from '../packages/cli/dist/clipboard/index.js';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const sample = readFileSync('tmp-sample.md', 'utf8');
const adapter = getClipboardAdapter();
await adapter.writeText(sample);

console.log('running mdfit clip...');
const t0 = Date.now();
execFileSync(process.execPath, ['packages/cli/dist/index.js', 'clip', '--to', 'obsidian', '-y'], {
  stdio: 'inherit',
});
const secs = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`clip took ${secs}s`);

const out = await adapter.readText();
const checks = {
  'heading promoted to #': out.includes('# 卷积神经网络的三种卷积'),
  'sub heading to ##': out.includes('## 标准卷积'),
  'inline math converted': out.includes('$X \\in \\mathbb{R}^{H \\times W \\times C}$'),
  'display math block': out.includes('$$\nY_{i,j} = \\sum_{c=1}^{C}'),
  'short var math': out.includes('$K$ 为卷积核'),
  'citation stripped': !out.includes('【1†'),
  'align wrapped': out.includes('$$\n\\begin{align}'),
  'table kept': out.includes('| 类型'),
  'py->python': out.includes('```python'),
  'code content intact': out.includes('nn.Conv2d(3, 64, kernel_size=3, dilation=2)'),
};

let failed = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
if (failed > 0) {
  console.log(`\n${failed} check(s) failed. Clipboard content head:\n${out.slice(0, 300)}`);
  process.exitCode = 1;
} else {
  console.log('\nALL CHECKS PASSED');
}
