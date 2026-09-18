import type { Command } from 'commander';
import { PRE_RULES, AST_RULES } from 'mdfit-core';

export function registerRulesCommand(program: Command): void {
  const cmd = program.command('rules').description('list conversion rules and their config keys');

  cmd
    .command('list')
    .description('list all rules')
    .action(() => {
      console.log('pre-rules (string level):');
      for (const r of PRE_RULES) console.log(`  ${r.name.padEnd(18)} ${r.description}`);
      console.log('ast-rules (structure level):');
      for (const r of AST_RULES) console.log(`  ${r.name.padEnd(18)} ${r.description}`);
      console.log('output style (via target profile):');
      console.log('  bullet              list marker: - * +');
      console.log('  emphasis            emphasis marker: * _');
    });

  cmd
    .command('show <name>')
    .description('show one rule in detail')
    .action((name: string) => {
      const rule = [...PRE_RULES, ...AST_RULES].find((r) => r.name === name);
      if (!rule) {
        console.error(`Unknown rule "${name}". Try: mdfit rules list`);
        process.exitCode = 1;
        return;
      }
      console.log(JSON.stringify({ name: rule.name, description: rule.description }, null, 2));
    });

  cmd.action(() => cmd.help());
}
