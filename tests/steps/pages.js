import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { CLOCK_NOW, CLOCK_SITE, EMPTY_SITE, Given, KEYED_SITE, Then, When } from './fixtures.js';

const REPO = resolve('..');

const main = (ui) => ui.page.locator('main');
const visible = (locator) => locator.filter({ visible: true });

Given('scripts are off', async ({ ui, browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: ui.page.viewportSize() });
  ui.page = await context.newPage();
});

Given('a phone screen', async ({ ui }) => {
  await ui.page.setViewportSize({ width: 390, height: 844 });
});

Given('it is {string}', async ({ ui }, when) => {
  await ui.page.clock.setFixedTime(new Date(when));
});

When('I open {string}', async ({ ui, baseURL }, path) => {
  await ui.page.goto(new URL(path, baseURL).href);
});

When('I open {string} on the empty site', async ({ ui }, path) => {
  await ui.page.goto(EMPTY_SITE + path);
});

When('I open {string} on the site with a contact key', async ({ ui }, path) => {
  await ui.page.goto(KEYED_SITE + path);
});

Then('the page heading is {string}', async ({ ui }, text) => {
  await expect(ui.page.locator('h1')).toHaveText(text);
});

Then('I see {string}', async ({ ui }, text) => {
  await expect(visible(main(ui).getByText(text)).first()).toBeVisible();
});

Then('I do not see {string}', async ({ ui }, text) => {
  await expect(visible(main(ui).getByText(text))).toHaveCount(0);
});

Then('the cards are, in order:', async ({ ui }, table) => {
  const titles = visible(main(ui).locator('.card')).locator('.card__title');
  await expect(titles).toHaveText(table.raw().map((r) => r[0]));
});

Then('the {string} link goes to {string}', async ({ ui }, name, href) => {
  await expect(main(ui).getByRole('link', { name, exact: true }).first()).toHaveAttribute('href', href);
});

Then('the {string} card shows {string}', async ({ ui }, title, text) => {
  const card = main(ui).locator('.card').filter({ has: ui.page.getByRole('link', { name: title, exact: true }) });
  await expect(card).toContainText(text);
});

Then('the {string} card has no topic', async ({ ui }, title) => {
  const card = main(ui).locator('.card').filter({ has: ui.page.getByRole('link', { name: title, exact: true }) });
  await expect(card.locator('.topic')).toHaveCount(0);
});

Then('the page has no topic link', async ({ ui }) => {
  await expect(main(ui).locator('.topic')).toHaveCount(0);
});

Then('the summary {string} is the lead', async ({ ui }, text) => {
  await expect(main(ui).locator('.lead')).toHaveText(text);
});

Then('there is no lead', async ({ ui }) => {
  await expect(main(ui).locator('.lead')).toHaveCount(0);
});

Then('the body shows {string} as text, not code', async ({ ui }, text) => {
  await expect(main(ui).locator('.prose').getByText(text, { exact: true })).toBeVisible();
  await expect(main(ui).locator('.prose pre, .prose code')).toHaveCount(0);
});

Then('the body has a heading {string}', async ({ ui }, text) => {
  await expect(main(ui).locator('.prose').getByRole('heading', { name: text, exact: true })).toBeVisible();
});

Then('the body has a table with the header cells {string}', async ({ ui }, cells) => {
  await expect(main(ui).locator('.prose table th')).toHaveText(cells.split(',').map((c) => c.trim()));
});

Then('the body shows {string} as text, not a numbered list', async ({ ui }, text) => {
  await expect(main(ui).locator('.prose').getByText(text, { exact: true })).toBeVisible();
  await expect(main(ui).locator('.prose ol')).toHaveCount(0);
});

Then('the body has a list item {string}', async ({ ui }, text) => {
  await expect(main(ui).locator('.prose li', { hasText: text })).toBeVisible();
});

Then('the image is a responsive picture described as {string}', async ({ ui }, alt) => {
  const img = main(ui).locator('article picture img').first();
  await expect(img).toHaveAttribute('alt', alt);
  await expect(main(ui).locator('article picture source[type="image/webp"]').first()).toHaveCount(1);
});

