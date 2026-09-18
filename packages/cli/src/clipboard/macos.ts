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

/** macOS adapter: pbpaste/pbcopy for text. HTML flavor is not supported in MVP. */
export class MacClipboard implements ClipboardAdapter {
  async readText(): Promise<string> {
    return run('pbpaste', []);
  }

  async readHtml(): Promise<string | undefined> {
    return undefined;
  }

  async writeText(text: string): Promise<void> {
    await run('pbcopy', [], text);
  }
}
