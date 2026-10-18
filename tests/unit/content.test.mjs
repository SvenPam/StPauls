import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { itemPermalink } from '../../config/content.js';

const REPO = resolve(import.meta.dirname, '../..');

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
