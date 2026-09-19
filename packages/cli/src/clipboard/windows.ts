import { spawn } from 'node:child_process';
import type { ClipboardAdapter } from './index.js';

/** PowerShell one-liner prefix: force UTF-8 so CJK survives the pipe. */
const UTF8 = '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;';

function runPowerShell(script: string, input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      windowsHide: true,
    });
    let out = '';
    let err = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d: string) => (out += d));
    child.stderr.on('data', (d: string) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`powershell exited ${code}: ${err.trim()}`));
    });
    if (input !== undefined) child.stdin.end(input, 'utf8');
    else child.stdin.end();
  });
}

/** Strip the CF_HTML header (Version/StartHTML offsets) — everything before the first '<'. */
function stripCfHtmlHeader(raw: string): string {
  const idx = raw.indexOf('<');
  return idx > 0 ? raw.slice(idx) : raw;
}

function pipeTo(cmd: string, args: string[], input: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
    );
    child.stdin.end(input);
  });
}

export class WindowsClipboard implements ClipboardAdapter {
  async readText(): Promise<string> {
    // PowerShell appends a trailing CRLF to the output record; the Windows
    // clipboard itself also stores CRLF. Normalize to LF for the pipeline.
    const raw = await runPowerShell(`${UTF8} Get-Clipboard -Raw`);
    return raw.replace(/\r?\n$/, '').replaceAll('\r\n', '\n');
  }

  async readHtml(): Promise<string | undefined> {
    try {
      const raw = await runPowerShell(`${UTF8} Get-Clipboard -Format Html`);
      const html = stripCfHtmlHeader(raw);
      return html.trim().length > 0 ? html : undefined;
    } catch {
      return undefined; // no HTML flavor on the clipboard — fine
    }
  }

  async writeText(text: string): Promise<void> {
    // Primary: clip.exe behind `chcp 65001` so it decodes raw UTF-8 stdin.
    // (Feeding a UTF-8 BOM directly does NOT work — clip.exe is not a BOM
    // consumer and stores the BOM bytes as GBK mojibake on zh-CN systems.)
    try {
      await pipeTo('cmd.exe', ['/c', 'chcp 65001>nul & clip'], Buffer.from(text, 'utf8'));
      return;
    } catch {
      // Fallback: PowerShell Set-Clipboard over a base64 pipe (codepage-safe).
      const b64 = Buffer.from(text, 'utf8').toString('base64');
      const script =
        '[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($input -join "`n"))) | Set-Clipboard';
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await runPowerShell(script, b64);
          return;
        } catch (err) {
          lastError = err;
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
      throw lastError instanceof Error ? lastError : new Error(String(lastError));
    }
  }
}
