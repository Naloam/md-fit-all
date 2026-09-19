import type { Command } from 'commander';
import { DEFAULT_PORT, startServer } from '../server.js';
import { getClipboardAdapter } from '../clipboard/index.js';
import { PersistentClipboardBridge } from '../clipboard/bridge.js';

/**
 * mdfit serve — resident daemon.
 *
 * Keeps one PowerShell clipboard bridge alive so hotkey calls hit
 * `POST /clip` in tens of milliseconds instead of ~1.4 s of process
 * startups. Pair with scripts/hotkey.ahk (it prefers the daemon and
 * falls back to a direct `mdfit clip` run).
 */
export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('run a resident conversion daemon on 127.0.0.1 (fast hotkey path)')
    .option(
      '-p, --port <number>',
      `port to listen on (default: ${DEFAULT_PORT})`,
      String(DEFAULT_PORT),
    )
    .action(async (opts: Record<string, unknown>) => {
      const port = Number(opts.port ?? DEFAULT_PORT);
      const bridge =
        process.platform === 'win32' ? new PersistentClipboardBridge() : getClipboardAdapter();
      const { server, port: actual } = await startServer(
        {
          clipboard: {
            readText: () => bridge.readText(),
            writeText: (t) => bridge.writeText(t),
            readHtml: () => Promise.resolve(undefined), // /clip uses plain text
          },
        },
        port,
      );

      const shutdown = () => {
        server.close();
        if (bridge instanceof PersistentClipboardBridge) bridge.stop();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      console.log(`mdfit serve listening on http://127.0.0.1:${actual} (Ctrl+C to stop)`);
      console.log('endpoints: GET /health · POST /convert · POST /clip');
    });
}
