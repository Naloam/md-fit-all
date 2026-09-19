/**
 * Image rescue — pure string helpers (unit-testable in Node).
 *
 * Chat-hosted file URLs expire after a while; before that happens we inline
 * images as data URLs so the pasted Markdown keeps working forever.
 */

export function extractImgUrls(html: string): string[] {
  const urls: string[] = [];
  for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
    const url = m[1];
    if (url && !url.startsWith('data:')) urls.push(url);
  }
  return [...new Set(urls)];
}

export function applyImageMap(html: string, map: Map<string, string>): string {
  let out = html;
  for (const [url, dataUrl] of map) {
    out = out.split(`src="${url}"`).join(`src="${dataUrl}"`);
  }
  return out;
}

/** Fetch an image and convert it to a data URL; null on any failure. */
export async function toDataUrl(url: string, timeoutMs = 3000): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function rescueImages(html: string): Promise<string> {
  const urls = extractImgUrls(html);
  if (urls.length === 0) return html;
  const map = new Map<string, string>();
  const results = await Promise.all(urls.map(async (url) => [url, await toDataUrl(url)] as const));
  for (const [url, dataUrl] of results) {
    if (dataUrl !== null) map.set(url, dataUrl);
  }
  return applyImageMap(html, map);
}
