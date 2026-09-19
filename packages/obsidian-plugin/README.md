# mdfit for Obsidian

Auto-converts pasted LLM output (ChatGPT / Claude / Gemini) into
Obsidian-flavored Markdown the moment it lands in a note: math delimiters,
heading levels, citations, tables, CJK spacing — the same battle-tested
[mdfit-core](../../packages/core) engine that powers the `mdfit` CLI.

## Install (manual, until community-plugin review)

1. Build: `pnpm build` in this directory (or use the repo-root `pnpm build`).
2. Copy `dist/main.js`, `dist/manifest.json` into
   `<your-vault>/.obsidian/plugins/mdfit/`.
3. Obsidian → Settings → Community plugins → reload the list → enable
   **mdfit — fit any Markdown**.

## Usage

Just paste. The plugin converts clipboard content (plain text or the HTML
flavor when it carries KaTeX/tables) and inserts the result. Toggle with the
command **"mdfit: Toggle paste conversion on/off"**.

## Development

`src/paste-transform.ts` is pure and unit-tested in plain Node;
`src/main.ts` is the thin Obsidian shell.
