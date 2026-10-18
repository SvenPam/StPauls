import { test } from 'node:test';
import assert from 'node:assert/strict';
import { href, plainText, excerpt } from '../../config/filters.js';

test('href drops a trailing slash except on the root', () => {
  assert.equal(href('/blog/article/a8/'), '/blog/article/a8');
  assert.equal(href('/'), '/');
  assert.equal(href('https://example.org/'), 'https://example.org/');
});

test('href leaves a url without a trailing slash alone', () => {
  assert.equal(href('/notices'), '/notices');
});

test('plainText decodes entities once', () => {
  assert.equal(plainText("<p>Tea &amp; cake at St Paul&#39;s&nbsp;hall</p>"), "Tea & cake at St Paul's hall");
});

test('excerpt cuts long text at 300 characters', () => {
  assert.equal([...excerpt(`<p>${'a'.repeat(400)}</p>`)].length, 301);
  assert.equal(excerpt('<p>short</p>'), 'short');
});
