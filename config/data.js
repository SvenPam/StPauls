// Each site/data/*.yaml file is a global named after the file: topics.yaml is `topics`.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const DATA_DIR = 'site/data';

export default function (eleventyConfig) {
  for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith('.yaml')).sort()) {
    eleventyConfig.addGlobalData(path.basename(file, '.yaml'), parse(readFileSync(path.join(DATA_DIR, file), 'utf8')));
  }
}
