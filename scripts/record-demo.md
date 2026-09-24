# Recording a real demo GIF

`docs/assets/demo.svg` is a zero-dependency animated stand-in. When you have
five minutes, replace it with a real screen recording — it converts better:

1. Open ChatGPT, pick an answer with math + a table + a code block.
2. Start recording (Win+G / OBS / ScreenToGif).
3. Copy the answer → press `Ctrl+Alt+V` (daemon running) → paste into Obsidian.
4. Show the math rendering live.
5. Export as `docs/assets/demo.gif` (≤ 10 MB, ~30 s, 800px wide).
6. Swap the image reference in both READMEs from `demo.svg` to `demo.gif`.
