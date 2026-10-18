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

Then('every link that opens a new tab has {string}', async ({ ui }, rel) => {
  const links = await ui.page.locator('a[target="_blank"]').evaluateAll((as) => as.map((a) => [a.outerHTML, a.relList.value]));
  expect(links.length).toBeGreaterThan(0);
  for (const [html, rels] of links) expect(rels.split(' ').filter((r) => r === rel), html).toEqual([rel]);
});

const size = async (request, url) => (await (await request.get(url)).body()).length;

Then('the page, its stylesheet, script and hero image add up to under {int} bytes', async ({ ui, request }, max) => {
  const page = ui.page;
  const hero = await page.locator('.hero img').evaluate((img) => img.currentSrc || img.src);
  const urls = [
    page.url(),
    await page.locator('link[rel="stylesheet"]').evaluate((l) => l.href),
    await page.locator('script[src]').evaluate((s) => s.src),
    hero,
  ];
  let total = 0;
  for (const url of urls) total += await size(request, url);
  expect(total).toBeLessThan(max);
});

Then('the only script is our own', async ({ ui }) => {
  const srcs = await ui.page.locator('script').evaluateAll((ss) => ss.map((s) => s.getAttribute('src')));
  expect(srcs).toHaveLength(1);
  expect(srcs[0]).toMatch(/^\/js\/site\.[0-9a-f]{10}\.js$/);
});

// A missing upload is a plain <img> with no size by design (spec 06), so it is skipped.
Then('every local image has a width and height', async ({ ui, request }) => {
  const imgs = await ui.page.locator('img').evaluateAll((is) => is.map((i) => ({
    html: i.outerHTML, src: i.getAttribute('src') ?? '', width: i.getAttribute('width'), height: i.getAttribute('height'),
  })));
  for (const img of imgs) {
    const local = img.src.startsWith('/images/')
      || (img.src.startsWith('/uploads/') && (await request.get(new URL(img.src, ui.page.url()).href)).ok());
    if (!local) continue;
    expect(img.width, img.html).toBeTruthy();
    expect(img.height, img.html).toBeTruthy();
  }
});

Then('at most one image loads straight away', async ({ ui }) => {
  expect(await ui.page.locator('img:not([loading="lazy"])').count()).toBeLessThanOrEqual(1);
});

Then('every font comes from {string}', async ({ ui, request }, prefix) => {
  const href = await ui.page.locator('link[rel="stylesheet"]').evaluate((l) => l.href);
  const css = await (await request.get(href)).text();
  const faces = css.match(/@font-face\s*{[^}]*}/g) ?? [];
  expect(faces.length).toBeGreaterThan(0);
  for (const face of faces)
    for (const [, url] of face.matchAll(/url\(\s*['"]?([^'")]+)/g)) expect(url.startsWith(prefix), url).toBe(true);
});

Then('the site has set no cookies and stored nothing', async ({ ui }) => {
  expect(await ui.page.context().cookies()).toEqual([]);
  expect(await ui.page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});
