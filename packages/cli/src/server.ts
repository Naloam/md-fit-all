import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { convertDetailed } from 'mdfit-core';
import type { ConvertOptions, RuleConfig, SourceFlavor, TargetFlavor } from 'mdfit-core';
import type { ClipboardAdapter } from './clipboard/index.js';
import { diffStats } from './diff.js';

export const DEFAULT_PORT = 7317;

interface ConvertBody {
  markdown: string;
  from?: SourceFlavor | 'auto';
  to?: TargetFlavor;
  rules?: Partial<RuleConfig>;
  profile?: Partial<RuleConfig>;
}

interface ClipBody {
  from?: SourceFlavor | 'auto';
  to?: TargetFlavor;
  rules?: Partial<RuleConfig>;
  profile?: Partial<RuleConfig>;
}

export interface ServeDeps {
  clipboard: ClipboardAdapter;
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(payload);
}

export function buildServer(deps: ServeDeps): Server {
  return createServer(async (req, res) => {
    const url = (req.url ?? '/').split('?')[0];
    try {
      if (req.method === 'GET' && url === '/health') {
        sendJson(res, 200, { ok: true, version: 'mdfit-server' });
        return;
      }

      if (req.method === 'POST' && url === '/convert') {
        const body = JSON.parse((await readBody(req)) || '{}') as ConvertBody;
        if (typeof body.markdown !== 'string') {
          sendJson(res, 400, { error: 'markdown (string) is required' });
          return;
        }
        const result = convertDetailed(body.markdown, {
          from: body.from ?? 'auto',
          to: body.to ?? 'obsidian',
          rules: body.rules,
          profile: body.profile,
        } satisfies ConvertOptions);
        sendJson(res, 200, { markdown: result.markdown, source: result.source });
        return;
      }

      if (req.method === 'POST' && url === '/clip') {
        const body = JSON.parse((await readBody(req)) || '{}') as ClipBody;
        const input = await deps.clipboard.readText();
        if (input.trim().length === 0) {
          sendJson(res, 400, { error: 'clipboard is empty' });
          return;
        }
        const result = convertDetailed(input, {
          from: body.from ?? 'auto',
          to: body.to ?? 'obsidian',
          rules: body.rules,
          profile: body.profile,
        } satisfies ConvertOptions);
        await deps.clipboard.writeText(result.markdown);
        const { added, removed } = diffStats(input, result.markdown);
        sendJson(res, 200, { source: result.source, added, removed });
        return;
      }

      sendJson(res, 404, { error: `no route: ${req.method} ${url}` });
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
  });
}

/** Start the daemon on 127.0.0.1. Pass port 0 for an ephemeral port (tests). */
export function startServer(
  deps: ServeDeps,
  port = DEFAULT_PORT,
): Promise<{ server: Server; port: number }> {
  const server = buildServer(deps);
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const actual = (server.address() as AddressInfo).port;
      resolve({ server, port: actual });
    });
  });
}
