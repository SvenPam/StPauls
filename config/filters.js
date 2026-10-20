import { readFileSync } from 'node:fs';
import path from 'node:path';
import { decodeHTML } from 'entities';

// Internal links are written without a trailing slash, except "/".
export function href(url) {
  const s = String(url ?? '');
  return s.length > 1 && s.endsWith('/') && !s.includes('://') ? s.replace(/\/+$/, '') || '/' : s;
}

// A copy of a collection, newest first. Nunjucks' own reverse filter reverses in place.
export const newestFirst = (items) => [...(items ?? [])].reverse();

// Visible text of an HTML body: tags removed, entities decoded once (every named entity),
// whitespace collapsed. A tag becomes a space so words in neighbouring blocks stay apart.
export function plainText(html) {
  // Characters XML 1.0 forbids would make a feed invalid. Numeric entities for them (&#0; decodes to U+FFFD)
  // go before decoding, raw ones after.
  const illegal = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
  const withoutIllegalEntities = String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (all, n) => {
      const code = n[0] === 'x' || n[0] === 'X' ? parseInt(n.slice(1), 16) : Number(n);
      return code <= 0x1f && ![0x09, 0x0a, 0x0d].includes(code) ? '' : all;
    });
  // Vertical tab and form feed are whitespace to a reader, so they become spaces rather than joining words.
  const text = decodeHTML(withoutIllegalEntities).replace(/[\u000B\u000C]/g, ' ').replace(illegal, '');
  return text.replace(/\s+/g, ' ').trim();
}

// plainText cut at max code points, with an ellipsis when cut.
export function excerpt(html, max = 300) {
  const chars = [...plainText(html)];
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : chars.join('');
}

// Pages for sitemap.xml: HTML pages only (their URL ends with /, so not feeds or 404.html), without
// `sitemap: false`, sorted by their address as written.
export function sitemapPages(all) {
  return [...(all ?? [])]
    .filter((p) => typeof p.url === 'string' && p.url.endsWith('/') && p.data.sitemap !== false)
    .sort((a, b) => (href(a.url) < href(b.url) ? -1 : href(a.url) > href(b.url) ? 1 : 0));
}

// One of live's 6 stock pictures (site/assets/images/generic-1.jpg to generic-6.jpg), from the item's file name, so it never changes between builds.
export function stockPicture(name) {
  let sum = 0;
  for (const ch of String(name ?? '')) sum += ch.codePointAt(0);
  return `images/generic-${1 + (sum % 6)}.jpg`;
}

// The first picture in a body: Markdown ![alt](src), or an <img> left in an old fixture.
export function firstImage(body) {
  const m = /!\[[^\]]*\]\(<?([^)>]+?)>?(?:\s+"[^"]*")?\)|<img\b[^>]*\bsrc=["']([^"']+)/i.exec(String(body ?? ''));
  return m ? (m[1] ?? m[2]) : '';
}

// A blog card's picture, as live: the image field, else the first picture in the body, else a stock picture.
// The body is read from the file: collection items do not keep their raw input.
export function cardImage(item) {
  if (item.data.image) return { src: item.data.image, alt: item.data.image_alt ?? '' };
  const body = readFileSync(item.inputPath, 'utf8');
  const first = firstImage(body);
  if (first) return { src: first, alt: '' };
  return { src: stockPicture(path.basename(item.inputPath, '.md')), alt: '' };
}

// A section's own _index.md page from collections.all, or an empty stand-in.
export const sectionIndex = (all, section) => (all ?? []).find((p) => p.data.isIndex && p.data.section === section) ?? { data: {} };

export default function (eleventyConfig) {
  eleventyConfig.addFilter('href', href);
  eleventyConfig.addFilter('newestFirst', newestFirst);
  eleventyConfig.addFilter('plainText', plainText);
  eleventyConfig.addFilter('excerpt', excerpt);
  eleventyConfig.addFilter('sitemapPages', sitemapPages);
  eleventyConfig.addFilter('stockPicture', stockPicture);
  eleventyConfig.addFilter('cardImage', cardImage);
  eleventyConfig.addFilter('sectionIndex', sectionIndex);
}
