// Layout pictures: {% picture { src: 'images/map.png', alt: '...' } %} writes WebP and original-format
// copies at several widths into the output folder and returns a <picture>.
// Resized files are cached in .cache/images/, keyed on the source bytes, width, format and quality.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE = '.cache/images';
const ASSETS = 'site/assets';
const WIDTHS = [480, 800, 1200, 1600];
const QUALITY = { webp: 75, png: 90, jpeg: 80 };
const FALLBACK_MAX = 800;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').replace(/'/g, '&#39;');
const exists = (p) => access(p).then(() => true, () => false);

async function variant(input, srcHash, name, width, format, out) {
  const key = createHash('sha256').update(`${srcHash}:${width}:${format}:${QUALITY[format]}`).digest('hex').slice(0, 16);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const cached = path.join(CACHE, `${key}.${ext}`);
  if (!(await exists(cached))) {
    await mkdir(CACHE, { recursive: true });
    const img = sharp(input).resize({ width, withoutEnlargement: true });
    await (format === 'webp' ? img.webp({ quality: QUALITY.webp }) : format === 'png' ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: QUALITY.jpeg })).toFile(cached);
  }
  const url = `/images/${name}-${width}.${key.slice(0, 8)}.${ext}`;
  const dest = path.join(out, url);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(cached, dest);
  return url;
}

export async function pictureHtml({ src, alt = '', sizes = '100vw', eager = false }, { assets = ASSETS, out = '_site' } = {}) {
  const file = path.join(assets, src);
  if (!(await exists(file))) throw new Error(`picture: asset "${src}" not found in ${assets}`);
  const input = await readFile(file);
  const meta = await sharp(input).metadata();
  const format = meta.format === 'jpeg' ? 'jpeg' : 'png';
  const srcHash = createHash('sha256').update(input).digest('hex');
  const name = path.basename(src, path.extname(src));

  let widths = WIDTHS.filter((w) => w <= meta.width);
  if (!widths.length) widths = [meta.width];

  const webp = [];
  const orig = [];
  let fallback;
  for (const w of widths) {
    webp.push(`${await variant(input, srcHash, name, w, 'webp', out)} ${w}w`);
    const url = await variant(input, srcHash, name, w, format, out);
    orig.push(`${url} ${w}w`);
    if (w <= FALLBACK_MAX || !fallback) fallback = { url, width: w, height: Math.round((w * meta.height) / meta.width) };
  }
  return `<picture>
<source type="image/webp" srcset="${webp.join(', ')}" sizes="${esc(sizes)}">
<img src="${fallback.url}" srcset="${orig.join(', ')}" sizes="${esc(sizes)}" width="${fallback.width}" height="${fallback.height}" alt="${esc(alt)}" decoding="async"${eager ? '' : ' loading="lazy"'}>
</picture>`;
}

export default function (eleventyConfig) {
  eleventyConfig.addAsyncShortcode('picture', (opts) =>
    pictureHtml(opts, { assets: ASSETS, out: eleventyConfig.directories.output }),
  );
}
