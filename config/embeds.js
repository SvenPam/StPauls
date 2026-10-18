// Embeds: a page's `embed` (a key of site/data/embeds.yaml) and `embed_src` (the address the calendar or gallery gives).
// Rendered only when the address is https on exactly the host that key allows, so a pasted address cannot frame another site.

// { key, src, title } for a page's embed, or null.
export function embedFor(data, embeds) {
  const key = data?.embed;
  const entry = typeof key === 'string' && Object.hasOwn(embeds ?? {}, key) ? embeds[key] : null;
  if (!entry || typeof data.embed_src !== 'string') return null;
  let url;
  try {
    url = new URL(data.embed_src.trim().replace(/^\/\//, 'https://'));
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.host !== entry.host) return null;
  return { key, src: url.href, title: entry.title };
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('embedFor', embedFor);
}
