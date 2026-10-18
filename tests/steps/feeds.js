import { expect } from '@playwright/test';
import { EMPTY_SITE, Then, When } from './fixtures.js';

// Parsed in the browser: Node has no XML parser built in.
const readFeed = async (ui, request, url) => {
  const res = await request.get(url);
  expect(res.status()).toBe(200);
  const xml = await res.text();
  return ui.page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) return { error: doc.querySelector('parsererror').textContent };
    return {
      root: doc.documentElement.nodeName,
      version: doc.documentElement.getAttribute('version'),
      items: [...doc.querySelectorAll('channel > item')].map((i) => ({
        title: i.querySelector('title')?.textContent,
        link: i.querySelector('link')?.textContent,
        pubDate: i.querySelector('pubDate')?.textContent,
        description: i.querySelector('description')?.textContent,
      })),
    };
  }, xml);
};

When('I read the feed {string}', async ({ ui, request, baseURL }, path) => {
  ui.feed = await readFeed(ui, request, new URL(path, baseURL).href);
});

When('I read the feed {string} on the empty site', async ({ ui, request }, path) => {
  ui.feed = await readFeed(ui, request, EMPTY_SITE + path);
});

Then('it is valid RSS 2.0 with {int} item(s)', async ({ ui }, count) => {
  const feed = ui.feed;
  expect(feed.error).toBeUndefined();
  expect([feed.root, feed.version]).toEqual(['rss', '2.0']);
  expect(feed.items).toHaveLength(count);
});

Then('every item has a link without a trailing slash and a date', async ({ ui }) => {
  for (const item of ui.feed.items) {
    expect(item.link).toMatch(/[^/]$/);
    expect(Number.isNaN(Date.parse(item.pubDate))).toBe(false);
  }
});

Then('the items are, in order:', async ({ ui }, table) => {
  expect(ui.feed.items.map((i) => i.title)).toEqual(table.raw().map((r) => r[0]));
});

Then('the item {string} is described as {string}', async ({ ui }, title, text) => {
  expect(ui.feed.items.find((i) => i.title === title)?.description).toBe(text);
});

Then('the item {string} is described by the start of its body, at most {int} characters', async ({ ui }, title, max) => {
  const desc = ui.feed.items.find((i) => i.title === title)?.description ?? '';
  expect(desc).toMatch(/^Body of article \d\./);
  expect(desc).not.toContain('<');
  expect([...desc].length).toBeLessThanOrEqual(max + 1);
});

// Site map locations, parsed in the browser like the feeds.
When('I read the site map {string}', async ({ ui, request, baseURL }, path) => {
  const res = await request.get(new URL(path, baseURL).href);
  expect(res.status()).toBe(200);
  const xml = await res.text();
  ui.sitemap = await ui.page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) return { error: doc.querySelector('parsererror').textContent };
    return { root: doc.documentElement.localName, locs: [...doc.getElementsByTagName('loc')].map((l) => l.textContent.trim()) };
  }, xml);
  expect(ui.sitemap.error).toBeUndefined();
  expect(ui.sitemap.root).toBe('urlset');
});

Then('it lists:', async ({ ui }, table) => {
  for (const [loc] of table.raw()) expect(ui.sitemap.locs).toContain(loc);
});

Then('it does not list:', async ({ ui }, table) => {
  for (const [loc] of table.raw()) expect(ui.sitemap.locs).not.toContain(loc);
});

Then('no address in it ends with a slash, except the home page', async ({ ui }) => {
  const home = ui.sitemap.locs.find((l) => new URL(l).pathname === '/');
  expect(home).toBeDefined();
  expect(ui.sitemap.locs.filter((l) => l !== home && l.endsWith('/'))).toEqual([]);
});

Then('every address in it is listed once', async ({ ui }) => {
  expect(new Set(ui.sitemap.locs).size).toBe(ui.sitemap.locs.length);
});
