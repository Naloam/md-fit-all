// Self-contained end-to-end: seed clipboard via clip.exe, run the GLOBAL mdfit,
// read back via Get-Clipboard. Run: node scripts/alias-test.mjs
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';

function pipeTo(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
    );
    child.stdin.end(input);
  });
}

function readClipboard() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard -Raw',
      ],
      { windowsHide: true },
    );
    let out = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (d) => (out += d));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(out.replace(/\r?\n$/, '').replaceAll('\r\n', '\n'))
        : reject(new Error(`read failed (${code})`)),
    );
    child.stdin.end();
  });
}

const seed = '### Typora 试用\n\n勾股定理 \\(a^2+b^2=c^2\\)，欧拉公式 \\[e^{i\\pi}+1=0\\]。';
await pipeTo('cmd.exe', ['/c', 'chcp 65001>nul & clip'], Buffer.from(seed, 'utf8'));

execFileSync('mdfit', ['clip', '--to', 'typora', '-y'], { stdio: 'inherit', shell: true });

const out = await readClipboard();
const checks = {
  'heading promoted': out.includes('# Typora 试用'),
  'inline math kept inline': out.includes('$a^2+b^2=c^2$'),
  'display math as block': out.includes('$$\ne^{i\\pi}+1=0\n$$'),
  'no escaped dollars': !out.includes('\\$'),
};
let failed = 0;
for (const [name, ok] of Object.entries(checks)) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
if (failed > 0) console.log('\nactual output:\n' + out);
console.log(failed === 0 ? 'E2E-OK' : 'E2E-FAILED');
process.exitCode = failed === 0 ? 0 : 1;
