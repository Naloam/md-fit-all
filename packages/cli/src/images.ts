import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Remote-image download & rewrite for --download-images.
 *
 * Chat hosts (ChatGPT/Claude/Gemini) serve images from URLs that expire.
 * This module downloads them next to your notes and rewrites the Markdown
 * to point at the local copies.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

/** Markdown image refs with remote (http/https) URLs, wikilink embeds included. */
export function collectRemoteImages(md: string): string[] {
  const urls: string[] = [];
  for (const m of md.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g)) {
    if (m[1]) urls.push(m[1]);
  }
  for (const m of md.matchAll(/!\[\[(https?:\/\/[^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
    if (m[1]) urls.push(m[1]);
  }
  return [...new Set(urls)];
}

/** Stable local filename for a remote URL: sanitized basename + short hash. */
export function localFileName(url: string): string {
  let base = '';
  let ext = '';
  try {
    const u = new URL(url);
    // %20 and friends decode back to readable characters before sanitizing.
    const rawName = u.pathname.split('/').pop() ?? 'image';
    const decoded = (() => {
      try {
        return decodeURIComponent(rawName);
      } catch {
        return rawName;
      }
    })();
    base = decoded.replace(/[^A-Za-z0-9._-]+/g, '-');
    const dot = base.lastIndexOf('.');
    if (dot > 0) {
      ext = base.slice(dot);
      base = base.slice(0, dot);
    }
  } catch {
    base = 'image';
  }
  if (!/^\.[A-Za-z0-9]{1,5}$/.test(ext)) ext = '.png';
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 8);
  return `${base || 'image'}-${hash}${ext}`;
}

/** Rewrite remote image refs to local paths according to the url→path map. */
export function rewriteImageLinks(md: string, map: Map<string, string>): string {
  let out = md;
  for (const [url, localPath] of map) {
    out = out.split(`(${url})`).join(`(${localPath})`);
    out = out.split(`![[${url}]]`).join(`![[${localPath}]]`);
  }
  return out;
}

export interface DownloadResult {
  map: Map<string, string>;
  failed: Array<{ url: string; reason: string }>;
}

/** Download remote images into `dir`; returns the url→relative-path map. */
export async function downloadImages(urls: string[], dir: string): Promise<DownloadResult> {
  const map = new Map<string, string>();
  const failed: Array<{ url: string; reason: string }> = [];

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > MAX_BYTES) throw new Error(`too large (${buf.byteLength} bytes)`);
        const name = localFileName(url);
        return { url, name, buf };
      } catch (err) {
        return { url, reason: err instanceof Error ? err.message : String(err) };
      }
    }),
  );

  mkdirSync(dir, { recursive: true });
  for (const r of results) {
    if ('reason' in r) {
      failed.push({ url: r.url, reason: r.reason });
      continue;
    }
    writeFileSync(join(dir, r.name), r.buf);
    map.set(r.url, `${dir.replace(/\\/g, '/')}/${r.name}`);
  }
  return { map, failed };
}