Then('the aside {string} list is, in order:', async ({ ui }, heading, table) => {
  const items = ui.page.locator('aside h2', { hasText: heading }).locator('xpath=following-sibling::ul[1]/li');
  await expect(items).toHaveText(table.raw().map((r) => r[0]));
});

Then('the aside {string} link goes to {string}', async ({ ui }, name, href) => {
  await expect(ui.page.locator('aside').getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
});

Then('{string} says {string}', async ({ request, baseURL }, path, text) => {
  const res = await request.get(new URL(path, baseURL).href);
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain(text);
});

Then('{string} exists', async ({ request, baseURL }, path) => {
  expect((await request.get(new URL(path, baseURL).href)).status()).toBe(200);
});

Then('{string} does not exist', async ({ request, baseURL }, path) => {
  expect((await request.get(new URL(path, baseURL).href)).status()).toBe(404);
});

Then('the canonical address is {string}', async ({ ui }, href) => {
  await expect(ui.page.locator('link[rel=canonical]')).toHaveAttribute('href', href);
});

Then('no link in the page ends with a slash', async ({ ui }) => {
  const hrefs = await ui.page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h !== '/' && h.endsWith('/') && !h.startsWith('/#'))).toEqual([]);
});

Then('the page does not scroll sideways', async ({ ui }) => {
  const [scroll, client] = await ui.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(client);
});

// Structural files only: the page types are the maintainer's and hidden from Pages CMS.
Then('the real page types are, in order:', async ({}, table) => {
  for (const [type, title, weight] of table.raw()) {
    const text = readFileSync(join(REPO, 'site/content/page', type, '_index.md'), 'utf8');
    const data = parse(/^---\n([\s\S]*?)\n---/.exec(text)[1]);
    expect({ type, title: data.title, weight: data.weight }).toEqual({ type, title, weight: Number(weight) });
  }
});

Then('the hero shows {string} and {string}', async ({ ui }, title, lead) => {
  await expect(ui.page.locator('.hero h1')).toHaveText(title);
  await expect(ui.page.locator('.hero')).toContainText(lead);
});

Then('the hero image loads straight away', async ({ ui }) => {
  const img = ui.page.locator('.hero img');
  await expect(img).toHaveCount(1);
  await expect(img).not.toHaveAttribute('loading');
});

// The page starts with these notices, in this order.
Then('the home notices are, in order:', async ({ ui }, table) => {
  const want = table.raw().map((r) => r[0]);
  const got = await main(ui).locator('.home-notice h3').allTextContents();
  expect(got.slice(0, want.length).map((t) => t.trim())).toEqual(want);
});

Then('the home notices are exactly:', async ({ ui }, table) => {
  const got = await main(ui).locator('.home-notice h3').allTextContents();
  expect(got.map((t) => t.trim())).toEqual(table.raw().map((r) => r[0]));
});

Then('the {string} card image is {int} by {int}', async ({ ui }, title, width, height) => {
  const card = main(ui).locator('.card').filter({ has: ui.page.getByRole('link', { name: title, exact: true }) });
  const img = card.locator('img');
  await expect(img).toHaveAttribute('width', String(width));
  await expect(img).toHaveAttribute('height', String(height));
});

Then('every image on the page has an alt attribute', async ({ ui }) => {
  const missing = await ui.page.locator('img:not([alt])').evaluateAll((imgs) => imgs.map((i) => i.outerHTML));
  expect(missing).toEqual([]);
});

Then('there are no cards', async ({ ui }) => {
  await expect(main(ui).locator('.card')).toHaveCount(0);
});

Then('the page has the site header and footer', async ({ ui }) => {
  await expect(ui.page.locator('header.site-header')).toHaveCount(1);
  await expect(ui.page.locator('footer.site-footer')).toHaveCount(1);
});

// The clock site is built at CLOCK_NOW; the browser starts at the same time so site.js agrees with the build.
When('I open {string} on the clock site', async ({ ui }, path) => {
  await ui.page.clock.setFixedTime(new Date(CLOCK_NOW));
  await ui.page.goto(CLOCK_SITE + path);
});

When('I open {string} on the clock site at {string}', async ({ ui }, path, when) => {
  await ui.page.clock.setFixedTime(new Date(when));
  await ui.page.goto(CLOCK_SITE + path);
});

