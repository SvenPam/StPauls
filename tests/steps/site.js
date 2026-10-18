import { expect } from '@playwright/test';
import { Then } from './fixtures.js';

// The legacy footer named the maintainer and carried trackers. None of that may come back.
const BANNED = ['stephen pammenter', 'ste-pam.com', 'linkedin.com', 'licdn.com', 'ua-68397826',
  'google-analytics.com', 'googletagmanager.com', 'disqus'];

Then('none of these pages mention the maintainer or a tracker:', async ({ request, baseURL }, table) => {
  for (const [path] of table.raw()) {
    const html = (await (await request.get(new URL(path, baseURL).href)).text()).toLowerCase();
    expect(BANNED.filter((b) => html.includes(b)), path).toEqual([]);
  }
});

Then('the stylesheet is under {int} bytes and carries an integrity hash', async ({ ui, request }, max) => {
  const link = ui.page.locator('link[rel="stylesheet"]');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute('integrity', /^sha256-/);
  const body = await (await request.get(new URL(await link.getAttribute('href'), ui.page.url()).href)).body();
  expect(body.length).toBeLessThan(max);
});

Then('the script is under {int} bytes, deferred and carries an integrity hash', async ({ ui, request }, max) => {
  const script = ui.page.locator('script[src]');
  await expect(script).toHaveCount(1);
  await expect(script).toHaveAttribute('integrity', /^sha256-/);
  await expect(script).toHaveAttribute('defer', '');
  const body = await (await request.get(new URL(await script.getAttribute('src'), ui.page.url()).href)).body();
  expect(body.length).toBeLessThan(max);
});

Then('the page has no inline script, style or event handler', async ({ ui }) => {
  expect(await ui.page.locator('script:not([src]), style, [style]').count()).toBe(0);
  const handlers = await ui.page.evaluate(() => [...document.querySelectorAll('*')]
    .flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith('on')));
  expect(handlers).toEqual([]);
});
