import type { Command } from 'commander';
import { SOURCE_PROFILES, TARGET_PROFILES, BASE_RULES } from 'mdfit-core';

export function registerProfilesCommand(program: Command): void {
  const cmd = program.command('profiles').description('list built-in source/target profiles');

  cmd
    .command('list')
    .description('list all profiles')
    .action(() => {
      console.log('sources:');
      for (const p of Object.values(SOURCE_PROFILES)) {
        console.log(`  ${p.name.padEnd(10)} ${p.description}`);
      }
      console.log('targets:');
      for (const p of Object.values(TARGET_PROFILES)) {
        console.log(`  ${p.name.padEnd(10)} ${p.description}`);
      }
    });

  cmd
    .command('show <name>')
    .description('show one profile in detail')
    .action((name: string) => {
      const source = Object.values(SOURCE_PROFILES).find((p) => p.name === name);
      if (source) {
        console.log(JSON.stringify(source, null, 2));
        return;
      }
      const target = Object.values(TARGET_PROFILES).find((p) => p.name === name);
      if (target) {
        console.log(JSON.stringify(target, null, 2));
        return;
      }
      console.error(`Unknown profile "${name}". Try: mdfit profiles list`);
      process.exitCode = 1;
    });

  cmd
    .command('base')
    .description('show the base rule defaults every profile layers on')
    .action(() => {
      console.log(JSON.stringify(BASE_RULES, null, 2));
    });

  cmd.action(() => cmd.help());
}
