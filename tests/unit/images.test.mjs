import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { assetPath, optimiseImages, pictureHtml } from '../../config/images.js';
import { writeFixtureUploads } from '../fixtures/uploads.mjs';

let tmp, out, uploads;

const make = (name, width, height) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 30, b: 30 } } }).png().toFile(join(tmp, 'images', name));

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'pic-assets-'));
  out = mkdtempSync(join(tmpdir(), 'pic-out-'));
  mkdirSync(join(tmp, 'images'));
  await make('t.png', 1000, 500);
  await make('small.png', 300, 150);
  uploads = mkdtempSync(join(tmpdir(), 'pic-uploads-'));
  await writeFixtureUploads(uploads);
});

after(() => {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
  rmSync(uploads, { recursive: true, force: true });
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

test('assetPath accepts files under site/assets and rejects uploads, folders and escapes', () => {
  assert.equal(assetPath('images/map.png'), 'images/map.png');
  assert.equal(assetPath('/images/map.png'), 'images/map.png');
  assert.equal(assetPath('/uploads/2026/photo.jpg'), '');
  assert.equal(assetPath('images'), '');
  assert.equal(assetPath('../config/images.js'), '');
  assert.equal(assetPath(''), '');
  assert.equal(assetPath(undefined), '');
});

test('fill crops to the aspect and sizes the img to it', async () => {
  const html = await pictureHtml({ src: 'images/t.png', alt: 'T', fill: '350x300' }, { assets: tmp, out });
  assert.match(html, /-350\.\w{8}\.webp 350w, [^"]*-700\.\w{8}\.webp 700w"/);
  assert.match(html, / width="350" height="300"/);
  const file = /src="([^"]*\.png)"/.exec(html)[1];
  const meta = await sharp(join(out, file)).metadata();
  assert.equal(meta.width / meta.height, 350 / 300);
});

test('a cropped and an uncropped copy of one source do not collide', async () => {
  const plain = await pictureHtml({ src: 'images/t.png', alt: 'T' }, { assets: tmp, out });
  const cropped = await pictureHtml({ src: 'images/t.png', alt: 'T', fill: '350x300' }, { assets: tmp, out });
  assert.notEqual(/src="([^"]+)"/.exec(plain)[1], /src="([^"]+)"/.exec(cropped)[1]);
});

const up = (src, extra = {}) => pictureHtml({ src, alt: 'A', ...extra }, { assets: tmp, uploads, out });

test('an upload is a picture at every width up to the original', async () => {
  const html = await up('/uploads/fixture-wide.png');
  assert.deepEqual([...html.matchAll(/\.webp (\d+)w/g)].map((m) => m[1]), ['480', '800', '1200', '1600']);
  assert.match(html, /<img src="\/images\/fixture-wide-800\.\w{8}\.png"[^>]* width="800" height="450"/);
});

test('a huge upload is capped at 1600', async () => {
  const html = await up('/uploads/fixture-huge.png');
  assert.match(html, /1600w"/);
  assert.doesNotMatch(html, /(2400|3200|6000)w/);
});

test('a file name with spaces and capitals is processed under a safe name', async () => {
  const html = await up('/uploads/Fixture%20Space.PNG');
  assert.match(html, /srcset="\/images\/fixture-space-480\.\w{8}\.webp 480w/);
});

test('a GIF and an SVG are plain images with their size', async () => {
  assert.equal(await up('/uploads/fixture.gif'), '<img src="/uploads/fixture.gif" alt="A" width="1" height="1" loading="lazy" decoding="async">');
  assert.match(await up('/uploads/fixture.svg'), /^<img src="\/uploads\/fixture\.svg" alt="A"[^>]* loading="lazy" decoding="async">$/);
});

test('a missing upload or another site is a plain lazy image, never an error', async () => {
  assert.equal(await up('/uploads/deleted.jpg'), '<img src="/uploads/deleted.jpg" alt="A" loading="lazy" decoding="async">');
  assert.equal(await up('https://media.acny.uk/x.jpg'), '<img src="https://media.acny.uk/x.jpg" alt="A" loading="lazy" decoding="async">');
});

test('a missing layout asset is still an error', async () => {
  await assert.rejects(up('images/missing.png'));
});

const page = (body) => `<header><img src="/images/map-800.abcd1234.png" alt=""></header><main>${body}</main>`;
const run = (body) => optimiseImages(page(body), { assets: tmp, uploads, out });

test('an upload in a body becomes a picture, its own attributes dropped', async () => {
  const html = await run('<p><img src="/uploads/fixture-wide.png" alt="Wide one" width="1024" style="float:left"></p>');
  assert.match(html, /<main><p><picture>[\s\S]*width="800" height="450"[\s\S]*<\/picture><\/p>/);
  assert.doesNotMatch(html, /float:left|width="1024"/);
});

test('odd img markup is read and alt is escaped once', async () => {
  for (const tag of [`<IMG SRC='/uploads/fixture-huge.png' ALT='Quote " and > inside'>`, `<IMG SRC='/uploads/fixture-huge.png' ALT='Quote &quot; and &gt; inside'>`]) {
    const html = await run(tag);
    assert.match(html, /<picture>[\s\S]*alt="Quote &#34; and &gt; inside"/);
    assert.doesNotMatch(html, /inside'>/);
  }
});

test('an own-domain upload with a space in its name is processed', async () => {
  const html = await run('<img src="http://stpaulswarton.co.uk/uploads/Fixture Space.PNG" alt="Spaces">');
  assert.match(html, /<picture>[\s\S]*fixture-space-480\.\w{8}\.webp 480w/);
});

test('a hot-linked image keeps its attributes and becomes lazy', async () => {
  const html = await run('<img src="https://media.acny.uk/x.jpg" alt="Hot linked" width="1024">');
  assert.match(html, /<img src="https:\/\/media\.acny\.uk\/x\.jpg" alt="Hot linked" width="1024" loading="lazy" decoding="async">/);
});

test('only the first image in main is eager', async () => {
  const html = await run('<img src="/uploads/fixture-wide.png" alt="1"><img src="/uploads/fixture-wide.png" alt="2">');
  const imgs = [...html.split('<main>')[1].matchAll(/<img [^>]*>/g)].map((m) => m[0]);
  assert.doesNotMatch(imgs[0], /loading=/);
  assert.match(imgs[1], /loading="lazy"/);
});

test('processed pictures are left alone', async () => {
  const html = await run('');
  assert.match(html, /<header><img src="\/images\/map-800\.abcd1234\.png" alt=""><\/header>/);
});
