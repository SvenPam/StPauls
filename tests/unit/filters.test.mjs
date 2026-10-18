import { test } from 'node:test';
import assert from 'node:assert/strict';
import { href, plainText, excerpt, sitemapPages } from '../../config/filters.js';

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

test('plainText decodes every named entity', () => {
  assert.equal(plainText('<p>St Paul&rsquo;s &ndash; tickets &pound;5&hellip;</p>'), 'St Paul\u2019s \u2013 tickets \u00a35\u2026');
  assert.equal(plainText('&amp;rsquo; stays as text'), '&rsquo; stays as text');
});

test('excerpt cuts long text at 300 characters', () => {
  assert.equal([...excerpt(`<p>${'a'.repeat(400)}</p>`)].length, 301);
  assert.equal(excerpt('<p>short</p>'), 'short');
});

test('plainText strips characters XML 1.0 forbids, also from numeric entities', () => {
  assert.equal(plainText('<p>a&#0;b&#8;c\u0001d\u000be\u001ff&#x1F;g</p>'), 'abcd efg');
  assert.equal(plainText('<p>tab\there\nand\u000cmore</p>'), 'tab here and more');
});

test('sitemapPages keeps HTML pages not opted out, sorted by address', () => {
  const all = [
    { url: '/blog-x/', data: {} },
    { url: '/blog/', data: {} },
    { url: '/', data: {} },
    { url: '/404.html', data: {} },
    { url: '/blog/index.xml', data: {} },
    { url: false, data: {} },
    { url: '/sitemap/', data: { sitemap: false } },
  ];
  assert.deepEqual(sitemapPages(all).map((p) => p.url), ['/', '/blog/', '/blog-x/']);
});
