// Roundtrip check for the platform clipboard adapter. Run: node scripts/clip-roundtrip.mjs
import { getClipboardAdapter } from '../packages/cli/dist/clipboard/index.js';

const expected = '中文测试 English \\(x^2\\) 【1†src】\n第二行';
const adapter = getClipboardAdapter();
await adapter.writeText(expected);
const back = await adapter.readText();

if (back === expected) {
  console.log('ROUNDTRIP-OK');
} else {
  console.log('expected:', JSON.stringify(expected));
  console.log('actual  :', JSON.stringify(back));
  process.exitCode = 1;
}
