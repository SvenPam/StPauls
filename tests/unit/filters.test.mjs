import { test } from 'node:test';
import assert from 'node:assert/strict';
import { href } from '../../config/filters.js';

test('href drops a trailing slash except on the root', () => {
  assert.equal(href('/blog/article/a8/'), '/blog/article/a8');
  assert.equal(href('/'), '/');
  assert.equal(href('https://example.org/'), 'https://example.org/');
});

test('href leaves a url without a trailing slash alone', () => {
  assert.equal(href('/notices'), '/notices');
});
