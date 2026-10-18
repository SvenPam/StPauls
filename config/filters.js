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
  const text = decodeHTML(String(html ?? '').replace(/<[^>]*>/g, ' '));
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
