// Internal links are written without a trailing slash, except "/".
export function href(url) {
  const s = String(url ?? '');
  return s.length > 1 && s.endsWith('/') && !s.includes('://') ? s.replace(/\/+$/, '') || '/' : s;
}

// A copy of a collection, newest first. Nunjucks' own reverse filter reverses in place.
export const newestFirst = (items) => [...(items ?? [])].reverse();

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ' };

// Visible text of an HTML body: tags removed, entities decoded once, whitespace collapsed.
export function plainText(html) {
  const text = String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|nbsp));/gi, (m, dec, hex, name) => {
      if (name) return NAMED[name.toLowerCase()];
      const code = dec ? Number(dec) : parseInt(hex, 16);
      return code === 160 ? ' ' : code <= 0x10ffff ? String.fromCodePoint(code) : m;
    });
  return text.replace(/\s+/g, ' ').trim();
}

// plainText cut at max code points, with an ellipsis when cut.
export function excerpt(html, max = 300) {
  const chars = [...plainText(html)];
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : chars.join('');
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('href', href);
  eleventyConfig.addFilter('newestFirst', newestFirst);
  eleventyConfig.addFilter('plainText', plainText);
  eleventyConfig.addFilter('excerpt', excerpt);
}
