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

export class WindowsClipboard implements ClipboardAdapter {
  async readText(): Promise<string> {
    // PowerShell appends a trailing CRLF to the output record — remove it.
    return (await runPowerShell(`${UTF8} Get-Clipboard -Raw`)).replace(/\r?\n$/, '');
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
    // Pipe as base64: PowerShell 5.1 decodes piped stdin with the console
    // codepage (GBK on zh-CN), which would corrupt UTF-8 CJK. Base64 is
    // pure ASCII and immune to every codepage.
    const b64 = Buffer.from(text, 'utf8').toString('base64');
    const script =
      '[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($input -join "`n"))) | Set-Clipboard';
    await runPowerShell(script, b64);
  }
}
