import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  collectRemoteImages,
  localFileName,
  rewriteImageLinks,
  downloadImages,
} from '../src/images.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

let server: Server;
let base = '';
const tmpDirs: string[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/img/pic.png') {
      res.writeHead(200, { 'content-type': 'image/png' });
      res.end(PNG);
      return;
    }
    if (req.url === '/broken') {
      res.writeHead(500);
      res.end('nope');
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

describe('collectRemoteImages', () => {
  it('collects markdown and wikilink remote images, unique', () => {
    const md = `![a](https://x/1.png) and ![[https://x/2.jpg]] and again ![b](https://x/1.png) and local ![c](local.png)`;
    expect(collectRemoteImages(md)).toEqual(['https://x/1.png', 'https://x/2.jpg']);
  });
});

describe('localFileName', () => {
  it('keeps a sanitized basename with extension and adds a stable hash', () => {
    const a = localFileName('https://host/files/my picture.PNG?sig=1');
    expect(a).toMatch(/^my-picture-[0-9a-f]{8}\.PNG$/);
    expect(localFileName('https://host/files/my picture.PNG?sig=1')).toBe(a);
    expect(localFileName('https://host/noext')).toMatch(/\.png$/);
  });
});

describe('rewriteImageLinks', () => {
  it('rewrites both markdown and wikilink forms', () => {
    const md = '![a](https://x/1.png) ![[https://x/2.jpg]] ![keep](local.png)';
    const out = rewriteImageLinks(
      md,
      new Map([
        ['https://x/1.png', 'img/a.png'],
        ['https://x/2.jpg', 'img/b.jpg'],
      ]),
    );
    expect(out).toBe('![a](img/a.png) ![[img/b.jpg]] ![keep](local.png)');
  });
});

describe('downloadImages (against a local HTTP server)', () => {
  it('downloads good images and reports failures separately', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mdfit-img-'));
    tmpDirs.push(dir);
    const { map, failed } = await downloadImages([`${base}/img/pic.png`, `${base}/broken`], dir);

    expect(map.size).toBe(1);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.reason).toContain('500');

    const saved = map.get(`${base}/img/pic.png`);
    expect(saved).toBeTruthy();
    const localName = saved?.split('/').pop() ?? '';
    const onDisk = readFileSync(join(dir, localName));
    expect(onDisk.equals(PNG)).toBe(true);
  });

  it('creates the directory when missing', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'mdfit-img2-')), 'sub', 'dir');
    tmpDirs.push(dir);
    const { map } = await downloadImages([`${base}/img/pic.png`], dir);
    expect(map.size).toBe(1);
    expect(existsSync(join(dir, map.get(`${base}/img/pic.png`)?.split('/').pop() ?? ''))).toBe(
      true,
    );
  });
});
