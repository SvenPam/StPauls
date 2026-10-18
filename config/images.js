// Layout pictures: {% picture { src: 'images/map.png', alt: '...' } %} writes WebP and original-format
// copies at several widths into the output folder and returns a <picture>.
// `fill: 'WxH'` crops to that aspect (cards). Resized files are cached in .cache/images/, keyed on the source bytes,
// width, format, quality and fill.
import sharp from 'sharp';
import { createHash, randomBytes } from 'node:crypto';
import { statSync } from 'node:fs';
import { access, copyFile, mkdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';

const CACHE = '.cache/images';
const ASSETS = 'site/assets';
const WIDTHS = [480, 800, 1200, 1600];
const QUALITY = { webp: 75, png: 90, jpeg: 80 };
const FALLBACK_MAX = 800;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&#34;').replace(/'/g, '&#39;');
const exists = (p) => access(p).then(() => true, () => false);

// `crop` is the fill aspect as [w, h], or null. Uncropped keys are unchanged, so existing file names stay the same.
async function variant(input, srcHash, name, width, format, out, crop = null) {
  const id = `${srcHash}:${width}:${format}:${QUALITY[format]}${crop ? `:fill=${crop.join('x')}` : ''}`;
  const key = createHash('sha256').update(id).digest('hex').slice(0, 16);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const cached = path.join(CACHE, `${key}.${ext}`);
  if (!(await exists(cached))) {
    await mkdir(CACHE, { recursive: true });
    // A crop may scale a short source up to fill the height; widths are still capped at the source width.
    const img = sharp(input).resize(crop
      ? { width, height: Math.round((width * crop[1]) / crop[0]), fit: 'cover' }
      : { width, withoutEnlargement: true });
    // Write beside the final file, then rename: a concurrent build never sees a half-written image.
    const tmp = `${cached}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    await (format === 'webp' ? img.webp({ quality: QUALITY.webp }) : format === 'png' ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: QUALITY.jpeg })).toFile(tmp);
    await rename(tmp, cached);
  }
  const url = `/images/${name}-${width}.${key.slice(0, 8)}.${ext}`;
  const dest = path.join(out, url);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(cached, dest);
  return url;
}

const parseFill = (fill) => {
  const m = /^(\d+)x(\d+)$/.exec(String(fill ?? '').trim());
  return m && Number(m[1]) > 0 && Number(m[2]) > 0 ? [Number(m[1]), Number(m[2])] : null;
};

export async function pictureHtml({ src, alt = '', sizes = '100vw', eager = false, fill }, { assets = ASSETS, out = '_site' } = {}) {
  const file = path.join(assets, src);
  if (!(await exists(file))) throw new Error(`picture: asset "${src}" not found in ${assets}`);
  const input = await readFile(file);
  const meta = await sharp(input).metadata();
  const format = meta.format === 'jpeg' ? 'jpeg' : 'png';
  const srcHash = createHash('sha256').update(input).digest('hex');
  const name = path.basename(src, path.extname(src));

  const crop = parseFill(fill);
  if (fill && !crop) throw new Error(`picture: fill "${fill}" is not WxH`);
  let widths = (crop ? [crop[0], crop[0] * 2] : WIDTHS).filter((w) => w <= meta.width);
  if (!widths.length) widths = [meta.width];

  const webp = [];
  const orig = [];
  let fallback;
  for (const w of widths) {
    webp.push(`${await variant(input, srcHash, name, w, 'webp', out, crop)} ${w}w`);
    const url = await variant(input, srcHash, name, w, format, out, crop);
    orig.push(`${url} ${w}w`);
    if (crop) fallback ??= { url, width: crop[0], height: crop[1] };
    else if (w <= FALLBACK_MAX || !fallback) fallback = { url, width: w, height: Math.round((w * meta.height) / meta.width) };
  }
  return `<picture>
<source type="image/webp" srcset="${webp.join(', ')}" sizes="${esc(sizes)}">
<img src="${fallback.url}" srcset="${orig.join(', ')}" sizes="${esc(sizes)}" width="${fallback.width}" height="${fallback.height}" alt="${esc(alt)}" decoding="async"${eager ? '' : ' loading="lazy"'}>
</picture>`;
}

// A front matter image path as a source for `picture`, or '' when it is not a file under site/assets
// (an /uploads path, until spec 06). A leading slash is ignored.
export function assetPath(src, { assets = ASSETS } = {}) {
  if (typeof src !== 'string' || !src.trim()) return '';
  const rel = src.trim().replace(/^\/+/, '');
  const file = path.resolve(assets, rel);
  if (!file.startsWith(path.resolve(assets) + path.sep)) return '';
  try {
    return statSync(file).isFile() ? rel : '';
  } catch {
    return '';
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('assetPath', (src) => assetPath(src));
  eleventyConfig.addAsyncShortcode('picture', (opts) =>
    pictureHtml(opts, { assets: ASSETS, out: eleventyConfig.directories.output }),
  );
}
