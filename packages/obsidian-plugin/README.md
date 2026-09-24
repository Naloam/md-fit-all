# mdfit for Obsidian

Auto-converts pasted LLM output (ChatGPT / Claude / Gemini) into
Obsidian-flavored Markdown the moment it lands in a note: math delimiters,
heading levels, citations, tables, CJK spacing — the same battle-tested
[mdfit-core](../../packages/core) engine that powers the `mdfit` CLI.

## Install

From the community directory (once listed): search **"mdfit"** in
Settings → Community plugins.

Manual install: download `main.js` + `manifest.json` from the
[release channel repo](https://github.com/Naloam/mdfit-obsidian-plugin/releases/latest),
copy them into `<your-vault>/.obsidian/plugins/mdfit/`, then enable
**mdfit — fit any Markdown**. To build from source instead: `pnpm build` in
this directory and copy `dist/*`.

## Usage

Just paste. The plugin converts clipboard content (plain text or the HTML
flavor when it carries KaTeX/tables) and inserts the result. Toggle with the
command **"mdfit: Toggle paste conversion on/off"**.

## Development

`src/paste-transform.ts` is pure and unit-tested in plain Node;
`src/main.ts` is the thin Obsidian shell.
