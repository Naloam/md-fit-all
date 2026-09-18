# Rules Reference

Rules are layered per conversion:

```
BASE_RULES  ←  source profile (cleanup)  ←  target profile (style)  ←  CLI --rule overrides
```

String-level rules always run through `protectedTransform` — code fences, inline
code and existing `$$` math are never modified. See each rule below for behavior
and examples. Toggle any of them via `--rule key=value`.

## Pre-rules (string level)

### stripArtifacts

Remove copy-paste junk: zero-width characters, `Copy code` / `复制代码` chrome
lines, trailing whitespace, and blank-line runs longer than one.

### mathDelimiters

Convert LaTeX delimiters to what every editor understands:

| Input | Output |
|---|---|
| `\(x^2\)` | `$x^2$` |
| `\[E = mc^2\]` | `$$\nE = mc^2\n$$` (block form) |

Guards: prose that merely mentions the delimiters is left alone; bodies must
look like math (LaTeX commands, `^`/`_`/`$`/`}`, or a short space-free latin
token like `K` or `C_o`). Currency `$5`, escaped `\$`, and existing `$..$`
math are untouched.

### wrapLatexEnv

Bare display environments (`\begin{align}…\end{align}` and friends) get wrapped
in `$$` blocks.

### citations

`strip` (default): remove ChatGPT browsing markers (`【1†source】`, `【4:2†L15-L20】`)
and sentence-adjacent `[n]` markers — never links `[n](url)`, definitions
`[n]: url`, footnotes `[^n]`, or array indexing `a[n]`.
`footnote`: convert browsing markers into real footnotes with definitions.
`keep`: do nothing.

## AST rules (structure level)

### headings

`top-level` (default for LLM sources): promote the shallowest heading to `#`,
preserving relative depth. `keep`: no change.

### codeFence

Normalize language tags: `text`/`plaintext` → dropped, `sh`→`bash`,
`py`→`python`, `yml`→`yaml`, `md`→`markdown`, `golang`→`go`; everything
lowercased. Already-clean tags are untouched (idempotent).

### callouts

For non-Obsidian targets, `> [!note] Title` becomes a plain blockquote with a
bold title (`> **Title**`). Obsidian targets keep callouts as-is.

### wikilinks

For targets that don't support them: `[[Note]]` → `[Note](Note.md)`,
`[[Note|alias]]` → `[alias](Note.md)`, `[[Note#§]]` → `[Note#§](Note.md#§)`,
`![[img.png]]` → `![](img.png)`. Spaces in targets are percent-encoded.
Obsidian targets keep wikilinks (and unescape any serializer artifacts).

### emphasisFix

Rebuild `**bold**` that failed to parse because of inner-edge whitespace
(`** 加粗 **`) as real strong nodes. CommonMark parses intraword asterisk
emphasis fine, so only genuinely-broken leftovers are touched.

### cjkSpacing

Insert a single space between Han characters and Latin letters/digits
(`中文abc` → `中文 abc`). Text nodes only — code, inline code and math are
structurally excluded. On by default for obsidian/typora targets, off for
github/commonmark.

## Output style (target profile)

| Key | Values | Effect |
|---|---|---|
| `bullet` | `-` `*` `+` | list marker |
| `emphasis` | `*` `_` | emphasis/strong marker |
