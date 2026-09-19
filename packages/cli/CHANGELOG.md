# @naloam/mdfit

## 0.1.5

### Patch Changes

- Fix: `mdfit --version` now reads the real version from package.json instead of a hardcoded '0.1.0' that made every release since 0.1.0 falsely display 0.1.0.

## 0.1.4

### Patch Changes

- Windows clipboard writes now go through clip.exe (UTF-8 BOM) as the primary path, with the PowerShell Set-Clipboard retry loop kept as fallback. clip.exe handles clipboard contention from editors/clipboard managers more gracefully than Set-Clipboard, which can fail with "failed to open clipboard" while another process holds the lock.

## 0.1.3

### Patch Changes

- Republish: 0.1.1/0.1.2 tarball uploads silently failed (registry metadata updated, artifact 404 on CDN — large PUT dropped on an unstable direct route). Publishing now goes through a local proxy.

## 0.1.2

### Patch Changes

- Fix: retry `Set-Clipboard` when Windows transiently denies clipboard access ("failed to open clipboard" while editors/clipboard managers hold it).

  Also republishes the 0.1.1 display-math fix: that version's tarball was accepted by npm's metadata API but never materialized on the CDN (404), so it is effectively uninstallable.

## 0.1.1

### Patch Changes

- Fix: display math `\[..\]` sitting mid-sentence now breaks the paragraph around the `$$` block. Previously the generated `$$` could never start a line, so remark-math failed to parse it and the sentence degraded into escaped literal `\$..\$` junk.
