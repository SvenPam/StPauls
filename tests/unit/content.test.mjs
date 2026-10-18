import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { itemPermalink } from '../../config/content.js';

const REPO = resolve(import.meta.dirname, '../..');

const at = (p) => `site/content/${p}`;

test('pages publish under /page/{type}/{name}, page types and the pages root do not', () => {
  assert.equal(itemPermalink(at('page/about/about-us.md'), {}), '/page/about/about-us/index.html');
  assert.equal(itemPermalink(at('page/about/contact-us.md'), { url: '/contact' }), '/contact/index.html');
  assert.equal(itemPermalink(at('page/about/_index.md'), {}), false);
  assert.equal(itemPermalink(at('page/_index.md'), {}), false);
  assert.equal(itemPermalink(at('page/extra/stray.md'), {}), '/page/extra/stray/index.html');
});

test('the root index is the home page, other root files need a url', () => {
  assert.equal(itemPermalink(at('_index.md'), {}), '/index.html');
  assert.equal(itemPermalink(at('sitemap.md'), { url: '/sitemap' }), '/sitemap/index.html');
  assert.equal(itemPermalink(at('stray.md'), {}), false);
});

test('a url that trims to nothing falls back to the pattern URL', () => {
  const file = 'site/content/notices/odd.md';
  assert.equal(itemPermalink(file, { url: '/' }), '/notices/notice/odd/index.html');
  assert.equal(itemPermalink(file, { url: '' }), '/notices/notice/odd/index.html');
  assert.equal(itemPermalink(file, { url: '  ' }), '/notices/notice/odd/index.html');
  assert.equal(itemPermalink(file, { url: '/notices/notice/46/x' }), '/notices/notice/46/x/index.html');
});

test('an absolute CONTENT path still fills the section lists and feeds', () => {
  const out = mkdtempSync(join(tmpdir(), 'stpauls-abs-'));
  execFileSync('npx', ['@11ty/eleventy', `--output=${out}`, '--quiet'], {
    cwd: REPO,
    env: { ...process.env, CONTENT: resolve(REPO, 'tests/fixtures/content') },
    stdio: 'pipe',
  });
  const files = readdirTree(out);
  const feed = join(out, 'notices/index.xml');
  assert.ok(existsSync(feed));
  assert.match(readFileSync(feed, 'utf8'), /<item>|<entry>/);
  assert.ok(existsSync(join(out, 'notices/notice/newer/index.html')));
});

import { readdirSync, statSync } from 'node:fs';
function readdirTree(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? readdirTree(p) : [p];
  });
}
