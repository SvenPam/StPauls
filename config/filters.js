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

export default function (eleventyConfig) {
  eleventyConfig.addFilter('href', href);
  eleventyConfig.addFilter('newestFirst', newestFirst);
  eleventyConfig.addFilter('plainText', plainText);
  eleventyConfig.addFilter('excerpt', excerpt);
}
