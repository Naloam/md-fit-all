#!/usr/bin/env node
import { Command } from 'commander';
import { registerConvertCommand } from './commands/convert.js';
import { registerClipCommand } from './commands/clip.js';
import { registerProfilesCommand } from './commands/profiles.js';
import { registerRulesCommand } from './commands/rules.js';
import { registerConfigCommand } from './commands/config.js';

const program = new Command();

program
  .name('mdfit')
  .description(
    'Fit any Markdown into any editor. Convert LLM chat output into Obsidian/Typora/GitHub flavored Markdown.',
  )
  .version('0.1.0');

registerConvertCommand(program);
registerClipCommand(program);
registerProfilesCommand(program);
registerRulesCommand(program);
registerConfigCommand(program);

program.parseAsync().catch((err: Error) => {
  console.error(`mdfit: ${err.message}`);
  process.exit(1);
});
