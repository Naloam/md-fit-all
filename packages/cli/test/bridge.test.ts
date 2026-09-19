import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PersistentClipboardBridge } from '../src/clipboard/bridge.js';

// The bridge talks to the real OS clipboard, which only exists in an
// interactive desktop session — CI runners (headless service sessions)
// have none. Run locally on Windows instead.
const windows = process.platform === 'win32' && !process.env.CI;
const d = windows ? describe : describe.skip;

let bridge: PersistentClipboardBridge | undefined;

beforeAll(() => {
  if (windows) bridge = new PersistentClipboardBridge();
});

afterAll(() => {
  bridge?.stop();
});

d('PersistentClipboardBridge (Windows)', () => {
  it('round-trips CJK text', async () => {
    const b = bridge!;
    await b.writeText('中文 bridge 测试\n第二行 \\(x^2\\)');
    expect(await b.readText()).toBe('中文 bridge 测试\n第二行 \\(x^2\\)');
  });

  it('handles several sequential round-trips quickly', async () => {
    const b = bridge!;
    for (let i = 0; i < 5; i++) {
      const payload = `第${i}次 roundtrip`;
      await b.writeText(payload);
      expect(await b.readText()).toBe(payload);
    }
  });

  it('reports errors on unknown ops instead of hanging', async () => {
    const b = bridge as unknown as {
      request: (p: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
    };
    const res = await b.request({ op: 'bogus' });
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });
});
