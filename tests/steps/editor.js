import { expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { Given, Then } from './fixtures.js';

const REPO = resolve('..');
const read = (path) => parse(readFileSync(join(REPO, path), 'utf8'));
// Collections and files, with a group's items in its place.
const entries = (cfg) => cfg.content.flatMap((c) => (c.type === 'group' ? c.items : [c]));
const collection = (cfg, name) => entries(cfg).find((c) => c.name === name);
const names = (list) => list.split(',').map((n) => n.trim());
const field = (cfg, name, key) => collection(cfg, name).fields.find((f) => f.name === key);

Given('the Pages CMS config', async ({ ui }) => {
  ui.cfg = read('.pages.yml');
});

Then('the {string} collection saves to {string}', async ({ ui }, name, path) => {
  const c = collection(ui.cfg, name);
  expect(c.path).toBe(path);
  expect(c.filename).toBe('{year}-{month}-{day}-{primary}.md');
  expect(c.exclude).toEqual(['_index.md']);
  expect(c.operations?.rename).toBe(false);
  expect(c.view.default).toEqual({ sort: 'date', order: 'desc' });
});

Then('saving keeps front matter the form does not show', async ({ ui }) => {
  expect(ui.cfg.settings?.content?.merge).toBe(true);
});

Then('the {string} collection has a hidden {string} field', async ({ ui }, name, key) => {
  expect(field(ui.cfg, name, key)).toMatchObject({ type: 'string', hidden: true });
});

Then('every rich text field saves HTML', async ({ ui }) => {
  const rich = entries(ui.cfg).flatMap((c) => c.fields).filter((f) => f.type === 'rich-text');
  expect(rich.length).toBeGreaterThan(0);
  for (const f of rich) expect(f.options?.format).toBe('html');
});

Then('the {string} collection saves {string} as date and time {string}', async ({ ui }, name, key, format) => {
  expect(field(ui.cfg, name, key).options).toEqual({ time: true, format });
});

Then('the {string} collection offers the site topics as {string}', async ({ ui }, name, key) => {
  const topics = read('site/data/topics.yaml');
  const values = field(ui.cfg, name, key).options.values;
  expect(values).toEqual(Object.entries(topics).map(([n, label]) => ({ name: n, label })));
});

Then('a title of {string} is {word}', async ({ ui }, title, outcome) => {
  for (const c of entries(ui.cfg)) {
    const re = new RegExp(field(ui.cfg, c.name, 'title').pattern.regex);
    expect(re.test(title), `${c.name}: "${title}"`).toBe(outcome === 'allowed');
  }
});

Then('the {string} entry edits the file {string}', async ({ ui }, name, path) => {
  expect(collection(ui.cfg, name)).toMatchObject({ type: 'file', path, operations: { delete: false } });
});

Then('the {string} entry has the fields {string}', async ({ ui }, name, list) => {
  expect(collection(ui.cfg, name).fields.map((f) => f.name)).toEqual(names(list));
});

Then('the {string} group holds, in order:', async ({ ui }, name, table) => {
  const group = ui.cfg.content.find((c) => c.name === name);
  expect(group.type).toBe('group');
  expect(group.items.map((c) => c.name)).toEqual(table.raw().map((r) => r[0]));
});

Then('every page collection saves to its type folder with the fields {string}', async ({ ui }, list) => {
  const pages = ui.cfg.content.find((c) => c.name === 'pages').items;
  for (const c of pages) {
    const type = c.name.replace(/^page-/, '');
    expect(c, c.name).toMatchObject({ type: 'collection', path: `site/content/page/${type}`, filename: '{primary}.md', exclude: ['_index.md'], operations: { rename: false } });
    expect(c.fields.map((f) => f.name), c.name).toEqual(names(list));
  }
});

Then('the real content builds', async () => {
  const out = mkdtempSync(join(tmpdir(), 'stpauls-real-'));
  try {
    const { CONTENT, ...env } = process.env;
    execFileSync('npx', ['@11ty/eleventy', `--output=${out}`, '--quiet'], { cwd: REPO, env, stdio: 'pipe' });
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
