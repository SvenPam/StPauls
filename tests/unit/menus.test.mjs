import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menuItems, footerGroups, pagesByType } from '../../config/menus.js';

const type = (t, title, weight) => ({ data: { section: `page/${t}`, title, weight } });
const page = (t, name, data) => ({ url: data.url ? `${data.url}/` : `/page/${t}/${name}/`, data: { section: `page/${t}`, ...data } });

const collections = {
  pageTypes: [type('groups', 'Groups', 60), type('about', 'About', 40), type('services', 'Services', 50), type('forms', 'Forms', 100)],
  pages: [
    page('about', 'privacy-policy', { title: 'Privacy Policy', header: true, footer: true, weight: 3 }),
    page('about', 'about-us', { title: 'About Us', header: true, weight: 1 }),
    page('about', 'contact-us', { title: 'Contact Us', url: '/contact', header: true, footer: true, weight: 2 }),
    page('services', 'regular-church-services', { title: 'Regular Church Services', header: true, footer: true, weight: 1 }),
    page('services', 'easter-services-2026', { title: 'Easter Services 2026', header: true, footer: true, weight: 1 }),
    page('groups', 'church-groups', { title: 'Church Groups', header: true, footer: true }),
    page('forms', 'hidden', { title: 'Hidden' }),
    page('extra', 'stray', { title: 'Stray', header: true, footer: true }),
  ],
};

test('fixed items, then page types in weight order', () => {
  assert.deepEqual(menuItems(collections).map((i) => i.name), ['Home', 'Blog', 'Calendar', 'About', 'Services', 'Groups']);
});

test('a type with one menu page is a plain link named after the type', () => {
  assert.deepEqual(menuItems(collections).find((i) => i.name === 'Groups'), { name: 'Groups', url: '/page/groups/church-groups' });
});

test('a type with several menu pages is a dropdown in weight order, without a url', () => {
  const about = menuItems(collections).find((i) => i.name === 'About');
  assert.equal(about.url, undefined);
  assert.deepEqual(about.children, [
    { name: 'About Us', url: '/page/about/about-us' },
    { name: 'Contact Us', url: '/contact' },
    { name: 'Privacy Policy', url: '/page/about/privacy-policy' },
  ]);
});

test('equal weights sort by title', () => {
  const services = menuItems(collections).find((i) => i.name === 'Services');
  assert.deepEqual(services.children.map((c) => c.name), ['Easter Services 2026', 'Regular Church Services']);
});

test('a type with no menu pages is skipped, and a page without a type is left out', () => {
  const names = JSON.stringify(menuItems(collections));
  assert.doesNotMatch(names, /Forms|Stray/);
});

test('a page with no weight sorts as 100', () => {
  const c = { pageTypes: [type('links', 'Links', 80)], pages: [page('links', 'b', { title: 'B', header: true, weight: 50 }), page('links', 'a', { title: 'A', header: true })] };
  assert.deepEqual(menuItems(c).at(-1).children.map((x) => x.name), ['B', 'A']);
});

test('footer: Links first with the about pages, then each type with footer pages', () => {
  const groups = footerGroups(collections);
  assert.deepEqual(groups.map((g) => g.title), ['Links', 'Services', 'Groups']);
  assert.deepEqual(groups[0].links.map((l) => l.url), ['/blog', '/calendar', '/notices', '/sitemap', '/contact', '/page/about/privacy-policy']);
});

test('pagesByType lists every page of every type, menu flags ignored', () => {
  const groups = pagesByType(collections);
  assert.deepEqual(groups.map((g) => g.title), ['About', 'Services', 'Groups', 'Forms']);
  assert.deepEqual(groups.at(-1).pages, [{ name: 'Hidden', url: '/page/forms/hidden' }]);
});
