# Profiles Reference

Effective rules = `BASE_RULES` ← source cleanup ← target style ← user overrides.
See `mdfit profiles base` for the base defaults and `mdfit profiles show <name>`
for any profile's exact settings.

## Source profiles

| Profile | Description | Cleanup it enables |
|---|---|---|
| `chatgpt` | ChatGPT / GPT-5 / Codex output | math conversion, citation strip, heading promotion, artifact strip |
| `claude` | Claude output | math conversion, heading promotion, artifact strip (citations kept) |
| `gemini` | Gemini output | math conversion, citation strip, heading promotion, artifact strip |
| `generic` | Neutral Markdown | none — only target styling applies |
| `html` | Clipboard rich-text HTML | converted via Turndown first, then math + artifacts |
| `auto` | (default) | heuristically detects one of the above — see `mdfit convert --verbose` |

## Target profiles

| Profile | Math | Callouts | Wikilinks | CJK spacing |
|---|---|---|---|---|
| `obsidian` | `$`/`$$` | keep `> [!note]` | keep `[[..]]` | on |
| `typora` | `$`/`$$` | → blockquote | → markdown links | on |
| `github` | `$`/`$$` (MathJax) | → blockquote | → markdown links | off |
| `commonmark` | `$`/`$$` | → blockquote | → markdown links | off |

## Custom profiles

Any built-in layer can be overridden with a JSON file passed via
`--profile my-rules.json` (convert & clip) or the `profile` body field
(daemon / API). Keys are rule names; unknown keys are rejected:

```json
{ "calloutize": false, "cjkSpacing": true, "headings": "keep" }
```

Layer order: `BASE_RULES` ← source cleanup ← target style ← **custom profile** ←
`--rule` overrides.

## Detect signals (`auto`)

| Signal | Weight |
|---|---|
| `\(..\)`/`\[..\]` with LaTeX commands | strong, chat family |
| `【n†…】` browsing citations | very strong, chatgpt |
| headings start at `###` | weak, chat family |
| `Copy code` / `复制代码` chrome | strong, chat family |
| Claude/Anthropic mentions | weak, claude |

All chat-family profiles share the same cleanup rules, so a misattribution
inside the family is harmless; what matters is chat-vs-generic.
