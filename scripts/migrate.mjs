// Content migration from the live site (spec 07). Hand-run, never in CI.
// Pure functions parse saved live HTML into plain objects; main() fetches, rewrites and writes.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { Document, Scalar, parse as parseYaml } from 'yaml';
import { embedFor } from '../config/embeds.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EMBEDS = parseYaml(readFileSync(`${ROOT}site/data/embeds.yaml`, 'utf8'));
export const LIVE = 'http://stpaulswarton.co.uk';

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

// --- Dates ---

const pad = (n) => String(n).padStart(2, '0');
const stamp = (y, [hour, minute, month, day]) => `${y}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

// "2015-12-01T19:30" or "2015-12-01" to "2015-12-01T19:30:00".
function wallClock(s) {
  const match = String(s ?? '').trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  return match ? `${match[1]}T${match[2] ?? '00'}:${match[3] ?? '00'}:${match[4] ?? '00'}` : null;
}

// Map of 'event:16' to { start, end } from the maintainer's export. A missing file gives an empty map.
export function loadDates(file) {
  const known = new Map();
  if (!file) return known;
  const lines = readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines.slice(1)) {
    const [kind, id, start, end] = line.split(',').map((c) => c.trim());
    const s = wallClock(start);
    if (kind && id && s) known.set(`${kind}:${Number(id)}`, { start: s, end: wallClock(end) });
  }
  return known;
}

// The end in the start's year, or the next year when it would come before the start.
function endAfter(start, end) {
  if (!end) return null;
  const y = Number(start.slice(0, 4));
  const same = stamp(y, end);
  return same >= start ? same : stamp(y + 1, end);
}

// Start and end for each event: CSV, else a single year in its text, else the year that keeps starts
// non-decreasing by id from the event before it (or, before the first anchor, not after the event after it).
export function inferEventDates(events, known) {
  const sorted = [...events].sort((a, b) => a.id - b.id);
  const out = new Map();
  const fixed = (e) => {
    const k = known.get(`event:${e.id}`);
    if (k) return { start: k.start, end: k.end ?? (e.end ? endAfter(k.start, e.end) : null), reason: '' };
    if (e.textYears?.length === 1 && e.start) {
      const start = stamp(e.textYears[0], e.start);
      return { start, end: endAfter(start, e.end), reason: `inferred: year ${e.textYears[0]} from its text` };
    }
    return null;
  };
  for (const e of sorted) {
    const f = fixed(e);
    if (f) out.set(e.id, f);
  }
  let prev = null;
  sorted.forEach((e, i) => {
    if (out.has(e.id)) {
      prev = out.get(e.id).start;
      return;
    }
    if (!e.start) return;
    let year;
    if (prev) {
      year = Number(prev.slice(0, 4));
      if (stamp(year, e.start) < prev) year += 1;
    } else {
      const next = sorted.slice(i + 1).map((n) => out.get(n.id)).find(Boolean);
      year = next ? Number(next.start.slice(0, 4)) : 2026;
      if (next && stamp(year, e.start) > next.start) year -= 1;
    }
    const start = stamp(year, e.start);
    out.set(e.id, { start, end: endAfter(start, e.end), reason: 'inferred: year from the events around it' });
    prev = start;
  });
  return out;
}

// Notice dates: CSV, else one day back from 2026-10-01 per id below the newest, so live's order holds.
export function inferNoticeDates(order, known) {
  const newest = Math.max(...order);
  const out = new Map();
  for (const id of order) {
    const k = known.get(`notice:${id}`);
    if (k) {
      out.set(id, { date: k.start.slice(0, 10), reason: '' });
      continue;
    }
    const d = new Date(Date.UTC(2026, 9, 1 - (newest - id)));
    out.set(id, { date: d.toISOString().slice(0, 10), reason: 'inferred: counted back from 2026-10-01 by id' });
  }
  return out;
}

// --- Topics and front matter ---

export function topicSlug(label, topics) {
  const want = String(label ?? '').trim().toLowerCase();
  const hit = Object.entries(topics ?? {}).find(([, v]) => String(v).trim().toLowerCase() === want);
  return want && hit ? hit[0] : '';
}

// The front matter block, keys in the given order. null and undefined values are left out.
export function frontMatter(fields) {
  const kept = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null));
  const doc = new Document(kept);
  // Dates stay plain so Eleventy reads a Date and Pages CMS shows the value in its date field.
  for (const pair of doc.contents.items) {
    if (pair.value instanceof Scalar && typeof pair.value.value === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(pair.value.value)) {
      pair.value.type = Scalar.PLAIN;
    }
  }
  return `---\n${doc.toString({ lineWidth: 0 })}---\n`;
}

// --- Body rewriting ---

const OWN = /^https?:\/\/(www\.)?stpaulswarton\.co\.uk(?=\/|$|\?|#)/i;
const UPLOADS = /^\/areas\/st_pauls\/uploads\//i;
const CONTENT_IMAGES = /^\/areas\/st_pauls\/content\/image\//i;
const ACNY = /^(https?:)?\/\/([a-z0-9-]+\.)*(acny\.uk|achurchnearyou\.com)\//i;
const SECTION_LINKS = ['calendar', 'notices', 'contact', 'blog'];
const BLOCKS = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'blockquote', 'hr', 'pre', 'figure', 'section', 'address', 'iframe', 'dl']);

// Shared across every body in a run, so a file is downloaded once and names stay distinct.
export function newContext(live = LIVE) {
  return { live, legacy: new Map(), acny: new Map(), acnyNames: new Set(), content: new Map() };
}

const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');

function rewriteUrl(raw, ctx, used, isImg) {
  let url = String(raw).trim();
  if (!url) return raw;
  if (isImg && ACNY.test(url)) {
    const clean = new URL(url.replace(/^\/\//, 'https://'));
    clean.search = '';
    clean.hash = '';
    const key = clean.href;
    let d = ctx.acny.get(key);
    if (!d) {
      const name = decodeURIComponent(clean.pathname.split('/').pop());
      const local = ctx.acnyNames.has(name) ? `${createHash('sha256').update(key).digest('hex').slice(0, 8)}-${name}` : name;
      ctx.acnyNames.add(local);
      d = { url: key, dest: `uploads/acny/${local}`, legacyPaths: [] };
      ctx.acny.set(key, d);
    }
    used.add(d);
    return `/${encodePath(d.dest)}`;
  }
  url = url.replace(OWN, '') || (OWN.test(raw.trim()) ? '/' : url);
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  const cut = url.search(/[?#]/);
  let path = cut < 0 ? url : url.slice(0, cut);
  const rest = cut < 0 ? '' : url.slice(cut);
  path = path.replace(/\\/g, '/');
  let decoded;
  try { decoded = decodeURIComponent(path); } catch { decoded = path; }
  if (UPLOADS.test(decoded)) {
    const tail = decoded.replace(UPLOADS, '');
    const key = tail.toLowerCase();
    let d = ctx.legacy.get(key);
    if (!d) {
      d = { url: `${ctx.live}/Areas/st_pauls/Uploads/${encodePath(tail)}`, dest: `uploads/legacy/${tail}`, legacyPaths: [] };
      ctx.legacy.set(key, d);
    }
    if (!d.legacyPaths.includes(decoded)) d.legacyPaths.push(decoded);
    used.add(d);
    return `/${encodePath(d.dest)}`;
  }
  if (CONTENT_IMAGES.test(decoded)) {
    const tail = decoded.replace(CONTENT_IMAGES, '');
    const key = tail.toLowerCase();
    let d = ctx.content.get(key);
    if (!d) {
      d = { url: `${ctx.live}/Areas/st_pauls/Content/Image/${encodePath(tail)}`, dest: `uploads/content/${tail.replace(/\//g, '-')}`, legacyPaths: [] };
      ctx.content.set(key, d);
    }
    used.add(d);
    return `/${encodePath(d.dest)}`;
  }
  const [, first, after = ''] = path.match(/^\/([^/]*)(.*)$/);
  if (SECTION_LINKS.includes(first.toLowerCase())) path = `/${first.toLowerCase()}${after}`;
  return path + rest;
}

