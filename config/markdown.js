// The one Markdown renderer for Paul's bodies (spec 07a), shared by config/content.js and scripts/migrate.mjs.
// CommonMark plus tables. Raw HTML is allowed as a safety net for anything the editor writes as HTML;
// migrated bodies have none. Indented code is off, so an indented line never becomes a code box.
import MarkdownIt from 'markdown-it';

export const markdown = new MarkdownIt('default', { html: true, linkify: false, typographer: false, breaks: false }).disable('code');

// A paragraph holding only an image, or only a linked image, gets class="solo" so the stylesheet can centre it.
// An image that shares its paragraph with text is left alone.
markdown.core.ruler.push('solo_image', (state) => {
  const tokens = state.tokens;
  for (let i = 1; i < tokens.length; i += 1) {
    if (tokens[i].type !== 'inline' || tokens[i - 1].type !== 'paragraph_open') continue;
    const kinds = tokens[i].children.filter((c) => !(c.type === 'text' && !c.content.trim())).map((c) => c.type).join(' ');
    if (kinds === 'image' || kinds === 'link_open image link_close') tokens[i - 1].attrJoin('class', 'solo');
  }
});

export default function () {}
