# md-fit-all

> 让任何 Markdown 适配任何编辑器。

**md-fit-all**（命令名 `mdfit`）是一个 profile 驱动的 Markdown 方言转换器，专注解决一个高频痛点：
把 LLM 输出（ChatGPT / Claude / Gemini）复制到笔记软件（Obsidian / Typora）或发布平台（GitHub）时，
不再需要手动修复数学定界符、标题层级、引用标记、表格和空格。

从 ChatGPT 复制 → 按 `Ctrl+Alt+V` → 粘进 Obsidian，零手动修改。

![mdfit 演示](docs/assets/demo.svg)

## 为什么需要它

每个编辑器想要的 Markdown 略有不同，而每个聊天机器人输出的又是各自的方言：

- ChatGPT 的数学公式写作 `\(x^2\)` / `\[E=mc^2\]`，而 Obsidian/Typora 只渲染 `$x^2$` / `$$…$$`
- 回答从 `###` 开始，粘进笔记后莫名嵌套三层
- 从网页复制的内容夹带引用标记（`【1†source】`）、`Copy code` 按钮文字、零宽字符
- 现有工具各解决一小块，而且大多只能在 Obsidian 里用——Typora 用户什么都没有

`mdfit` 工作在**剪贴板层面**，因此覆盖所有编辑器。基于 AST 管道（[unified](https://unified.sh)/remark），
内置**代码保护段机制**——代码块绝不会被正则误伤。**幂等设计**：转换两遍结果不变。

## 安装

从 npm 安装：

```bash
npm install -g @naloam/mdfit
```

不想安装？直接试用：

```bash
npx @naloam/mdfit clip --to obsidian -y
```

Scoop（Windows）：

```bash
scoop bucket add mdfit https://github.com/Naloam/md-fit-all --subdir scoop
scoop install mdfit
```

从源码：

```bash
git clone https://github.com/Naloam/md-fit-all
cd md-fit-all
pnpm install && pnpm build
npm link --prefix ./packages/cli   # 或直接 node packages/cli/dist/index.js
```

## 使用

```bash
# 原地转换剪贴板 —— 日常主力命令
mdfit clip --to obsidian -y

# 优先使用剪贴板的 HTML 内容（从渲染页面复制时）
mdfit clip --html --to obsidian

# 先预览改动再确认
mdfit clip --to obsidian --diff

# 转换文件
mdfit convert notes.md --from chatgpt --to obsidian -o out.md
cat raw.md | mdfit convert --to github > clean.md

# 查看自动识别结果
mdfit convert notes.md --verbose

# 批量转换整个目录（发布到 GitHub、迁移……）
mdfit convert-dir vault/ -o vault-github/ --to github --dry-run

# 转换时抢救会过期的聊天图片
mdfit clip --to obsidian --download-images

# 守护进程开机自启（隐藏窗口，无需管理员）
mdfit serve --install

# 覆盖任意规则
mdfit clip --to github --rule cjkSpacing=true headings=keep

# 查看 profiles 和规则
mdfit profiles list
mdfit rules list
mdfit config set defaultTo obsidian
```

## 全局热键与常驻服务（Windows）

安装 [AutoHotkey v2](https://www.autohotkey.com/)，双击
[`scripts/hotkey.ahk`](./scripts/hotkey.ahk)：

- `Ctrl+Alt+V` → 剪贴板转换为 **Obsidian** 格式
- `Ctrl+Alt+T` → 剪贴板转换为 **Typora** 格式

想再快，就常驻一个守护进程（可加入开机自启）：

```bash
mdfit serve        # 监听 http://127.0.0.1:7317
```

此后热键脚本走 `curl` 打守护进程（约 100ms，替代冷启动的 ~1.4 秒）；
`mdfit clip` 检测到守护进程在线时也会自动走快路径。
没装 AutoHotkey？`Win+R` 输入 `mdfitt` / `mdfito` 回车即可。

## 反向转换与自定义 Profile

Obsidian 目标现在也会把内容转换*进* Obsidian 习惯用法：

- `[笔记](笔记.md)` → `[[笔记]]`（仅限相对 `.md` 链接和本地图片）
- `**注意：** 内容` → `> [!warning] 内容`（中英文标签都认）

用 JSON 文件叠加你自己的默认规则：

```bash
mdfit convert in.md --to obsidian --profile my-rules.json
```

## 更多形态

- **[Obsidian 插件](./packages/obsidian-plugin)** —— 在 Obsidian 内部拦截粘贴，
  连热键都不用按。
- **[Tampermonkey 脚本](./packages/userscript)** —— 在浏览器里框选任意聊天回答，
  直接复制为干净的 Markdown，并抢救会过期的图片链接（内联为 data URL）。

## 规则与 Profile

- [规则参考](./docs/rules.md) —— 11 条转换规则，各自的守卫条件和示例
- [Profile 参考](./docs/profiles.md) —— 来源（chatgpt/claude/gemini/generic/html）×
  目标（obsidian/typora/github/commonmark）
- [语料库](./corpus/README.md) —— 18 个 golden-file case，同时断言正确性、幂等性和代码保护。
  欢迎贡献，门槛很低。

## 开发

```bash
pnpm install
pnpm test        # 120 个测试：单元 + 语料 golden file
pnpm lint        # eslint
pnpm typecheck   # 构建并做类型检查
pnpm build       # 构建所有包
```

仓库结构：`packages/core`（引擎，零环境依赖）与 `packages/cli`（`mdfit` 命令）。
参见 [CONTRIBUTING.md](./CONTRIBUTING.md) —— 贡献一条语料是价值最高的参与方式。

## 许可证

[MIT](./LICENSE)
