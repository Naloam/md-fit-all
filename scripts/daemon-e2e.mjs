// End-to-end daemon timing test: start `mdfit serve`, seed the clipboard,
// hit POST /clip with curl, verify the result and report latency.
// Run: node scripts/daemon-e2e.mjs
import { spawn, spawnSync, execFileSync } from 'node:child_process';

const seed = '### Daemon 实测\n\n公式 \\(e^{i\\pi}+1=0\\) 与引用【1†s】';

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
      code === 0 ? resolve(out.replace(/\r?\n$/, '')) : reject(new Error(`read failed`)),
    );
    child.stdin.end();
  });
}

const daemon = spawn('mdfit', ['serve'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
daemon.stdout.setEncoding('utf8');
await new Promise((resolve) => {
  daemon.stdout.on('data', (d) => (d.includes('listening') ? resolve() : undefined));
  setTimeout(resolve, 3000);
});

try {
  await pipeTo('cmd.exe', ['/c', 'chcp 65001>nul & clip'], Buffer.from(seed, 'utf8'));

  const t0 = Date.now();
  const res = execFileSync(
    'curl.exe',
    [
      '-s',
      '-X',
      'POST',
      'http://127.0.0.1:7317/clip',
      '-H',
      'Content-Type: application/json',
      '-d',
      '{"to":"obsidian"}',
    ],
    { encoding: 'utf8' },
  );
  const curlMs = Date.now() - t0;

  const out = await readClipboard();
  const checks = {
    'heading promoted': out.includes('# Daemon 实测'),
    'math converted': out.includes('$e^{i\\pi}+1=0$'),
    'citation stripped': !out.includes('【1†'),
  };
  console.log('daemon /clip response:', res);
  console.log(`curl roundtrip: ${curlMs} ms`);
  console.log('clipboard now:', JSON.stringify(out.slice(0, 200)));
  for (const [name, ok] of Object.entries(checks)) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);

  const t1 = Date.now();
  spawnSync('mdfit', ['clip', '--to', 'obsidian', '-y'], { shell: true, encoding: 'utf8' });
  console.log(`mdfit clip (daemon fast path): ${Date.now() - t1} ms`);

  process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
} finally {
  daemon.kill();
  spawnSync('taskkill', ['/F', '/T', '/PID', String(daemon.pid)], { stdio: 'ignore' });
}