const isEmptyText = (s) => !s.replace(/[\s ]/g, '');

export function rewriteBody(html, ctx = newContext()) {
  const $ = load(html ?? '', null, false);
  const notes = [];
  const used = new Set();
  let embed = null;

  $('#disqus_thread, ul.social').each((_, el) => {
    notes.push(`removed: ${el.attribs.id === 'disqus_thread' ? 'Disqus block' : 'share links'}`);
    $(el).remove();
  });
  $('script, noscript').each((_, el) => {
    notes.push(`removed: <${el.tagName}> ${$(el).html().replace(/\s+/g, ' ').trim().slice(0, 80)}`.trim());
    $(el).remove();
  });
  $('*').each((_, el) => {
    for (const name of Object.keys(el.attribs ?? {})) {
      if (/^on/i.test(name)) {
        notes.push(`removed: ${name} on <${el.tagName}>`);
        $(el).removeAttr(name);
      }
    }
  });
  $('iframe').each((_, el) => {
    const src = ($(el).attr('src') ?? '').trim();
    const https = src.replace(/^\/\//, 'https://').replace(/^http:\/\//, 'https://');
    const key = Object.keys(EMBEDS).find((k) => embedFor({ embed: k, embed_src: https }, EMBEDS));
    if (key && !embed) {
      embed = { embed: key, embed_src: embedFor({ embed: key, embed_src: https }, EMBEDS).src };
      $(el).remove();
    } else {
      notes.push(`iframe kept: ${src}`);
    }
  });
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    if (/^(chrome-extension|moz-extension|file|data):/i.test(src)) {
      notes.push(`removed: image from ${src.split(':')[0]}`);
      $(el).remove();
    } else if (src) $(el).attr('src', rewriteUrl(src, ctx, used, true));
  });
  $('a[href]').each((_, el) => {
    $(el).attr('href', rewriteUrl($(el).attr('href'), ctx, used, false));
  });

  // Empty paragraphs and leftover empty containers, then <br> runs at the end of a block.
  const keepsEmpty = 'img, iframe, video, audio, embed, object, hr, input, table';
  $('p, div, span').toArray().reverse().forEach((el) => {
    const $el = $(el);
    if (!$el.find(keepsEmpty).length && isEmptyText($el.text()) && !$el.find('br').length) $el.remove();
    else if (el.tagName === 'p' && !$el.find(keepsEmpty).length && isEmptyText($el.text())) $el.remove();
  });
  const trimBr = (parent) => {
    const kids = () => (parent.children ?? []).filter((n) => !(n.type === 'text' && isEmptyText(n.data)));
    let last;
    while ((last = kids().at(-1)) && last.type === 'tag' && last.tagName === 'br') $(last).remove();
    let first;
    while ((first = kids()[0]) && first.type === 'tag' && first.tagName === 'br') $(first).remove();
  };
  $('p, div, li, td, blockquote').each((_, el) => trimBr(el));
  const root = $.root()[0];
  trimBr(root);

  // One block per line at the top level: runs of text and inline elements become a paragraph.
  const lines = [];
  let run = [];
  const flush = () => {
    const inner = run.map((n) => $.html(n)).join('').trim();
    if (!isEmptyText($('<p>').html(inner).text()) || /<(img|iframe)/i.test(inner)) lines.push(`<p>${inner}</p>`);
    run = [];
  };
  for (const node of root.children) {
    if (node.type === 'tag' && BLOCKS.has(node.tagName)) {
      flush();
      lines.push($.html(node));
    } else if (node.type === 'tag' && node.tagName === 'br' && run.length) {
      run.push(node);
    } else if (node.type === 'tag' || (node.type === 'text' && !isEmptyText(node.data)) || run.length) {
      run.push(node);
    }
  }
  flush();
  const out = lines.join('\n').replace(/[ \t]*\r?\n\s*/g, '\n').trim();
  return { html: out, downloads: [...used], embed, notes };
}
