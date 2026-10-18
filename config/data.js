// Each site/data/*.yaml file is a global named after the file: topics.yaml is `topics`.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const DATA_DIR = 'site/data';

// Every data file as { name: parsed }. Also read by config/swa.js, outside Eleventy.
export function readData() {
  const data = {};
  for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith('.yaml')).sort()) {
    data[path.basename(file, '.yaml')] = parse(readFileSync(path.join(DATA_DIR, file), 'utf8'));
  }
  return data;
}

export default function (eleventyConfig) {
  for (const [name, value] of Object.entries(readData())) {
    eleventyConfig.addGlobalData(name, value);
  }
}
