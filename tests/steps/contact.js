import { expect } from '@playwright/test';
import { Then, When } from './fixtures.js';

const footer = (ui) => ui.page.locator('footer.site-footer');

Then('the footer shows {string}', async ({ ui }, text) => {
  await expect(footer(ui).getByText(text)).toBeVisible();
});

Then('the footer {string} link goes to {string}', async ({ ui }, name, href) => {
  await expect(footer(ui).getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
});

const form = (ui) => ui.page.locator('form.contact-form');

Then('there is no contact form', async ({ ui }) => {
  await expect(ui.page.locator('form')).toHaveCount(0);
});

Then('the contact form posts to {string}', async ({ ui }, action) => {
  await expect(form(ui)).toHaveAttribute('action', action);
  await expect(form(ui)).toHaveAttribute('method', /^post$/i);
});

Then('the form sends {string} as {string}', async ({ ui }, name, value) => {
  await expect(form(ui).locator(`[name="${name}"]`)).toHaveValue(value);
});

Then('the {string} field is required', async ({ ui }, label) => {
  await expect(form(ui).getByLabel(label, { exact: true })).toHaveAttribute('required', '');
});

Then('the {string} field is optional', async ({ ui }, label) => {
  const field = form(ui).getByLabel(label, { exact: true });
  await expect(field).toBeVisible();
  await expect(field).not.toHaveAttribute('required');
});

Then('the enquiry types are, in order:', async ({ ui }, table) => {
  await expect(form(ui).getByLabel('Enquiry type', { exact: true }).locator('option')).toHaveText(table.raw().map((r) => r[0]));
});

Then('the spam trap is hidden and cannot be reached with Tab', async ({ ui }) => {
  const trap = form(ui).locator('[name="botcheck"]');
  await expect(trap).toBeHidden();
  await expect(trap).toHaveAttribute('tabindex', '-1');
  await expect(trap).toHaveAttribute('aria-hidden', 'true');
  await form(ui).getByLabel('Name', { exact: true }).focus();
  const controls = await form(ui).locator('input:not([type=hidden]), select, textarea, button, a').count();
  for (let i = 0; i < controls + 1; i++) {
    expect(await trap.evaluate((el) => el === document.activeElement)).toBe(false);
    await ui.page.keyboard.press('Tab');
  }
});

When('I choose {string} as the enquiry type', async ({ ui }, type) => {
  await form(ui).getByLabel('Enquiry type', { exact: true }).selectOption(type);
});

Then('the {string} field takes at most {int} characters', async ({ ui }, label, max) => {
  await expect(form(ui).getByLabel(label, { exact: true })).toHaveAttribute('maxlength', String(max));
});

// Each text appears in the page after the one before it.
Then('the contact page reads, in order: {string}, {string}, {string}, {string}', async ({ ui }, a, b, c, d) => {
  const texts = [a, b, c, d];
  const text = await ui.page.locator('main').innerText();
  const at = texts.map((t) => text.indexOf(t));
  expect(at.every((i) => i >= 0), texts.join(' / ')).toBe(true);
  expect([...at].sort((a, b) => a - b)).toEqual(at);
});
