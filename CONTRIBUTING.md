# Contributing to md-fit-all

Thanks for your interest in improving md-fit-all! This guide covers the two main ways to contribute:
code and **corpus cases** (the second one is the easiest and most valuable).

## Contributing a corpus case (10 minutes, huge impact)

The corpus under [`corpus/cases/`](./corpus/cases) is the heart of this project's quality:
real-world inputs paired with expected outputs. Every rule must pass every case, and every case
asserts idempotency (converting twice changes nothing).

To add one:

1. Create a folder: `corpus/cases/<short-name>/`
2. Add `input.md` — the raw Markdown you copied (from ChatGPT/Claude/Gemini, or any source that
   rendered badly in your editor). **Sanitize private information first.**
3. Add `options.json` if the case needs a non-default source/target, e.g.
   `{ "from": "chatgpt", "to": "obsidian" }`
4. Add `expected/<target>.md` — what the correct output should look like.
5. Run `pnpm test` — your case is picked up automatically.

If you're not sure what the *correct* output is, open the input as an issue instead — discussion
welcome.

## Contributing code

```bash
git clone https://github.com/YOUR_USERNAME/md-fit-all
cd md-fit-all
pnpm install
pnpm test && pnpm lint && pnpm typecheck
```

- Workspaces live in `packages/` (`core` = engine, `cli` = `mdfit` command).
- Every rule lives in `packages/core/src/rules/<rule-name>.ts` with its own unit test.
- String-level transforms **must** go through `protectedTransform()` so code blocks and math are
  never modified. This is enforced by the corpus tests.
- All changes to conversion behavior require a corpus case demonstrating the fix.

Commit style: [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, ...).

## Releasing

Maintainers use [changesets](https://github.com/changesets/changesets): add a changeset with every
user-facing change; versions are cut via the Release workflow.

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).
