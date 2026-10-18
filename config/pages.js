// Site-owned pages (404, topic pages and feeds) live in site/pages/, outside the content dir.
// Each sets its own `layout` and `permalink`.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const PAGES_DIR = 'site/pages';

export default function (eleventyConfig) {
  for (const file of readdirSync(PAGES_DIR).filter((f) => f.endsWith('.njk')).sort()) {
    eleventyConfig.addTemplate(file, readFileSync(path.join(PAGES_DIR, file), 'utf8'));
  }
}
