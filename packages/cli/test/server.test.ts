import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ClipboardAdapter } from '../src/clipboard/index.js';
import { startServer } from '../src/server.js';

class FakeClipboard implements ClipboardAdapter {
  text = '';
  reads = 0;
  writes = 0;
  async readText(): Promise<string> {
    this.reads++;
    return this.text;
  }
  async readHtml(): Promise<string | undefined> {
    return undefined;
  }
  async writeText(text: string): Promise<void> {
    this.writes++;
    this.text = text;
  }
}

const fake = new FakeClipboard();
let base = '';
let close: (() => Promise<void>) | undefined;

beforeAll(async () => {
  const { server, port } = await startServer({ clipboard: fake }, 0);
  base = `http://127.0.0.1:${port}`;
  close = () => new Promise((resolve) => server.close(() => resolve(undefined)));
});

afterAll(async () => {
  await close?.();
});

describe('mdfit serve daemon', () => {
  it('answers /health', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it('converts via /convert with profile layer', async () => {
    const res = await fetch(`${base}/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        markdown: '### H\n\n公式 \\(x^2\\)',
        from: 'chatgpt',
        to: 'github',
        profile: { headings: 'keep' },
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { markdown: string; source: string };
    expect(body.source).toBe('chatgpt');
    expect(body.markdown).toContain('### H'); // profile kept the heading depth
    expect(body.markdown).toContain('$x^2$');
  });

  it('rejects /convert without markdown', async () => {
    const res = await fetch(`${base}/convert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(res.status).toBe(400);
  });

  it('transforms the clipboard via /clip end to end', async () => {
    fake.text = '### 标题\n\n公式 \\(a^2\\) 与引用【1†s】';
    const res = await fetch(`${base}/clip`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'obsidian' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string; added: number };
    expect(body.source).toBe('chatgpt');
    expect(fake.reads).toBe(1);
    expect(fake.writes).toBe(1);
    expect(fake.text).toContain('# 标题');
    expect(fake.text).toContain('$a^2$');
    expect(fake.text).not.toContain('【1†');
  });

  it('returns 400 for an empty clipboard', async () => {
    fake.text = '   ';
    const res = await fetch(`${base}/clip`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'obsidian' }),
    });
    expect(res.status).toBe(400);
  });

  it('404s unknown routes', async () => {
    const res = await fetch(`${base}/nope`);
    expect(res.status).toBe(404);
  });
});
