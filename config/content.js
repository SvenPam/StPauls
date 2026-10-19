// Paul's content: every .md file is front matter plus a Markdown body that Pages CMS saved.
// Eleventy's own Markdown library renders it with no template engine (markdownTemplateEngine: false in
// eleventy.config.js), so {{ }} and {% %} stay as written.
import path from 'node:path';

// Relative to the working directory, because Eleventy globs and input paths are. An absolute CONTENT is converted.
export const CONTENT_DIR = path.relative(process.cwd(), path.resolve(process.env.CONTENT ?? 'site/content')).split(path.sep).join('/');

const SECTIONS = ['blog', 'calendar', 'notices'];

// Live URL patterns for items without a migrated `url`.
const ITEM_PATHS = {
  blog: '/blog/article',
  calendar: '/calendar/event',
  notices: '/notices/notice',
};

// The front matter field that holds each section's topic.
export const TOPIC_FIELDS = {
  blog: 'blogtopics',
  calendar: 'eventtopics',
  notices: 'noticetopics',
};

// An item's topic slug: the first value of its section's topic field, lowercased, or ''.
export function topicOf(section, data) {
  const value = data[TOPIC_FIELDS[section]];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first.trim().toLowerCase() : '';
}

const relativeToContent = (inputPath) => path.relative(CONTENT_DIR, inputPath).split(path.sep).join('/');

// The folder under the content dir ('' at its root).
export function sectionOf(inputPath) {
  const dir = path.posix.dirname(relativeToContent(inputPath));
  return dir === '.' ? '' : dir;
}

export function isIndex(inputPath) {
  return path.basename(inputPath, '.md') === '_index';
}

const trimUrl = (data) => (data.url ? String(data.url).trim().replace(/\/+$/, '') : '');

// The file name keeps its date prefix (2026-01-05-dated stays whole). Eleventy's fileSlug drops it, so it is not used.
// Root: _index.md is the home page, any other file needs a `url`. Pages: /page/{type}/{name} unless they carry a `url`;
// page/_index.md and the page type _index.md files are not rendered.
export function itemPermalink(inputPath, data) {
  const section = sectionOf(inputPath);
  const name = path.basename(inputPath, '.md');
  const url = trimUrl(data);
  if (section === '') {
    if (isIndex(inputPath)) return '/index.html';
    return url ? `${url}/index.html` : false;
  }
  const [top, type, ...deeper] = section.split('/');
  if (top === 'page') {
    if (isIndex(inputPath) || !type || deeper.length) return false;
    return url ? `${url}/index.html` : `/page/${type}/${name}/index.html`;
  }
  if (!SECTIONS.includes(section)) return false;
  if (isIndex(inputPath)) return `/${section}/index.html`;
  if (url) return `${url}/index.html`;
  return `${ITEM_PATHS[section]}/${name}/index.html`;
}

const isContent = (inputPath) => inputPath.endsWith('.md');

export default function (eleventyConfig) {
  // CommonMark plus tables. Indented code is off, so an indented line never becomes a code box. A paragraph holding
  // only an image, or only a linked image, gets class="solo" so the stylesheet can centre it.
  eleventyConfig.amendLibrary('md', (md) => {
    md.set({ linkify: false, typographer: false, breaks: false }).disable('code');
    md.core.ruler.push('solo_image', (state) => {
      const tokens = state.tokens;
      for (let i = 1; i < tokens.length; i += 1) {
        if (tokens[i].type !== 'inline' || tokens[i - 1].type !== 'paragraph_open') continue;
        const kinds = tokens[i].children.filter((c) => !(c.type === 'text' && !c.content.trim())).map((c) => c.type).join(' ');
        if (kinds === 'image' || kinds === 'link_open image link_close') tokens[i - 1].attrJoin('class', 'solo');
      }
    });
  });

  // Computed `layout` did not work in the spike, so it is plain global data. Site pages set their own.
  eleventyConfig.addGlobalData('layout', 'content.njk');
  // An empty `layout` (a blank hidden field saved by Pages CMS) would publish the body with no site around it.
  eleventyConfig.addPreprocessor('blank-layout', 'md', (data) => {
    if (data.layout == null || !String(data.layout).trim()) data.layout = 'content.njk';
  });
  eleventyConfig.addGlobalData('eleventyComputed', {
    section: (data) => (isContent(data.page.inputPath) ? sectionOf(data.page.inputPath) : undefined),
    isIndex: (data) => isContent(data.page.inputPath) && isIndex(data.page.inputPath),
    topic: (data) => (isContent(data.page.inputPath) ? topicOf(sectionOf(data.page.inputPath), data) : undefined),
    permalink: (data) => (isContent(data.page.inputPath) ? itemPermalink(data.page.inputPath, data) : data.permalink),
  });

  // Items only, oldest first (Eleventy's default date order).
  for (const section of SECTIONS) {
    eleventyConfig.addCollection(section, (api) =>
      api.getFilteredByGlob(`${CONTENT_DIR}/${section}/*.md`).filter((item) => !isIndex(item.inputPath)),
    );
  }

  // Page types carry the menu label and order, pages their menu flags. config/menus.js sorts both.
  eleventyConfig.addCollection('pageTypes', (api) => api.getFilteredByGlob(`${CONTENT_DIR}/page/*/_index.md`));
  eleventyConfig.addCollection('pages', (api) =>
    api.getFilteredByGlob(`${CONTENT_DIR}/page/*/*.md`).filter((item) => !isIndex(item.inputPath)),
  );
}
