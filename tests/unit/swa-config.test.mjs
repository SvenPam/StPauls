// Checks the staticwebapp.config.json that Eleventy writes after a build, using the fixture content.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildSwaConfig } from '../../config/swa.js';
import { readData } from '../../config/data.js';

let out;
let raw;
let config;

before(async () => {
  out = await mkdtemp(path.join(tmpdir(), 'swa-'));
  execFileSync('npx', ['eleventy', `--output=${out}`], {
    env: { ...process.env, CONTENT: 'tests/fixtures/content' },
    stdio: 'pipe',
  });
  raw = await readFile(path.join(out, 'staticwebapp.config.json'), 'utf8');
  config = JSON.parse(raw);
});

after(async () => {
  await rm(out, { recursive: true, force: true });
});

test('staticwebapp.config.json is built, parses and is under 20 KB', async () => {
  assert.ok(Array.isArray(config.routes), 'routes is not an array');
  const { size } = await stat(path.join(out, 'staticwebapp.config.json'));
  assert.ok(size < 20 * 1024, `config is ${size} bytes`);
});

test('the root is served, not redirected', () => {
  assert.deepEqual(config.routes.filter((r) => r.route === '/'), []);
  assert.deepEqual(config.responseOverrides, { 404: { rewrite: '/404.html', statusCode: 404 } });
});

test('the 404 override rewrites to a built page with status 404', () => {
  const override = config.responseOverrides['404'];
  assert.equal(override.statusCode, 404);
  assert.ok(existsSync(path.join(out, override.rewrite)), `${override.rewrite} is not in the build`);
});

test('every local redirect target exists in the build', () => {
  const missing = config.routes
    .filter((r) => typeof r.redirect === 'string' && r.redirect.startsWith('/'))
    .filter((r) => {
      const p = path.join(out, r.redirect);
      return !(existsSync(p) && (r.redirect.endsWith('/') ? existsSync(path.join(p, 'index.html')) : true)) && !existsSync(`${p}.html`);
    })
    .map((r) => `${r.route} -> ${r.redirect}`);
  assert.deepEqual(missing, []);
});

test('route values are unique exactly as written, because matching is case-sensitive', () => {
  const seen = new Set();
  const dupes = [];
  for (const { route } of config.routes) {
    if (seen.has(route)) dupes.push(route);
    seen.add(route);
  }
  assert.deepEqual(dupes, []);
});

test('no route is percent-encoded, because Azure matches the decoded path', () => {
  assert.deepEqual(config.routes.filter((r) => /%[0-9a-f]{2}/i.test(r.route)).map((r) => r.route), []);
});

test('buildSwaConfig writes the file into the folder it is given and returns the config', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'swa-unit-'));
  try {
    await mkdir(path.join(dir, 'x'));
    await writeFile(path.join(dir, '404.html'), '');
    const returned = await buildSwaConfig(dir, readData());
    assert.deepEqual(JSON.parse(await readFile(path.join(dir, 'staticwebapp.config.json'), 'utf8')), returned);
    assert.deepEqual(returned, config);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const matches = (route, path) => (route.endsWith('*') ? path.startsWith(route.slice(0, -1)) : route === path);

test('trailing slashes are never kept', () => {
  assert.equal(config.trailingSlash, 'never');
});

test('mixed-case legacy links redirect to the lower-case page', () => {
  const rd = Object.fromEntries(config.routes.filter((r) => r.redirect).map((r) => [r.route, [r.redirect, r.statusCode]]));
  assert.deepEqual(rd['/Calendar'], ['/calendar', 301]);
  assert.deepEqual(rd['/Contact'], ['/contact', 301]);
  assert.deepEqual(rd['/account*'], ['/', 301]);
  assert.deepEqual(rd['/Account*'], ['/', 301]);
});

test('no redirect can match its own target', () => {
  assert.deepEqual(config.routes.filter((r) => r.redirect && matches(r.route, r.redirect)), []);
});

test('every local rewrite target exists in the build', () => {
  assert.deepEqual(config.routes.filter((r) => r.rewrite && !existsSync(path.join(out, r.rewrite))).map((r) => r.route), []);
});

test('a new legacy upload gets a route from every prefix', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'swa-up-'));
  try {
    await mkdir(path.join(dir, 'uploads/legacy/Gallery'), { recursive: true });
    await writeFile(path.join(dir, 'uploads/legacy/Gallery/My Poster.pdf'), '');
    await writeFile(path.join(dir, 'uploads/not-legacy.pdf'), '');
    const legacy = { rewrites: [], redirects: [], upload_prefixes: ['/Areas/st_pauls/Uploads', '/Areas/St_Pauls/Uploads'] };
    const { routes } = await buildSwaConfig(dir, { legacy });
    assert.deepEqual(routes, [
      { route: '/Areas/st_pauls/Uploads/Gallery/My Poster.pdf', redirect: '/uploads/legacy/Gallery/My%20Poster.pdf', statusCode: 301 },
      { route: '/Areas/St_Pauls/Uploads/Gallery/My Poster.pdf', redirect: '/uploads/legacy/Gallery/My%20Poster.pdf', statusCode: 301 },
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
