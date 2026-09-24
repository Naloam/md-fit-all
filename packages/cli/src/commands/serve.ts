import type { Command } from 'commander';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DEFAULT_PORT, startServer } from '../server.js';
import { getClipboardAdapter } from '../clipboard/index.js';
import { PersistentClipboardBridge } from '../clipboard/bridge.js';

/**
 * Autostart via the user's Startup folder (no admin rights needed, unlike
 * `schtasks /SC ONLOGON`). A tiny VBS launcher starts the daemon fully
 * hidden — no console window flashes at logon.
 */
const VBS_NAME = 'mdfit-serve.vbs';

function startupVbsPath(): string {
  return join(
    homedir(),
    'AppData',
    'Roaming',
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'Startup',
    VBS_NAME,
  );
}

const VBS_CONTENT = [
  "' mdfit serve autostart — installed by `mdfit serve --install`",
  "' Remove with `mdfit serve --uninstall`.",
  'CreateObject("Wscript.Shell").Run "cmd /c mdfit serve", 0, False',
  '',
].join('\r\n');

function installAutostart(): number {
  try {
    const path = startupVbsPath();
    if (existsSync(path)) {
      console.log(`Autostart already installed (${VBS_NAME}) — overwriting.`);
    }
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, VBS_CONTENT, 'utf8');
    console.log(`Autostart installed: ${path}`);
    console.log('The daemon starts hidden at next logon. Start it now with `mdfit serve`.');
    return 0;
  } catch (err) {
    console.error(
      `Failed to install autostart: ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
}

function uninstallAutostart(): number {
  const path = startupVbsPath();
  if (!existsSync(path)) {
    console.log('Autostart is not installed.');
    return 0;
  }
  try {
    unlinkSync(path);
    console.log(`Autostart removed: ${path}`);
    return 0;
  } catch (err) {
    console.error(
      `Failed to remove autostart: ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
}

/**
 * mdfit serve — resident daemon.
 *
 * Keeps one PowerShell clipboard bridge alive so hotkey calls hit
 * `POST /clip` in tens of milliseconds instead of ~1.4 s of process
 * startups. Pair with scripts/hotkey.ahk (it prefers the daemon and
 * falls back to a direct `mdfit clip` run).
 */
export function registerServeCommand(program: Command): void {
  const serve = program
    .command('serve')
    .description('run a resident conversion daemon on 127.0.0.1 (fast hotkey path)')
    .option(
      '-p, --port <number>',
      `port to listen on (default: ${DEFAULT_PORT})`,
      String(DEFAULT_PORT),
    )
    .option('--install', 'register a hidden logon autostart task for this daemon and exit')
    .option('--uninstall', 'remove the autostart task and exit');

  serve.action(async (opts: Record<string, unknown>) => {
    if (opts.install) process.exit(installAutostart());
    if (opts.uninstall) process.exit(uninstallAutostart());

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
