import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const spawn = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ spawn }));

const origPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

function setPlatform(value: string): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

interface Call {
  cmd: string;
  args: string[];
  input?: string;
}

/** Wire spawn to respond per command name; returns the call log. */
function fakeSpawn(results: Record<string, { code: number; out?: string }>): Call[] {
  const calls: Call[] = [];
  spawn.mockImplementation((cmd: string, args: string[]) => {
    calls.push({ cmd, args });
    const r = results[cmd] ?? results['*'] ?? { code: 0, out: '' };
    return {
      stdout: {
        setEncoding: () => undefined,
        on: (event: string, cb: (d: string) => void) => {
          if (event === 'data' && r.out) queueMicrotask(() => cb(r.out as string));
        },
        resume: () => undefined,
      },
      stderr: { setEncoding: () => undefined, on: () => undefined, resume: () => undefined },
      on: (event: string, cb: (arg?: unknown) => void) => {
        if (event === 'close') setTimeout(() => cb(r.code), 0);
      },
      stdin: {
        end: (data?: string) => {
          const last = calls[calls.length - 1];
          if (last && data !== undefined) last.input = String(data);
        },
      },
    };
  });
  return calls;
}

beforeEach(() => {
  vi.resetModules();
  spawn.mockReset();
});

afterEach(() => {
  if (origPlatform) Object.defineProperty(process, 'platform', origPlatform);
});

describe('macOS clipboard adapter (command construction)', () => {
  it('uses pbpaste for reads and pbcopy for writes', async () => {
    setPlatform('darwin');
    const calls = fakeSpawn({ pbpaste: { code: 0, out: 'hello' } });
    const { getClipboardAdapter } = await import('../src/clipboard/index.js');
    const adapter = getClipboardAdapter();

    const out = await adapter.readText();
    expect(out).toBe('hello');
    expect(calls.some((c) => c.cmd === 'pbpaste')).toBe(true);

    await adapter.writeText('x');
    const pbcopy = calls.find((c) => c.cmd === 'pbcopy');
    expect(pbcopy?.input).toBe('x');
  });
});

describe('Linux clipboard adapter (command construction)', () => {
  it('prefers wl-clipboard when present', async () => {
    setPlatform('linux');
    const calls = fakeSpawn({
      sh: { code: 0, out: '/usr/bin/wl-paste\n' },
      'wl-paste': { code: 0, out: 'linux text' },
      'wl-copy': { code: 0 },
    });
    const { getClipboardAdapter } = await import('../src/clipboard/index.js');
    const adapter = getClipboardAdapter();

    expect(await adapter.readText()).toBe('linux text');
    await adapter.writeText('y');
    expect(calls.some((c) => c.cmd === 'wl-copy')).toBe(true);
    expect(calls.some((c) => c.cmd === 'xclip')).toBe(false);
  });

  it('falls back to xclip when wl-clipboard is missing', async () => {
    setPlatform('linux');
    const calls: Call[] = [];
    // sh probes must distinguish which tool is being looked up.
    spawn.mockImplementation((cmd: string, args: string[]) => {
      calls.push({ cmd, args });
      const line = `${cmd} ${args.join(' ')}`;
      const isWlProbe = /command -v wl-(paste|copy)/.test(line);
      const r = isWlProbe
        ? { code: 1, out: '' }
        : cmd === 'xclip'
          ? { code: 0, out: 'xclip text' }
          : { code: 0, out: '' };
      return {
        stdout: {
          setEncoding: () => undefined,
          on: (event: string, cb: (d: string) => void) => {
            if (event === 'data' && r.out) queueMicrotask(() => cb(r.out));
          },
          resume: () => undefined,
        },
        stderr: { setEncoding: () => undefined, on: () => undefined, resume: () => undefined },
        on: (event: string, cb: (arg?: unknown) => void) => {
          if (event === 'close') setTimeout(() => cb(r.code), 0);
        },
        stdin: {
          end: (data?: string) => {
            const last = calls[calls.length - 1];
            if (last && data !== undefined) last.input = String(data);
          },
        },
      };
    });
    const { getClipboardAdapter } = await import('../src/clipboard/index.js');
    const adapter = getClipboardAdapter();

    expect(await adapter.readText()).toBe('xclip text');
    expect(calls.some((c) => c.cmd === 'xclip' && c.args.includes('-selection'))).toBe(true);
  });

  it('fails with a helpful error when no clipboard tool exists', async () => {
    setPlatform('linux');
    fakeSpawn({ '*': { code: 1 } });
    const { getClipboardAdapter } = await import('../src/clipboard/index.js');
    const adapter = getClipboardAdapter();

    await expect(adapter.readText()).rejects.toThrow(/wl-clipboard or xclip/);
  });
});
