import { expect } from '@playwright/test';
import { Then } from './fixtures.js';

const footer = (ui) => ui.page.locator('footer.site-footer');

Then('the footer shows {string}', async ({ ui }, text) => {
  await expect(footer(ui).getByText(text)).toBeVisible();
});

Then('the footer {string} link goes to {string}', async ({ ui }, name, href) => {
  await expect(footer(ui).getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
});
