import { expect } from '@playwright/test';
import { Then, When } from './fixtures.js';

const toggle = (ui) => ui.page.locator('.menu-toggle');
const nav = (ui) => ui.page.locator('#site-nav');
const group = (ui, name) => ui.page.locator('details.site-nav__group', { has: ui.page.locator('summary', { hasText: name }) });

When('I press the menu button', async ({ ui }) => {
  await toggle(ui).click();
});

When('I open the {string} menu', async ({ ui }, name) => {
  await group(ui, name).locator('summary').click();
});

When('I press Escape', async ({ ui }) => {
  await ui.page.keyboard.press('Escape');
});

When('I press Tab', async ({ ui }) => {
  await ui.page.keyboard.press('Tab');
});

When('I click the page heading', async ({ ui }) => {
  await ui.page.locator('h1').click();
});

Then('the main menu is shown', async ({ ui }) => {
  await expect(nav(ui)).toBeVisible();
});

Then('the main menu is hidden', async ({ ui }) => {
  await expect(nav(ui)).toBeHidden();
});

Then('the menu button says the menu is {word}', async ({ ui }, state) => {
  await expect(toggle(ui)).toHaveAttribute('aria-expanded', String(state === 'open'));
});

Then('the {string} menu is {word}', async ({ ui }, name, state) => {
  const details = group(ui, name);
  if (state === 'open') await expect(details).toHaveAttribute('open', '');
  else await expect(details).not.toHaveAttribute('open', '');
});

Then('the {string} menu shows {string}', async ({ ui }, name, link) => {
  await expect(group(ui, name).getByRole('link', { name: link, exact: true })).toBeVisible();
});

Then('focus is on the {string} menu', async ({ ui }, name) => {
  await expect(group(ui, name).locator('summary')).toBeFocused();
});

Then('focus is on the {string} link', async ({ ui }, name) => {
  await expect(ui.page.getByRole('link', { name, exact: true })).toBeFocused();
});

Then('the menu button is at least {int} by {int} pixels', async ({ ui }, w, h) => {
  const box = await toggle(ui).boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(w);
  expect(box.height).toBeGreaterThanOrEqual(h);
});

const column = (table) => table.raw().map((r) => r[0]);
const footerGroup = (ui, title) => ui.page.locator('.footer-groups .footer-group')
  .filter({ has: ui.page.locator('.footer-group__title').getByText(title, { exact: true }) }).first();

Then('the main menu items are, in order:', async ({ ui }, table) => {
  await expect(nav(ui).locator('.site-nav__list > li > details > summary, .site-nav__list > li > a')).toHaveText(column(table));
});

Then('the {string} link goes to {string} in the menu', async ({ ui }, name, href) => {
  await expect(nav(ui).getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
});

Then('the {string} menu lists, in order:', async ({ ui }, name, table) => {
  await expect(group(ui, name).locator('a')).toHaveText(column(table));
});

Then('the footer groups are, in order:', async ({ ui }, table) => {
  await expect(ui.page.locator('.footer-groups .footer-group__title')).toHaveText(column(table));
});

Then('the {string} footer group links to, in order:', async ({ ui }, title, table) => {
  const hrefs = await footerGroup(ui, title).locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(column(table));
});

Then('the {string} menu has a divider between {string} and {string}', async ({ ui }, name, before, after) => {
  const items = await ui.page.locator('.site-nav__group', { has: ui.page.locator('summary', { hasText: name }) }).locator('li')
    .evaluateAll((lis) => lis.map((li) => (li.getAttribute('role') === 'separator' ? '|' : li.textContent.trim())));
  const i = items.indexOf(before);
  expect(items.slice(i, i + 3)).toEqual([before, '|', after]);
});

const topItem = (ui, name) => ui.page.locator('.site-nav__list > li').filter({ has: ui.page.locator(':scope > a, :scope > details > summary', { hasText: new RegExp(`^${name}$`) }) })
  .locator(':scope > a, :scope > details > summary');

Then('the {string} menu item is highlighted', async ({ ui }, name) => {
  await expect(topItem(ui, name)).toHaveClass(/\bis-current\b/);
});

Then('the {string} menu item is not highlighted', async ({ ui }, name) => {
  await expect(topItem(ui, name)).not.toHaveClass(/\bis-current\b/);
});
