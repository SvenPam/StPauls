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

Then('the page embeds {string} titled {string}', async ({ ui }, src, title) => {
  const frame = ui.page.locator('main .embed iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', src);
  await expect(frame).toHaveAttribute('title', title);
  await expect(frame).toHaveAttribute('loading', 'lazy');
  await expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
});

Then('the embed is {int} by {int}', async ({ ui }, width, height) => {
  const box = await ui.page.locator('main .embed').boundingBox();
  expect(Math.abs(box.width / box.height - width / height) / (width / height)).toBeLessThan(0.01);
});

Then('the page has no embed', async ({ ui }) => {
  await expect(ui.page.locator('main h1')).toHaveCount(1);
  await expect(ui.page.locator('main iframe, main .embed')).toHaveCount(0);
});

// Centred: the image's middle is within 2px of the middle of the paragraph that holds it.
const offCentre = (ui, alt) => image(ui, alt).evaluate((img) => {
  const box = img.getBoundingClientRect();
  const p = img.closest('p').getBoundingClientRect();
  return Math.abs(box.left + box.width / 2 - (p.left + p.width / 2));
});

Then('the {string} image is centred', async ({ ui }, alt) => {
  expect(await offCentre(ui, alt)).toBeLessThanOrEqual(2);
});

Then('the {string} image is not centred', async ({ ui }, alt) => {
  expect(await offCentre(ui, alt)).toBeGreaterThan(20);
});
