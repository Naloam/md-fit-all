// Verify the Win+R alias with a realistically-seeded clipboard (single backslashes).
import { getClipboardAdapter } from '../packages/cli/dist/clipboard/index.js';
import { execFileSync } from 'node:child_process';

const seed = '### Typora 试用\n\n勾股定理 \\(a^2+b^2=c^2\\)，欧拉公式 \\[e^{i\\pi}+1=0\\]。';
const adapter = getClipboardAdapter();
await adapter.writeText(seed);

execFileSync('cmd', ['/c', 'mdfitt'], { stdio: 'inherit' });

const out = await adapter.readText();
const ok =
  out.includes('# Typora 试用') &&
  out.includes('$a^2+b^2=c^2$') &&
  out.includes('$$') &&
  out.includes('e^{i\\pi}+1=0');
console.log(out);
console.log(ok ? 'ALIAS-TEST-OK' : 'ALIAS-TEST-FAILED');
process.exitCode = ok ? 0 : 1;
