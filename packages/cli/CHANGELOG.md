# @naloam/mdfit

## 0.1.1

### Patch Changes

- Fix: display math `\[..\]` sitting mid-sentence now breaks the paragraph around the `$$` block. Previously the generated `$$` could never start a line, so remark-math failed to parse it and the sentence degraded into escaped literal `\$..\$` junk.
