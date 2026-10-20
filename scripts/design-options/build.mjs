// Builds the design options for Paul: ten mockups of the home page and one blog article, using the real
// content, a screenshot of each and a gallery page. Hand-run, never in CI. From the repo root:
//   node scripts/design-options/build.mjs [--artifact <file>]
// Output goes to docs/features/design-options/mockups/. --artifact also writes the gallery without its
// document wrapper, for publishing the folder as a claude.ai artifact.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { extract } from './content.mjs';
import { buildOriginal } from './original.mjs';
import { doc, mockBar } from './shared.mjs';
import { gallery, galleryDocument } from './gallery.mjs';
import designs from './designs/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'docs/features/design-options/mockups');
const artifactAt = process.argv.indexOf('--artifact');

// Photos already on the site, resized for the mockups.
const PHOTOS = {
  exterior: 'site/static/uploads/acny/5c2a632b4bd56f6a91e57151b3acf82f.jpg',
  churchyard: 'site/static/uploads/acny/e0602c3ff16aebee9d69855cf771ce34.jpg',
  snowdrops: 'site/static/uploads/acny/848cf4907142189ba36ccdc8fb3a3c72.jpg',
  crocus: 'site/static/uploads/acny/d4cb7b3296ee3661430da2327f4aa9e6.jpg',
  wall: 'site/assets/images/hero.jpg',
  interior: 'site/static/uploads/content/generic-2.jpg',
  organ: 'site/assets/images/generic-4.jpg',
  needlework: 'site/assets/images/generic-5.jpg',
  map: 'site/assets/images/map.png',
};

const ORIGINAL = {
  slug: '01-original',
  name: 'Original',
  group: 'base',
  summary: 'The new site as it is now on the test address. Same colours and layout as the old site, with a few readability fixes.',
  needs: 'Nothing.',
};

const built = await mkdtemp(path.join(os.tmpdir(), 'stpauls-design-'));
execFileSync('npx', ['eleventy', '--quiet', `--output=${built}`], { cwd: ROOT, stdio: 'inherit' });
const today = new Date();
const c = await extract(built, path.join(ROOT, 'site/content'), today);

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'img'), { recursive: true });
await mkdir(path.join(OUT, 'thumbs'), { recursive: true });
for (const [name, src] of Object.entries(PHOTOS)) {
  await sharp(path.join(ROOT, src)).rotate().resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 72, mozjpeg: true }).toFile(path.join(OUT, 'img', `${name}.jpg`));
}

const all = [ORIGINAL, ...designs];
for (const [i, d] of all.entries()) {
  const dir = path.join(OUT, d.slug);
  await mkdir(dir, { recursive: true });
  const bar = (which) => mockBar({
    number: i + 1, total: all.length, name: d.name, which,
    prev: all[(i - 1 + all.length) % all.length].slug, next: all[(i + 1) % all.length].slug,
  });
  if (d === ORIGINAL) {
    await buildOriginal({ builtDir: built, outDir: dir, bar });
    continue;
  }
  for (const [which, file, render, title] of [
    ['home', 'index.html', d.home, c.title],
    ['article', 'article.html', d.article, `${c.article.title}: ${c.title}`],
  ]) {
    await writeFile(path.join(dir, file), doc({ title: `${title} (design ${i + 1})`, fonts: d.fonts, css: d.css, bar: bar(which), body: render(c) }));
  }
}
await rm(built, { recursive: true, force: true });

// Screenshots for the gallery, without the mockup bar.
const sandboxChromium = '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync(sandboxChromium) ? sandboxChromium : undefined) });
for (const d of all) {
  for (const [kind, viewport, width] of [['desktop', { width: 1280, height: 800 }, 800], ['phone', { width: 390, height: 780 }, 260]]) {
    const page = await browser.newPage({ viewport });
    await page.goto(pathToFileURL(path.join(OUT, d.slug, 'index.html')).href, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '.mockbar{display:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot();
    await sharp(png).resize({ width }).jpeg({ quality: 74, mozjpeg: true }).toFile(path.join(OUT, 'thumbs', `${d.slug}-${kind}.jpg`));
    await page.close();
  }
}
await browser.close();

const madeOn = c.today.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
await writeFile(path.join(OUT, 'index.html'), galleryDocument(all, madeOn));
if (artifactAt > 0) await writeFile(path.resolve(process.argv[artifactAt + 1]), gallery(all, madeOn));
console.log(`Wrote ${all.length} designs to ${path.relative(ROOT, OUT)}`);
