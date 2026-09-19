import { build } from 'esbuild';

const HEADER = `// ==UserScript==
// @name         mdfit — Copy as Markdown
// @namespace    https://github.com/Naloam/md-fit-all
// @version      0.1.0
// @description  Copy ChatGPT/Claude/Gemini answers as clean Markdown for Obsidian/Typora/GitHub — math, tables and code fixed, images rescued into the paste before their URLs expire.
// @author       Naloam
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://gemini.google.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==
`;

await build({
  entryPoints: ['src/main.user.ts'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  outfile: 'dist/mdfit.user.js',
  banner: { js: HEADER },
  sourcemap: false,
  legalComments: 'none',
});

console.log('built dist/mdfit.user.js');
