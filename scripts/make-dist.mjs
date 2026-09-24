/**
 * Assemble release artifacts into dist-release/ for GitHub Releases:
 *   mdfit-<version>-standalone.zip  — CLI: mdfit.cmd shim + bundled index.cjs (scoop-friendly)
 *   mfit.user.js                    — Tampermonkey userscript (copied)
 *   obsidian-plugin/{main.js,manifest.json} — manual-install plugin files (copied)
 *
 * Run: pnpm build && node scripts/make-dist.mjs
 */
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist-release');
const version = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'), 'utf8')).version;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1. CLI standalone zip
const zipDir = join(out, `mdfit-${version}`);
mkdirSync(zipDir, { recursive: true });
copyFileSync(join(root, 'packages/cli/dist/index.cjs'), join(zipDir, 'index.cjs'));
writeFileSync(join(zipDir, 'mdfit.cmd'), '@echo off\r\nnode "%~dp0index.cjs" %*\r\n', 'utf8');
writeFileSync(
  join(zipDir, 'README.txt'),
  `mdfit ${version} (requires Node.js >= 20 on PATH)\n\nAdd this folder to PATH, or run mdfit.cmd directly.\nFull docs: https://github.com/Naloam/md-fit-all\n`,
  'utf8',
);
// bsdtar (built into Windows 10+) creates a zip via the -a extension sniff.
execSync(`tar -a -c -f "${join(out, `mdfit-${version}-standalone.zip`)}" mdfit-${version}`, {
  cwd: out,
  stdio: 'inherit',
});
rmSync(zipDir, { recursive: true, force: true });

// 2. Userscript
const userscript = join(root, 'packages/userscript/dist/mdfit.user.js');
if (!existsSync(userscript)) throw new Error('userscript not built — run pnpm build first');
copyFileSync(userscript, join(out, 'mdfit.user.js'));

// 3. Obsidian plugin files
const pluginOut = join(out, 'obsidian-plugin');
mkdirSync(pluginOut, { recursive: true });
copyFileSync(join(root, 'packages/obsidian-plugin/dist/main.js'), join(pluginOut, 'main.js'));
copyFileSync(
  join(root, 'packages/obsidian-plugin/manifest.json'),
  join(pluginOut, 'manifest.json'),
);

console.log(`artifacts ready in dist-release/ (version ${version})`);
