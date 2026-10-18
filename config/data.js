// Each site/data/*.yaml file is a global named after the file: topics.yaml is `topics`.
// DATA names an optional folder, relative to the repo root, whose files win over site/data by name (tests use it).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

// A DATA folder that is missing (a typo) would quietly build from Paul's files instead, so it stops the build.
if (process.env.DATA && !existsSync(process.env.DATA)) throw new Error(`DATA folder not found: ${process.env.DATA}`);
const DATA_DIRS = ['site/data', process.env.DATA].filter(Boolean);

// Every data file as { name: parsed }, later folders winning. Also read by config/swa.js, outside Eleventy.
export function readData() {
  const files = {};
  for (const dir of DATA_DIRS) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.yaml'))) files[path.basename(file, '.yaml')] = path.join(dir, file);
  }
  const data = {};
  for (const name of Object.keys(files).sort()) data[name] = parse(readFileSync(files[name], 'utf8'));
  return data;
}

export default function (eleventyConfig) {
  for (const [name, value] of Object.entries(readData())) {
    eleventyConfig.addGlobalData(name, value);
  }
}
