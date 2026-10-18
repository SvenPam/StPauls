// Internal links are written without a trailing slash, except "/".
export function href(url) {
  const s = String(url ?? '');
  return s.length > 1 && s.endsWith('/') && !s.includes('://') ? s.replace(/\/+$/, '') || '/' : s;
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('href', href);
}
