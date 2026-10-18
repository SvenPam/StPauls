import { expect } from '@playwright/test';
import { EMPTY_SITE, Given, Then, When } from './fixtures.js';

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

Then('{string} exists', async ({ request, baseURL }, path) => {
  expect((await request.get(new URL(path, baseURL).href)).status()).toBe(200);
});

Then('{string} does not exist', async ({ request, baseURL }, path) => {
  expect((await request.get(new URL(path, baseURL).href)).status()).toBe(404);
});

Then('no link in the page ends with a slash', async ({ ui }) => {
  const hrefs = await ui.page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h !== '/' && h.endsWith('/') && !h.startsWith('/#'))).toEqual([]);
});

Then('the page does not scroll sideways', async ({ ui }) => {
  const [scroll, client] = await ui.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(client);
});
