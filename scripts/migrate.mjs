// Content migration from the live site (spec 07). Hand-run, never in CI.
// Pure functions parse saved live HTML into plain objects; main() fetches, rewrites and writes.
import { load } from 'cheerio';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

const text = (el) => el.text().replace(/\s+/g, ' ').trim();

// [kind, info] for a live item path, else null.
export function classify(path) {
  const p = String(path).replace(/[?#].*$/, '').replace(/\/+$/, '');
  let match;
  if ((match = p.match(/^\/blog\/article\/([^/]+)$/))) return ['article', { slug: match[1] }];
  if ((match = p.match(/^\/calendar\/event\/(\d+)\/([^/]+)$/))) return ['event', { id: Number(match[1]), slug: match[2] }];
  if ((match = p.match(/^\/notices\/notice\/(\d+)\/([^/]+)$/))) return ['notice', { id: Number(match[1]), slug: match[2] }];
  if ((match = p.match(/^\/page\/([^/]+)\/([^/]+)$/))) return ['page', { type: match[1], slug: match[2] }];
  return null;
}

// "02-Mar-22" to "2022-03-02".
function blogDate(s) {
  const match = s.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
  if (!match) return null;
  const month = SHORT_MONTHS.indexOf(match[2].toLowerCase()) + 1;
  if (!month) return null;
  return `20${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}

export function parseBlogIndex(html) {
  const $ = load(html);
  const out = {};
  $('article').each((_, a) => {
    const head = $(a).find('section.row').first();
    const href = head.find('h2 a').attr('href') ?? '';
    const c = classify(href);
    if (!c || c[0] !== 'article') return;
    const topic = head.find('a[href*="/blog/topic/"]').first();
    out[c[1].slug] = { date: blogDate(head.text()), topic: topic.length ? text(topic) : null };
  });
  return out;
}

// Inner HTML without leading <br> runs and surrounding whitespace.
const inner = ($, el) => ($(el).html() ?? '').replace(/^(\s|<br\s*\/?>)+/i, '').trim();

export function parseArticle(html) {
  const $ = load(html);
  return {
    title: text($('h1[itemprop=headline]')),
    summary: ($('meta[name=description]').first().attr('content') ?? '').trim(),
    body: inner($, $('div[itemprop=articleBody]')),
    date: blogDate(text($('[itemprop=datePublished]'))),
  };
}

const monthNumber = (s) => SHORT_MONTHS.indexOf(s.toLowerCase().slice(0, 3)) + 1;

// [hour, minute, month, day]. One-day events show "7:30 PM" in the h1 and the day in an h3;
// multi-day events show the day in the h1, a short month, and the time after a clock icon.
function eventTime($, col) {
  const h1 = $(col).find('h1').clone();
  h1.find('small').remove();
  const h1Text = text(h1);
  const timeText = /:/.test(h1Text) ? h1Text : text($(col));
  const [, hh, mm, ap] = timeText.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i) ?? [];
  const month = monthNumber(text($(col).find('p').first()));
  const day = Number(/:/.test(h1Text) ? text($(col).find('h3').first()) : h1Text);
  if (!hh || !month || !day) return null;
  const hour = (Number(hh) % 12) + (ap.toUpperCase() === 'PM' ? 12 : 0);
  return [hour, Number(mm), month, day];
}

const years = (s) => [...new Set((s.match(/\b(19[89]\d|20\d\d)\b/g) ?? []).map(Number))].sort();

export function parseEvent(html) {
  const $ = load(html);
  const jumbo = $('main .jumbotron');
  const cols = jumbo.find('h1 small').toArray().map((s) => $(s).closest('div'));
  const timeOf = (label) => {
    const col = cols.find((c) => text(c.find('h1 small')) === label);
    return col ? eventTime($, col) : null;
  };
  const bodyCol = $('main .bg-default > .col-xs-12').first().clone();
  const summary = text(bodyCol.find('h4.lead').first());
  bodyCol.find('h4.lead').first().remove();
  const title = text(jumbo.find('h2').first());
  const body = inner($, bodyCol);
  return {
    title,
    topicLabel: text(jumbo.find('p.text-muted').first()),
    start: timeOf('Start'),
    end: timeOf('End'),
    summary,
    location: '',
    body,
    textYears: years(`${title} ${summary} ${load(body).text()}`),
  };
}

export function parseNotice(html) {
  const $ = load(html);
  const cols = $('main .container > .col-xs-12');
  return {
    title: text($('main h1').first()),
    topicLabel: text(cols.eq(0).find('span').last()),
    body: inner($, cols.eq(1)),
  };
}

export function parsePage(html) {
  const $ = load(html);
  const col = $('main h1.page-header').first().closest('.col-xs-12').clone();
  const title = text(col.find('h1.page-header').first());
  col.find('h1.page-header').first().remove();
  return { title, body: inner($, col) };
}

// Which pages the header and footer list, and their order within their page type. /contact is the about page contact-us.
export function parseMenus(html) {
  const $ = load(html);
  const out = {};
  const counts = {};
  const visit = (where) => (_, a) => {
    let path = ($(a).attr('href') ?? '').trim().replace(/\/+$/, '');
    if (path.toLowerCase() === '/contact') path = '/page/about/contact-us';
    const c = classify(path);
    if (!c || c[0] !== 'page') return;
    if (!out[path]) {
      counts[c[1].type] = (counts[c[1].type] ?? 0) + 1;
      out[path] = { header: false, footer: false, weight: counts[c[1].type] };
    }
    out[path][where] = true;
  };
  $('header nav a').each(visit('header'));
  $('footer nav a').each(visit('footer'));
  return out;
}

export function parseHome(html) {
  const $ = load(html);
  const cards = {};
  $('main .thumbnail').each((_, t) => {
    const c = classify($(t).find('a[href*="/blog/article/"]').attr('href') ?? '');
    const image = $(t).find('img').attr('src');
    if (c && image) cards[c[1].slug] = { image, alt: ($(t).find('img').attr('alt') ?? '').trim() || text($(t).find('h3').first()) };
  });
  const noticeOrder = $('main a.home-page-notice').toArray()
    .map((a) => classify($(a).attr('href') ?? ''))
    .filter((c) => c && c[0] === 'notice')
    .map((c) => c[1].id);
  return { lead: text($('main .home-page-hero p.lead').first()), cards, noticeOrder };
}
