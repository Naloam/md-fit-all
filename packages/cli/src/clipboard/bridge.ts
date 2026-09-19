import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { ClipboardAdapter } from './index.js';

/**
 * Persistent PowerShell clipboard bridge.
 *
 * `mdfit clip` normally pays ~600 ms for two PowerShell startups per call.
 * The daemon keeps ONE powershell process alive, speaking a JSONL protocol
 * over stdin/stdout (base64 payloads, so codepages never matter), which
 * cuts clipboard I/O to tens of milliseconds.
 *
 * Protocol: one line of JSON in → one line of JSON out, strictly serial.
 *   {"op":"read"}                      → {"ok":true,"b64":"..."} | {"ok":false,"error":"..."}
 *   {"op":"write","b64":"..."}         → {"ok":true} | {"ok":false,"error":"..."}
 */

const BRIDGE_SCRIPT = `
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  try {
    $req = $line | ConvertFrom-Json
    switch ($req.op) {
      'read' {
        $t = Get-Clipboard -Raw
        if ($null -eq $t) { Start-Sleep -Milliseconds 120; $t = Get-Clipboard -Raw }
        if ($null -eq $t) { $t = '' }
        $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($t))
        [Console]::Out.WriteLine(('{"ok":true,"b64":"' + $b64 + '"}'))
      }
      'write' {
        $t = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($req.b64))
        Set-Clipboard -Value $t
        [Console]::Out.WriteLine('{"ok":true}')
      }
      default { [Console]::Out.WriteLine('{"ok":false,"error":"unknown op"}') }
    }
  } catch {
    $msg = ($_.Exception.Message -replace '[\\\\"]', ' ')
    [Console]::Out.WriteLine(('{"ok":false,"error":"' + $msg + '"}'))
  }
}`;

interface BridgeResponse {
  ok: boolean;
  b64?: string;
  error?: string;
}

export class PersistentClipboardBridge implements ClipboardAdapter {
  private child = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', BRIDGE_SCRIPT],
    {
      windowsHide: true,
    },
  );
  private pending: ((res: BridgeResponse) => void) | null = null;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly timeoutMs = 4000;

  constructor() {
    this.child.stdout.setEncoding('utf8');
    createInterface({ input: this.child.stdout }).on('line', (line: string) => {
      const cb = this.pending;
      this.pending = null;
      if (!cb) return;
      try {
        cb(JSON.parse(line) as BridgeResponse);
      } catch {
        cb({ ok: false, error: `bad bridge response: ${line.slice(0, 120)}` });
      }
    });
    // Keep stderr drained so a chatty host never blocks the pipe.
    this.child.stderr.resume();
  }

  private request(payload: Record<string, unknown>): Promise<BridgeResponse> {
    const run = this.tail.then(
      () =>
        new Promise<BridgeResponse>((resolve) => {
          const timer = setTimeout(
            () => resolve({ ok: false, error: 'bridge timeout' }),
            this.timeoutMs,
          );
          this.pending = (res) => {
            clearTimeout(timer);
            resolve(res);
          };
          this.child.stdin.write(`${JSON.stringify(payload)}\n`, 'utf8');
        }),
    );
    this.tail = run.catch(() => undefined);
    return run;
  }

  async readText(): Promise<string> {
    // Get-Clipboard races with clipboard viewers and can transiently return
    // empty right after a write; retry once before surfacing the result.
    let text = await this.readOnce();
    if (text === '') {
      await new Promise((resolve) => setTimeout(resolve, 120));
      text = await this.readOnce();
    }
    return text;
  }

  private async readOnce(): Promise<string> {
    const res = await this.request({ op: 'read' });
    if (!res.ok || res.b64 === undefined) {
      throw new Error(res.error ?? 'bridge read failed');
    }
    return Buffer.from(res.b64, 'base64').toString('utf8');
  }

  async writeText(text: string): Promise<void> {
    const b64 = Buffer.from(text, 'utf8').toString('base64');
    let lastError = 'bridge write failed';
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await this.request({ op: 'write', b64 });
      if (res.ok) return;
      lastError = res.error ?? lastError;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(lastError);
  }

  async readHtml(): Promise<string | undefined> {
    return undefined; // HTML flavor goes through the one-shot adapter
  }

  alive(): boolean {
    return this.child.exitCode === null;
  }

  stop(): void {
    this.child.stdin.end();
    this.child.kill();
  }
}
