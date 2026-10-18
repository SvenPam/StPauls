// Paul's content: every .md file is front matter plus an HTML body that Pages CMS saved.
// Bodies are published byte for byte, with no Markdown and no Nunjucks.
import path from 'node:path';

export const CONTENT_DIR = process.env.CONTENT ?? 'site/content';

const SECTIONS = ['blog', 'calendar', 'notices'];

// Live URL patterns for items without a migrated `url`.
const ITEM_PATHS = {
  blog: '/blog/article',
  calendar: '/calendar/event',
  notices: '/notices/notice',
};

// The front matter field that holds each section's topic, as Hugo's taxonomies named them.
export const TOPIC_FIELDS = {
  blog: 'blogtopics',
  calendar: 'eventtopics',
  notices: 'noticetopics',
};

// An item's topic slug: the first value of its section's topic field, lowercased as Hugo did, or ''.
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

// The file name keeps its date prefix, as Hugo did. Eleventy's fileSlug drops it, so it is not used.
export function itemPermalink(inputPath, data) {
  const section = sectionOf(inputPath);
  if (!SECTIONS.includes(section)) return false;
  if (isIndex(inputPath)) return `/${section}/index.html`;
  if (data.url) return `${String(data.url).replace(/\/+$/, '')}/index.html`;
  return `${ITEM_PATHS[section]}/${path.basename(inputPath, '.md')}/index.html`;
}

const isContent = (inputPath) => inputPath.endsWith('.md');

export default function (eleventyConfig) {
  eleventyConfig.addExtension('md', { compile: (body) => () => body });

  // Computed `layout` did not work in the spike, so it is plain global data. Site pages set their own.
  eleventyConfig.addGlobalData('layout', 'content.njk');
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
}
