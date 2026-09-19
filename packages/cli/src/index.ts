#!/usr/bin/env node
import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { registerConvertCommand } from './commands/convert.js';
import { registerClipCommand } from './commands/clip.js';
import { registerProfilesCommand } from './commands/profiles.js';
import { registerRulesCommand } from './commands/rules.js';
import { registerConfigCommand } from './commands/config.js';
import { registerServeCommand } from './commands/serve.js';

const program = new Command();

program
  .name('mdfit')
  .description(
    'Fit any Markdown into any editor. Convert LLM chat output into Obsidian/Typora/GitHub flavored Markdown.',
  )
  .version(pkg.version);

registerConvertCommand(program);
registerClipCommand(program);
registerProfilesCommand(program);
registerRulesCommand(program);
registerConfigCommand(program);
registerServeCommand(program);

program.parseAsync().catch((err: Error) => {
  console.error(`mdfit: ${err.message}`);
  process.exit(1);
});
