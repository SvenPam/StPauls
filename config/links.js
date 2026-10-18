// Links that open a new tab get rel="noopener", so the new page cannot reach back into this one.
// Legacy bodies carry such links in any case and quoting; templates write rel="noopener" themselves.

// Quoted attribute values may hold '>'.
const A_TAG = /<a\s(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
const BLANK = /\starget\s*=\s*(["']?)_blank\1(?=[\s>/])/i;
const REL = /(\srel\s*=\s*)(["'])(.*?)\2/i;

export function addNoopener(html) {
  return html.replace(A_TAG, (tag) => {
    if (!BLANK.test(tag)) return tag;
    const rel = tag.match(REL);
    if (!rel) return tag.replace(/\s*(\/?)>$/, ' rel="noopener"$1>');
    if (rel[3].toLowerCase().split(/\s+/).includes('noopener')) return tag;
    return tag.replace(REL, (_, name, q, value) => `${name}${q}${value.trim() ? `${value.trim()} ` : ''}noopener${q}`);
  });
}

export default function (eleventyConfig) {
  eleventyConfig.addTransform('noopener', function (content) {
    return this.page.outputPath?.endsWith?.('.html') ? addNoopener(content) : content;
  });
}
