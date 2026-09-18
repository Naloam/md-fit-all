# Corpus

The corpus is the heart of mdfit's quality: real-world inputs paired with
human-verified expected outputs. Every conversion rule must pass every case,
and every case additionally asserts two hard invariants:

1. **Idempotency** — converting an already-converted document changes nothing.
2. **Code protection** — fenced code blocks survive conversion byte-identical.

## Layout

```
corpus/cases/<case-name>/
├── input.md            # the raw input (Markdown, or HTML for from=html cases)
├── options.json        # e.g. { "from": "chatgpt", "to": "obsidian" }
└── expected/
    └── <target>.md     # golden output, human-reviewed
```

## Adding a case

1. Create `corpus/cases/<short-name>/`
2. Add `input.md` — paste the real content you copied (sanitize private info first).
3. Add `options.json` with the source/target that reproduces your scenario.
4. Generate the golden file and review it line by line:

   ```bash
   pnpm build
   node scripts/gen-corpus.mjs
   ```

   If the generated output looks *wrong*, don't commit it — open an issue with
   your input instead. Golden files must be correct, not just current.

5. `pnpm test` picks the case up automatically.

## Regenerating after intentional rule changes

```bash
pnpm build && node scripts/gen-corpus.mjs
git diff corpus/cases/*/expected   # review every hunk — each is a behavior change
```
