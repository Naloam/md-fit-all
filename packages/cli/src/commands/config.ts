import type { Command } from 'commander';
import { loadConfig, saveConfig, configPath } from '../config.js';
import type { SourceFlavor, TargetFlavor } from 'mdfit-core';

const SOURCES = ['auto', 'chatgpt', 'claude', 'gemini', 'generic', 'html'];
const TARGETS = ['obsidian', 'typora', 'github', 'commonmark'];

export function registerConfigCommand(program: Command): void {
  const cmd = program.command('config').description('read/write persistent defaults');

  cmd
    .command('get [key]')
    .description('show config (all, or one key: defaultFrom | defaultTo)')
    .action((key?: string) => {
      const config = loadConfig();
      if (key === undefined) {
        console.log(JSON.stringify(config, null, 2));
        console.error(`(from ${configPath()})`);
        return;
      }
      console.log(String(config[key as keyof typeof config] ?? ''));
    });

  cmd
    .command('set <key> <value>')
    .description('set defaultFrom | defaultTo')
    .action((key: string, value: string) => {
      const config = loadConfig();
      if (key === 'defaultFrom') {
        if (!SOURCES.includes(value)) {
          console.error(`defaultFrom must be one of: ${SOURCES.join(', ')}`);
          process.exitCode = 1;
          return;
        }
        config.defaultFrom = value as SourceFlavor | 'auto';
      } else if (key === 'defaultTo') {
        if (!TARGETS.includes(value)) {
          console.error(`defaultTo must be one of: ${TARGETS.join(', ')}`);
          process.exitCode = 1;
          return;
        }
        config.defaultTo = value as TargetFlavor;
      } else {
        console.error(`Unknown key "${key}". Supported: defaultFrom, defaultTo`);
        process.exitCode = 1;
        return;
      }
      saveConfig(config);
      console.log(`saved ${key}=${value}`);
    });

  cmd.action(() => cmd.help());
}
