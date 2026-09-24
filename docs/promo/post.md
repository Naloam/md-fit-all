# 推广文案草稿（由本人账号择机发布）

> 使用前自查：README demo 图已就位、CI 绿、npm 最新版可装。

## 1. Obsidian 英文论坛（share & showcase 版块）

**Title: mdfit — paste ChatGPT/Claude answers into Obsidian without fixing math, headings or citations**

Hey everyone,

I kept manually fixing the same things every time I pasted AI answers into
Obsidian: `\(x^2\)` math that never renders, `###` headings landing three
levels deep, `【1†source】` citation noise, `text` code fences. So I built
**mdfit** — a tiny converter that fixes all of it at paste time.

- Works at the **clipboard level** (`mdfit clip` + any hotkey) and as an
  **Obsidian plugin** (intercepts paste directly)
- AST-based (unified/remark) — your code blocks are provably untouched
- Idempotent, 177 tests, open source: https://github.com/Naloam/md-fit-all
- `npm install -g @naloam/mdfit`, then `Ctrl+Alt+V` → paste. A resident
  daemon (`mdfit serve`) makes the hotkey ~100 ms.

It also does the reverse direction for Obsidian users: relative `.md` links
become `[[wikilinks]]`, `**Note:**` paragraphs become callouts.

Happy to hear what still breaks for you — every reported case becomes a
regression test in the corpus.

## 2. Obsidian 中文论坛

**标题：mdfit —— 从 ChatGPT 复制到 Obsidian，公式、标题、引用全自动修好**

每次把 AI 回答粘进 Obsidian 都要手动修 `\( \)` 公式、标题层级、引用标记？
我写了个小工具 mdfit，粘贴时自动搞定：

- 剪贴板级转换（`mdfit clip` + 热键），也有 Obsidian 插件形态（直接拦截粘贴）
- 基于 AST 管道，代码块保证不动；幂等设计，177 个测试
- 开源：https://github.com/Naloam/md-fit-all（中英双语 README）
- `npm install -g @naloam/mdfit`；配 `mdfit serve` 守护进程热键只要 ~0.1 秒

反向也支持：`.md` 链接转 `[[双链]]`、`**注意：**` 转 callout。
欢迎试用反馈——每个反馈都会变成语料库的回归测试。

## 3. V2EX（分享创造节点）

**把 ChatGPT 的 Markdown 复制进 Typora/Obsidian 格式就乱？写了个转换器**

痛点：ChatGPT 数学用 `\( \)`、标题从 ### 开始、还有引用标记和 "Copy code"
杂质，粘到笔记软件全要手动修。

做了 mdfit：profile 驱动的 Markdown 方言转换器。
CLI + 剪贴板热键（覆盖 Typora 这种没插件系统的编辑器）+ Obsidian 插件 +
油猴脚本（可抢救会过期的聊天图片）。守护进程常驻后热键 ~0.1s。

技术上的坚持：AST 管道（代码块字节级不动）、幂等（转两遍结果不变）、
23 个 golden 语料 + fast-check 属性测试。

开源：https://github.com/Naloam/md-fit-all · `npm i -g @naloam/mdfit`

## 4. Reddit r/ObsidianMD

**Title: mdfit — I got tired of fixing ChatGPT math/headings/citations on every paste, so I built a converter (CLI + Obsidian plugin)**

Paste-time conversion for AI output: `\(...\)` → `$...$`, heading promotion,
citation stripping, table cleanup, CJK spacing — plus reverse conversions
(md links → wikilinks, `**Note:**` → callouts). Clipboard-level so it also
covers Typora; Obsidian plugin intercepts paste directly. AST-based, code
blocks guaranteed untouched, idempotent. Open source + npm.
