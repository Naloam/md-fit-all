// Self-contained Windows clipboard roundtrip check (no internal dist imports).
// Run: node scripts/clip-roundtrip.mjs
import { spawn } from 'node:child_process';

function pipeTo(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.stdin.end(input);
  });
}

function readClipboard() {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard -Raw',
    ], { windowsHide: true });
    let out = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (d) => (out += d));
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(out.replace(/\r?\n$/, '')) : reject(new Error(`read failed (${code})`))));
    child.stdin.end();
  });
}

const expected = '中文测试 English \\(x^2\\) 【1†src】\n第二行';
const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(expected, 'utf8')]);
await pipeTo('clip.exe', [], bom);
const back = await readClipboard();

if (back === expected) {
  console.log('ROUNDTRIP-OK');
} else {
  console.log('expected:', JSON.stringify(expected));
  console.log('actual  :', JSON.stringify(back));
  process.exitCode = 1;
}
