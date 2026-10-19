import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { CONTENT_DIR } from './config/content.js';

export default async function (eleventyConfig) {
  // Auto-load every config/*.js module in alphabetical order.
  const dir = path.resolve('config');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.js')).sort();
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    await mod.default(eleventyConfig);
  }
  eleventyConfig.setQuietMode(true);
}

// Paul's content is the input folder. Layouts, site pages and data live in site/, outside it.
export const config = {
  dir: {
    input: CONTENT_DIR,
    includes: path.relative(CONTENT_DIR, 'site/_includes'),
    output: '_site',
  },
  templateFormats: ['md', 'njk'],
  htmlTemplateEngine: 'njk',
  // Bodies are plain Markdown: no Liquid or Nunjucks runs on them.
  markdownTemplateEngine: false,
};
