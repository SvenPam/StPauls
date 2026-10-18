import { expect } from '@playwright/test';
import { Then } from './fixtures.js';

const byAlt = (alt) => `img[alt=${JSON.stringify(alt)}]`;
// The image in the page body with this alt text.
const image = (ui, alt) => ui.page.locator(`main ${byAlt(alt)}`);

Then('the {string} image is a responsive picture at widths {string}', async ({ ui }, alt, widths) => {
  const picture = ui.page.locator('main picture').filter({ has: ui.page.locator(byAlt(alt)) });
  await expect(picture).toHaveCount(1);
  const srcset = await picture.locator('source[type="image/webp"]').getAttribute('srcset');
  expect(srcset.split(',').map((s) => s.trim().split(' ').pop())).toEqual(widths.split(',').map((w) => `${w.trim()}w`));
});

Then('the {string} image is {int} by {int}', async ({ ui }, alt, width, height) => {
  await expect(image(ui, alt)).toHaveAttribute('width', String(width));
  await expect(image(ui, alt)).toHaveAttribute('height', String(height));
});

Then('the {string} image comes from {string} and loads lazily', async ({ ui }, alt, src) => {
  await expect(image(ui, alt)).toHaveAttribute('src', src);
  await expect(image(ui, alt)).toHaveAttribute('loading', 'lazy');
});