// The event page's Start and End blocks, as their visible text.
const when = (ui, label) => main(ui).locator('.event-when div').filter({ has: ui.page.locator('dt', { hasText: label }) }).locator('dd');

Then('the event starts {string}', async ({ ui }, text) => {
  await expect(when(ui, 'Start')).toHaveText(text);
});

Then('the event ends {string}', async ({ ui }, text) => {
  await expect(when(ui, 'End')).toHaveText(text);
});

Then('the event has no end', async ({ ui }) => {
  await expect(when(ui, 'End')).toHaveCount(0);
});

Then('the {string} card has no status', async ({ ui }, title) => {
  const card = main(ui).locator('.card').filter({ has: ui.page.getByRole('link', { name: title, exact: true }) });
  await expect(card.locator('.status')).toHaveText('');
});

Then('the page title is {string}', async ({ ui }, title) => {
  await expect(ui.page).toHaveTitle(title);
});

// Visible lines of the home Upcoming Events column: month heading, day, title, label.
Then('the home events are:', async ({ ui }, table) => {
  const rows = await main(ui).locator('.home-events li:visible').evaluateAll((lis) =>
    lis.map((li) => [
      li.closest('.home-events__month').querySelector('h3').textContent.trim(),
      li.querySelector('strong').textContent.trim(),
      li.querySelector('a').textContent.trim(),
      li.querySelector('.status').textContent.trim(),
    ]));
  expect(rows).toEqual(table.raw().map((r) => r.map((c) => c.trim())));
});

Then('the home notices do not include {string}', async ({ ui }, title) => {
  const got = await main(ui).locator('.home-notice h3').allTextContents();
  expect(got.map((t) => t.trim())).not.toContain(title);
});

Then('the home event {string} is labelled {string}', async ({ ui }, title, label) => {
  const li = main(ui).locator('.home-events li').filter({ has: ui.page.getByRole('link', { name: title, exact: true }) });
  await expect(li.locator('.status')).toHaveText(label);
});

Then('the home event months shown are {string}', async ({ ui }, list) => {
  const got = await main(ui).locator('.home-events__month:visible h3').allTextContents();
  expect(got.map((t) => t.trim())).toEqual(list.split(',').map((m) => m.trim()));
});

Given('a wide screen', async ({ ui }) => {
  await ui.page.setViewportSize({ width: 1440, height: 900 });
});

Then('the hero fills the width of the window', async ({ ui }) => {
  const box = await ui.page.locator('.hero').boundingBox();
  expect(box.x).toBe(0);
  expect(box.width).toBe(ui.page.viewportSize().width);
});

Then('the hero starts where the header ends', async ({ ui }) => {
  const header = await ui.page.locator('.site-header').boundingBox();
  const hero = await ui.page.locator('.hero').boundingBox();
  expect(Math.round(hero.y)).toBe(Math.round(header.y + header.height));
});

Then('the hero image offers a 1024 pixel copy', async ({ ui }) => {
  await expect(ui.page.locator('.hero source[type="image/webp"]')).toHaveAttribute('srcset', /\s1024w/);
});

Then('the page heading is inside the page column', async ({ ui }) => {
  await expect(ui.page.locator('.site-main .container h1')).toHaveCount(1);
});

const cardOf = (ui, title) => main(ui).locator('.card').filter({ has: ui.page.getByRole('link', { name: title, exact: true }) });

Then('the {string} card picture comes from {string}', async ({ ui }, title, prefix) => {
  await expect(cardOf(ui, title).locator('img')).toHaveAttribute('src', new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});

Then('the {string} card picture is decorative', async ({ ui }, title) => {
  await expect(cardOf(ui, title).locator('img')).toHaveAttribute('alt', '');
});

Then('the {string} card has a {string} link named {string}', async ({ ui }, title, text, name) => {
  const link = cardOf(ui, title).getByRole('link', { name, exact: true });
  expect(await link.evaluate((a) => [...a.childNodes].filter((n) => !n.classList?.contains('visually-hidden')).map((n) => n.textContent).join('').trim())).toBe(text);
});
