// Minimal: does the persistent bridge write CJK correctly?
import { spawn } from 'node:child_process';

const SCRIPT = `
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  try {
    $req = $line | ConvertFrom-Json
    switch ($req.op) {
      'write' {
        $t = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($req.b64))
        Set-Clipboard -Value $t
        [Console]::Out.WriteLine('{"ok":true}')
      }
      'read' {
        $t = Get-Clipboard -Raw
        $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($t))
        [Console]::Out.WriteLine(('{"ok":true,"b64":"' + $b64 + '"}'))
      }
    }
  } catch {
    $msg = ($_.Exception.Message -replace '[\\\\"]', ' ')
    [Console]::Out.WriteLine(('{"ok":false,"error":"' + $msg + '"}'))
  }
}`;

const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', SCRIPT], {
  windowsHide: true,
});
child.stdout.setEncoding('utf8');
child.stderr.resume();

let response = null;
child.stdout.on('data', (d) => {
  for (const line of d.split('\n')) {
    if (line.trim().startsWith('{')) response = JSON.parse(line.trim());
  }
});

function request(payload) {
  return new Promise((resolve) => {
    const wait = setInterval(() => {
      if (response) {
        clearInterval(wait);
        const r = response;
        response = null;
        resolve(r);
      }
    }, 20);
    child.stdin.write(JSON.stringify(payload) + '\n');
  });
}

await new Promise((r) => setTimeout(r, 1500)); // let PS boot

const text = '# 中文标题\n\n公式 $x^2$ 【1†s】';
await request({ op: 'write', b64: Buffer.from(text, 'utf8').toString('base64') });
const back = await request({ op: 'read' });
const decoded = Buffer.from(back.b64, 'base64').toString('utf8');
console.log('roundtrip ok:', decoded === text);
console.log('actual:', JSON.stringify(decoded));
child.stdin.end();
process.exit(decoded === text ? 0 : 1);
