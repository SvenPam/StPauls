// Paul's content: every .md file is front matter plus an HTML body that Pages CMS saved.
// Bodies are published byte for byte, with no Markdown and no Nunjucks.
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

// The file name keeps its date prefix (2026-01-05-dated stays whole). Eleventy's fileSlug drops it, so it is not used.
export function itemPermalink(inputPath, data) {
  const section = sectionOf(inputPath);
  if (!SECTIONS.includes(section)) return false;
  if (isIndex(inputPath)) return `/${section}/index.html`;
  const url = data.url ? String(data.url).trim().replace(/\/+$/, '') : '';
  if (url) return `${url}/index.html`;
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
