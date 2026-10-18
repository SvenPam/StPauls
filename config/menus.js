// Header and footer menus built from the pages. Page types (page/{type}/_index.md) give the label and order,
// pages opt in with `header` and `footer`. The shapes are those the old menus.yaml had.
import { href } from './filters.js';

const FIXED_ITEMS = [
  { name: 'Home', url: '/' },
  { name: 'Blog', url: '/blog' },
  { name: 'Calendar', url: '/calendar' },
];

const FIXED_LINKS = [
  { name: 'Church Blog', url: '/blog' },
  { name: 'Church Calendar', url: '/calendar' },
  { name: 'Church Notices', url: '/notices' },
  { name: 'Site Map', url: '/sitemap' },
];

// The folder after page/ in the computed section.
const typeOf = (item) => String(item.data.section ?? '').split('/')[1];

// Weight (default 100), then title, so equal weights keep a stable order.
const byWeight = (a, b) =>
  (a.data.weight ?? 100) - (b.data.weight ?? 100) || String(a.data.title ?? '').localeCompare(String(b.data.title ?? ''));

const link = (item) => ({ name: item.data.title, url: href(item.url) });

// Page types in order, each with its pages that pass `keep`. A page in a folder with no _index.md is left out.
function typesWith(collections, keep = () => true) {
  const pages = [...(collections.pages ?? [])].filter(keep).sort(byWeight);
  return [...(collections.pageTypes ?? [])].sort(byWeight).map((t) => ({
    type: typeOf(t),
    title: t.data.title,
    pages: pages.filter((p) => typeOf(p) === typeOf(t)),
  }));
}

const flagged = (collections, flag) => typesWith(collections, (p) => p.data[flag] === true);

// Every page type with every page in it, menu flags ignored. The /sitemap page lists these.
export function pagesByType(collections) {
  return typesWith(collections).map((t) => ({ title: t.title, pages: t.pages.map(link) }));
}

export function menuItems(collections) {
  const types = flagged(collections, 'header')
    .filter((t) => t.pages.length)
    .map((t) => (t.pages.length === 1 ? { name: t.title, url: href(t.pages[0].url) } : { name: t.title, children: t.pages.map(link) }));
  return [...FIXED_ITEMS, ...types];
}

export function footerGroups(collections) {
  const types = flagged(collections, 'footer');
  const about = types.find((t) => t.type === 'about');
  return [
    { title: 'Links', links: [...FIXED_LINKS, ...(about?.pages ?? []).map(link)] },
    ...types.filter((t) => t !== about && t.pages.length).map((t) => ({ title: t.title, links: t.pages.map(link) })),
  ];
}

export default function (eleventyConfig) {
  eleventyConfig.addFilter('menuItems', menuItems);
  eleventyConfig.addFilter('footerGroups', footerGroups);
  eleventyConfig.addFilter('pagesByType', pagesByType);
}
