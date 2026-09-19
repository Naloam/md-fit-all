// Minimal: does clip.exe + BOM seed CJK correctly (no daemon involved)?
import { spawn } from 'node:child_process';

const text = '# 中文标题 公式';

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
      code === 0 ? resolve(out.replace(/\r?\n$/, '')) : reject(new Error('read failed')),
    );
    child.stdin.end();
  });
}

// Variant A: BOM (current broken behavior)
const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]);
await pipeTo('clip.exe', [], bom);
const backA = await readClipboard();
console.log('A) BOM only:', backA === text, JSON.stringify(backA));

// Variant B: chcp 65001 + raw UTF-8 (no BOM)
await pipeTo('cmd.exe', ['/c', 'chcp 65001>nul & clip'], Buffer.from(text, 'utf8'));
const backB = await readClipboard();
console.log('B) chcp 65001:', backB === text, JSON.stringify(backB));

process.exit(backB === text ? 0 : 1);
