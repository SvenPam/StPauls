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

Then('every rich text field saves Markdown', async ({ ui }) => {
  const rich = entries(ui.cfg).flatMap((c) => c.fields).filter((f) => f.type === 'rich-text');
  expect(rich.length).toBeGreaterThan(0);
  for (const f of rich) expect(f.options?.format).toBe('markdown');
});

Then('the {string} collection saves {string} as date and time {string}', async ({ ui }, name, key, format) => {
  expect(field(ui.cfg, name, key).options).toEqual({ time: true, format });
});

Then('the {string} collection offers the site topics as {string}', async ({ ui }, name, key) => {
  const topics = read('site/data/topics.yaml');
  const values = field(ui.cfg, name, key).options.values;
  expect(values).toEqual(Object.entries(topics).map(([n, label]) => ({ name: n, label })));
});

Then('the {string} collection offers the site embeds as {string}', async ({ ui }, name, key) => {
  const embeds = read('site/data/embeds.yaml');
  const values = field(ui.cfg, name, key).options.values;
  expect(values).toEqual(Object.entries(embeds).map(([n, e]) => ({ name: n, label: e.title })));
});

Then('a title of {string} is {word}', async ({ ui }, title, outcome) => {
  // Every entry with a title; Site settings has none.
  for (const c of entries(ui.cfg).filter((e) => field(ui.cfg, e.name, 'title'))) {
    const re = new RegExp(field(ui.cfg, c.name, 'title').pattern.regex);
    expect(re.test(title), `${c.name}: "${title}"`).toBe(outcome === 'allowed');
  }
});

// Pages CMS checks the key against this pattern; config/contact.js applies the same one to what gets saved.
Then('a contact key of {string} is {word}', async ({ ui }, key, outcome) => {
  const re = new RegExp(field(ui.cfg, 'settings', 'contact_access_key').pattern.regex);
  expect(re.test(key.replace(/\\n/g, '\n')), JSON.stringify(key)).toBe(outcome === 'allowed');
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

Then('the {string} collection has a required date {string} labelled {string}', async ({ ui }, name, key, label) => {
  expect(field(ui.cfg, name, key)).toMatchObject({ type: 'date', label, required: true });
});

Then('the {string} collection has an optional date {string} labelled {string}', async ({ ui }, name, key, label) => {
  const f = field(ui.cfg, name, key);
  expect(f).toMatchObject({ type: 'date', label });
  expect(f.required).toBeFalsy();
});

Then('the {string} collection has a required string {string} labelled {string}', async ({ ui }, name, key, label) => {
  expect(field(ui.cfg, name, key)).toMatchObject({ type: 'string', label, required: true });
});

Then('every page collection has a {string} tick box labelled {string}', async ({ ui }, key, label) => {
  const pages = entries(ui.cfg).filter((c) => String(c.path ?? '').startsWith('site/content/page/'));
  expect(pages.length).toBeGreaterThan(0);
  for (const c of pages) expect(c.fields.find((f) => f.name === key), c.name).toMatchObject({ type: 'boolean', label });
});

// Every field Paul can see, in every collection and file, groups included.
const visibleFields = (cfg) => entries(cfg).flatMap((c) => c.fields.map((f) => ({ ...f, entry: c.name }))).filter((f) => !f.hidden);

Then('the sidebar is, in order:', async ({ ui }, table) => {
  expect(ui.cfg.content.map((c) => c.name)).toEqual(table.raw().map((r) => r[0]));
});

Then('every field that is not hidden has a label', async ({ ui }) => {
  for (const f of visibleFields(ui.cfg)) expect(String(f.label ?? '').trim(), `${f.entry}.${f.name}`).not.toBe('');
});

Then('no label is one of {string}', async ({ ui }, list) => {
  const banned = names(list).map((n) => n.toLowerCase());
  for (const f of visibleFields(ui.cfg)) expect(banned, `${f.entry}.${f.name}: "${f.label}"`).not.toContain(String(f.label).toLowerCase());
});

Then('a field description says {string}', async ({ ui }, text) => {
  expect(visibleFields(ui.cfg).some((f) => String(f.description ?? '').includes(text))).toBe(true);
});

Then('uploads are renamed to safe names', async ({ ui }) => {
  expect(ui.cfg.media.rename).toBe('safe');
});

Then('uploads can be images or documents', async ({ ui }) => {
  expect(ui.cfg.media.categories).toEqual(['image', 'document']);
});
