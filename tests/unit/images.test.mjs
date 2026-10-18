import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { pictureHtml } from '../../config/images.js';

let tmp, out;

const make = (name, width, height) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 30, b: 30 } } }).png().toFile(join(tmp, 'images', name));

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'pic-assets-'));
  out = mkdtempSync(join(tmpdir(), 'pic-out-'));
  mkdirSync(join(tmp, 'images'));
  await make('t.png', 1000, 500);
  await make('small.png', 300, 150);
});

after(() => {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
});

test('picture offers WebP and PNG at every width up to the source', async () => {
  const html = await pictureHtml({ src: 'images/t.png', alt: 'T', sizes: '50vw' }, { assets: tmp, out });
  assert.match(html, /<source type="image\/webp" srcset="[^"]*-480\.\w{8}\.webp 480w, [^"]*-800\.\w{8}\.webp 800w"/);
  assert.match(html, /<img src="[^"]*-800\.\w{8}\.png"[^>]* width="800" height="400"[^>]* alt="T"[^>]* loading="lazy"/);
  assert.doesNotMatch(html, /1200w/);
  const file = /src="([^"]*-800\.\w{8}\.png)"/.exec(html)[1];
  assert.ok(existsSync(join(out, file)), 'the file is written to the output folder');
});

test('a source narrower than 480 is offered at its own width', async () => {
  const html = await pictureHtml({ src: 'images/small.png', alt: 'S' }, { assets: tmp, out });
  assert.match(html, /-300\.\w{8}\.webp 300w"/);
  assert.match(html, / width="300" height="150"/);
  assert.doesNotMatch(html, /480w/);
});

test('eager drops lazy loading', async () => {
  const html = await pictureHtml({ src: 'images/t.png', alt: 'T', eager: true }, { assets: tmp, out });
  assert.doesNotMatch(html, /loading=/);
  assert.match(html, /decoding="async"/);
});

test('concurrent builds of the same source both get complete images', async () => {
  const out2 = mkdtempSync(join(tmpdir(), 'pic-out2-'));
  try {
    const opts = { src: 'images/t.png', alt: 'T' };
    const [a, b] = await Promise.all([
      pictureHtml(opts, { assets: tmp, out }),
      pictureHtml(opts, { assets: tmp, out: out2 }),
    ]);
    for (const [html, dir] of [[a, out], [b, out2]]) {
      for (const [, file, w] of html.matchAll(/(\/images\/[^ ",]*\.(?:png|webp)) (\d+)w/g)) {
        assert.equal((await sharp(join(dir, file)).metadata()).width, Number(w));
      }
    }
  } finally {
    rmSync(out2, { recursive: true, force: true });
  }
});
