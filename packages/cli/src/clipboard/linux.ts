import { spawn } from 'node:child_process';
import type { ClipboardAdapter } from './index.js';

function run(cmd: string, args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let out = '';
    let err = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d: string) => (out += d));
    child.stderr.on('data', (d: string) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}: ${err.trim()}`));
    });
    if (input !== undefined) child.stdin.end(input, 'utf8');
    else child.stdin.end();
  });
}

async function exists(cmd: string): Promise<boolean> {
  try {
    await run('sh', ['-c', `command -v ${cmd}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Linux adapter: prefers wl-clipboard (Wayland), falls back to xclip (X11).
 * HTML flavor reading is supported by both but is best-effort in MVP.
 */
export class LinuxClipboard implements ClipboardAdapter {
  async readText(): Promise<string> {
    if (await exists('wl-paste')) return run('wl-paste', ['--no-newline']);
    if (await exists('xclip')) return run('xclip', ['-o', '-selection', 'clipboard']);
    throw new Error('No clipboard tool found. Install wl-clipboard or xclip.');
  }

  async readHtml(): Promise<string | undefined> {
    try {
      if (await exists('wl-paste')) {
        const html = await run('wl-paste', ['--no-newline', '--type', 'text/html']);
        return html.trim().length > 0 ? html : undefined;
      }
      if (await exists('xclip')) {
        const html = await run('xclip', ['-o', '-selection', 'clipboard', '-t', 'text/html']);
        return html.trim().length > 0 ? html : undefined;
      }
    } catch {
      // fall through
    }
    return undefined;
  }

  async writeText(text: string): Promise<void> {
    if (await exists('wl-copy')) {
      await run('wl-copy', [], text);
      return;
    }
    if (await exists('xclip')) {
      await run('xclip', ['-i', '-selection', 'clipboard'], text);
      return;
    }
    throw new Error('No clipboard tool found. Install wl-clipboard or xclip.');
  }
}
