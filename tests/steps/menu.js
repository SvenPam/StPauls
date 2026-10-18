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
