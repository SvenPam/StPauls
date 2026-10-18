// Internal links are written without a trailing slash, except "/".
export function href(url) {
  const s = String(url ?? '');
  return s.length > 1 && s.endsWith('/') && !s.includes('://') ? s.replace(/\/+$/, '') || '/' : s;
}

// A copy of a collection, newest first. Nunjucks' own reverse filter reverses in place.
export const newestFirst = (items) => [...(items ?? [])].reverse();

export default function (eleventyConfig) {
  eleventyConfig.addFilter('href', href);
  eleventyConfig.addFilter('newestFirst', newestFirst);
}
