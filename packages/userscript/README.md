# mdfit userscript (Tampermonkey)

Copy any selection from ChatGPT / Claude / Gemini as clean Markdown for
Obsidian / Typora / GitHub — math, tables and code fixed, and **images are
rescued into data URLs** before their chat-hosted URLs expire.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Build: `pnpm build` in this directory → `dist/mdfit.user.js`.
3. Tampermonkey → Dashboard → Utilities → Import, or simply create a new
   script and paste the contents of `dist/mdfit.user.js`.

## Usage

Select part of an answer, then click the Tampermonkey menu and pick:

- 📋 Copy selection as Obsidian
- 📄 Copy selection as Typora
- 🐙 Copy selection as GitHub

Paste into your editor — done. Selection-based on purpose: it survives chat
UI redesigns that break per-message buttons.

## Notes

- Image rescue fetches each `<img>` in the selection (3 s timeout each);
  images that fail to fetch keep their original URL.
- The script matches chatgpt.com, chat.openai.com, claude.ai and
  gemini.google.com — extend the `@match` lines for other sites.
