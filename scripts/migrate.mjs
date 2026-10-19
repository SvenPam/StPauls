// Content migration from the live site (spec 07). Hand-run, never in CI.
// Pure functions parse saved live HTML into plain objects; main() fetches, rewrites and writes.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { load } from 'cheerio';
import { Document, Scalar, parse as parseYaml, parseDocument } from 'yaml';
import { embedFor } from '../config/embeds.js';
import { excerpt, plainText } from '../config/filters.js';
import { markdown as renderer } from '../config/markdown.js';

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

// CSV rows as arrays of cells. Quoted cells may hold commas, newlines and doubled quotes.
function csvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows.filter((r) => r.some((c) => c.trim()));
}

const SQL = (v) => (v == null || v.trim() === 'NULL' ? '' : v.trim());

// Dates and locations from the maintainer's SQL export of the live database (spec 07a): events.csv and notices.csv
// in `dir`, with a header row and NULL for empty. Map of 'event:16' to { start, end, location }. A missing folder
// or file gives nothing, and the dates are inferred as before.
export function loadExport(dir) {
  const known = new Map();
  if (!dir) return known;
  for (const [kind, file, idCol] of [['event', 'events.csv', 'EventID'], ['notice', 'notices.csv', 'NoticeID']]) {
    const f = path.join(dir, file);
    if (!existsSync(f)) continue;
    const [head = [], ...rows] = csvRows(readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
    const at = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
    for (const r of rows) {
      const id = Number(SQL(r[at[idCol]]));
      const start = wallClock(SQL(r[at.StartDate]));
      if (!id || !start) continue;
      known.set(`${kind}:${id}`, { start, end: kind === 'event' ? wallClock(SQL(r[at.EndDate])) : null, location: SQL(r[at.Location]) });
    }
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

// --- Markdown ---

// Inline tags kept as their contents only: underline, superscripts, spans and font tags have no Markdown form.
const UNWRAP = new Set(['span', 'font', 'u', 'sup', 'sub', 'small', 'big', 'center', 'abbr']);
const HEADINGS = /^h([1-6])$/;
// Read again inside a paragraph, these would start a heading, quote, list, rule or fence.
const LINE_START = /^(#|>|[-+=~]|\d+[.)])/;

const spaced = (s) => s.replace(/[\s ]+/g, ' ');
const escapeText = (s) => s.replace(/[\\`*_[\]<]/g, '\\$&');
const linkUrl = (url) => (/[\s()<>]/.test(url) ? `<${url.replace(/</g, '%3C').replace(/>/g, '%3E')}>` : url);

// Emphasis markers must touch the words, so surrounding spaces move outside them.
function wrap(mark, inner) {
  const [, lead, body, trail] = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return body ? `${lead}${mark}${body}${mark}${trail}` : inner;
}

// Converts a body that rewriteBody cleaned into Markdown with no HTML in it. `left` collects the tags that have
// no Markdown form here; when it is not empty the caller keeps the HTML.
export function toMarkdown(html) {
  const $ = load(html ?? '', null, false);
  const left = new Set();

  // Inline content as one line of Markdown. A <br> becomes `breakAs`.
  const inline = (nodes, breakAs = ' ') => nodes.map((n) => {
    if (n.type === 'text') return escapeText(spaced(n.data));
    if (n.type !== 'tag') return '';
    const tag = n.tagName;
    const inner = () => inline(n.children, breakAs);
    if (tag === 'br') return breakAs;
    // Each line separately, so a <br> inside bold text does not split the markers across paragraphs.
    if (tag === 'strong' || tag === 'b') return inner().split('\n').map((l) => wrap('**', l)).join('\n');
    if (tag === 'em' || tag === 'i') return inner().split('\n').map((l) => wrap('*', l)).join('\n');
    if (tag === 'img') {
      const src = $(n).attr('src') ?? '';
      return src ? `![${escapeText(spaced($(n).attr('alt') ?? '').trim())}](${linkUrl(src)})` : '';
    }
    if (tag === 'a') {
      const href = ($(n).attr('href') ?? '').trim();
      // Jump menu links lose their link, and so do links with no text.
      const text = inline(n.children);
      if (!href || href.startsWith('#') || !text.trim()) return text;
      const [, lead, body, trail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
      return `${lead}[${body}](${linkUrl(href)})${trail}`;
    }
    if (UNWRAP.has(tag)) return inner();
    left.add(tag);
    return '';
  }).join('');

  // One block: tidy spaces and escape what would change its meaning at the start of a line.
  const block = (s) => {
    const line = spaced(s).trim();
    return line.replace(LINE_START, (m) => (/^\d/.test(m) ? `${m.slice(0, -1)}\\${m.slice(-1)}` : `\\${m}`));
  };
  const paragraphs = (nodes) => inline(nodes, '\n').split('\n').map(block).filter(Boolean);

  const cellText = (td) => block(inline($(td).contents().toArray())).replace(/\|/g, '\\|');
  const isTextCell = (td) => !$(td).find('img, ul, ol, table, br').length && $(td).find('p').length <= 1;

  function table(el) {
    const rows = $(el).find('tr').toArray().filter((tr) => $(tr).closest('table')[0] === el);
    const cells = rows.map((tr) => $(tr).children('th, td').toArray());
    const filled = cells.filter((r) => r.some((td) => $(td).text().replace(/[\s ]/g, '') || $(td).find('img').length));
    if (!filled.length) return [];
    if (!filled.flat().every(isTextCell)) return filled.flat().flatMap((td) => blocks($(td).contents().toArray()));
    const width = Math.max(...filled.map((r) => r.length));
    const line = (r) => `| ${Array.from({ length: width }, (_, i) => (r[i] ? cellText(r[i]) : '')).join(' | ')} |`;
    return [[line(filled[0]), `|${' --- |'.repeat(width)}`, ...filled.slice(1).map(line)].join('\n')];
  }

  function blocks(nodes) {
    const out = [];
    let run = [];
    const flush = () => {
      out.push(...paragraphs(run));
      run = [];
    };
    for (const n of nodes) {
      if (n.type !== 'tag' || !['p', 'div', 'figure', 'figcaption', 'section', 'address', 'ul', 'ol', 'table', 'hr', 'blockquote', 'pre', 'iframe', 'dl'].includes(n.tagName) && !HEADINGS.test(n.tagName)) {
        run.push(n);
        continue;
      }
      flush();
      const tag = n.tagName;
      const kids = n.children ?? [];
      const heading = tag.match(HEADINGS);
      if (heading) {
        // A closing # would be read as part of the heading markup.
        const text = block(inline(kids)).replace(/#$/, '\\#');
        if (text) out.push(`${'#'.repeat(Number(heading[1]))} ${text}`);
      } else if (tag === 'p' || tag === 'figcaption') out.push(...paragraphs(kids));
      else if (['div', 'figure', 'section', 'address'].includes(tag)) out.push(...blocks(kids));
      else if (tag === 'ul' || tag === 'ol') {
        const items = $(n).children('li').toArray();
        if ($(n).children().toArray().some((c) => c.tagName !== 'li') || items.some((li) => $(li).find('ul, ol, table, p, div').length)) left.add(tag);
        else out.push(items.map((li, i) => `${tag === 'ol' ? `${i + 1}.` : '-'} ${block(inline(li.children))}`).join('\n'));
      } else if (tag === 'table') out.push(...table(n));
      else if (tag === 'hr') out.push('---');
      else left.add(tag);
    }
    flush();
    return out;
  }

  const markdown = blocks($.root()[0].children).join('\n\n');
  return { markdown: markdown ? `${markdown}\n` : '', left: [...left].sort() };
}

// The body file text in Markdown, or the HTML and the reason when a tag has no Markdown form here or the rendered
// text would differ from the original's. Content is never corrected, so the conversion may not change a word.
export function bodyMarkdown(html) {
  const asHtml = (problem) => ({ body: html ? `${html}\n` : '', problem });
  const { markdown, left } = toMarkdown(html);
  if (left.length) return asHtml(left.map((t) => `<${t}>`).join(' '));
  const words = (h) => plainText(h).replace(/\s+/g, '');
  if (words(renderer.render(markdown)) !== words(html)) return asHtml('text would change');
  return { body: markdown, problem: '' };
}

// --- Writing ---

// Writes each file whose text differs (or, with check, only lists it). Returns the changed paths relative to site.
export async function writeSite(files, site, { check = false } = {}) {
  const changed = [];
  for (const [rel, text] of [...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    const file = path.join(site, rel);
    const now = existsSync(file) ? await readFile(file, 'utf8') : null;
    if (now === text) continue;
    changed.push(rel);
    if (!check) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, text);
    }
  }
  return changed;
}

const UPLOADS_MARK = 'uploads (spec 07)';

// Redirects for live spellings of legacy uploads that spec 05's prefix routes do not cover, kept sorted under one
// comment at the end of `redirects`. Returns true when the file changes (or would, with check).
export async function updateLegacy(file, downloads, { check = false } = {}) {
  const before = await readFile(file, 'utf8');
  const doc = parseDocument(before);
  const prefixes = (doc.toJS().upload_prefixes ?? []).map((p) => p.replace(/\/+$/, ''));
  const wanted = new Map();
  for (const d of downloads) {
    if (!d.dest.startsWith('uploads/legacy/')) continue;
    const tail = d.dest.slice('uploads/legacy/'.length);
    const covered = new Set(prefixes.map((p) => `${p}/${tail}`));
    const to = `/uploads/legacy/${tail.split('/').map(encodeURIComponent).join('/')}`;
    for (const from of d.legacyPaths) if (!covered.has(from)) wanted.set(from, to);
  }
  let redirects = doc.get('redirects');
  if (!redirects) {
    doc.set('redirects', doc.createNode([]));
    redirects = doc.get('redirects');
  }
  redirects.items = redirects.items.filter((item) => !String(item.get?.('to') ?? '').startsWith('/uploads/legacy/'));
  const entries = [...wanted].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  entries.forEach(([from, to], i) => {
    const node = doc.createNode({ from, to });
    node.flow = true;
    if (i === 0) node.commentBefore = ` ${UPLOADS_MARK}`;
    redirects.items.push(node);
  });
  const after = doc.toString({ lineWidth: 0 });
  if (after === before) return false;
  if (!check) await writeFile(file, after);
  return true;
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

function table(head, rows) {
  if (!rows.length) return '_None._\n';
  return [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n') + '\n';
}

export async function writeReport(file, r) {
  const text = `---
date: ${r.date}
tags: [report, stpauls, migration]
status: draft
---

# Migration report

_Written by \`scripts/migrate.mjs\` from ${r.live}, with dates and locations from the SQL export. Run again on cutover day. See [spec 07](page-cms-spec-07-content-migration.md) and [spec 07a](page-cms-spec-07a-content-match.md)._

## Counts

${table(['Type', 'Items'], Object.entries(r.counts))}
## Inferred dates

${table(['Item', 'Date', 'Why'], r.inferred)}
## Unknown topics

${table(['Item', 'Live topic'], r.unknownTopics)}
## Failed downloads

${table(['File', 'From', 'Error'], r.failed)}
## Iframes kept

${table(['Item', 'Address'], r.iframes)}
## Removed scripts

${table(['Item', 'What'], r.removed)}
## Files the script did not write

${table(['File'], r.unwritten.map((f) => [f]))}
## Policy text that no longer applies

${table(['Page', 'Sentence'], r.policy)}
## Bodies left as HTML

${table(['Item', 'Why'], r.leftHtml ?? [])}`;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text);
}

// --- Running ---

const POLICY = /google analytics|disqus|register|log in|login|account|subscribe/i;
const UA = 'stpauls-migrate/1.0 (scripts/migrate.mjs)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(fetch, url, as = 'text') {
  let last;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt) await sleep(2000 * attempt);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return as === 'bytes' ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (err) {
      last = err;
      if (/HTTP 4\d\d/.test(err.message)) break;
    }
  }
  throw last;
}

// Content files under the item folders that this run did not write.
function unwrittenFiles(site, written) {
  const out = [];
  const content = path.join(site, 'content');
  const dirs = ['blog', 'calendar', 'notices'];
  if (existsSync(path.join(content, 'page'))) {
    for (const d of readdirSync(path.join(content, 'page'), { withFileTypes: true })) if (d.isDirectory()) dirs.push(`page/${d.name}`);
  }
  for (const dir of dirs) {
    if (!existsSync(path.join(content, dir))) continue;
    for (const f of readdirSync(path.join(content, dir)).sort()) {
      const rel = `content/${dir}/${f}`;
      if (f.endsWith('.md') && f !== '_index.md' && rel !== 'content/page/about/contact-us.md' && !written.has(rel)) out.push(rel);
    }
  }
  return out;
}

const sentences = (html) => plainText(html).split(/(?<=[.!?])\s+/);

export async function main(argv = process.argv.slice(2), { fetch = globalThis.fetch, log = console.log } = {}) {
  const { values: opts } = parseArgs({
    args: argv,
    options: {
      live: { type: 'string', default: LIVE },
      db: { type: 'string', default: 'docs/features/migration/data' },
      site: { type: 'string', default: 'site' },
      report: { type: 'string', default: 'docs/features/page-cms/page-cms-migration-report.md' },
      check: { type: 'boolean', default: false },
    },
  });
  const live = opts.live.replace(/\/+$/, '');
  const site = opts.site;
  const topicsFile = [path.join(site, 'data/topics.yaml'), `${ROOT}site/data/topics.yaml`].find(existsSync);
  const topics = parseYaml(readFileSync(topicsFile, 'utf8'));
  const known = loadExport(opts.db);

  const sitemap = await get(fetch, `${live}/sitemap.xml`);
  const paths = [...new Set([...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname))];
  const homeHtml = await get(fetch, `${live}/`);
  const home = parseHome(homeHtml);
  const menus = parseMenus(homeHtml);
  const blog = parseBlogIndex(await get(fetch, `${live}/blog`));

  const ctx = newContext(live);
  const report = { date: new Date().toISOString().slice(0, 10), live, counts: { Articles: 0, Events: 0, Notices: 0, Pages: 0 }, inferred: [], unknownTopics: [], failed: [], iframes: [], removed: [], unwritten: [], policy: [], leftHtml: [] };
  const files = new Map();
  const events = [];
  const notices = [];

  const topicOf = (where, label) => {
    const slug = topicSlug(label, topics);
    if (!slug && label) report.unknownTopics.push([where, label]);
    return slug || undefined;
  };
  const md = (where, html) => {
    const { body, problem } = bodyMarkdown(html);
    if (problem) report.leftHtml.push([where, problem]);
    return body;
  };
  const rewrite = (where, html) => {
    const r = rewriteBody(html, ctx);
    for (const n of r.notes) {
      if (n.startsWith('iframe kept: ')) report.iframes.push([where, n.slice(13)]);
      else report.removed.push([where, n.replace(/^removed: /, '')]);
    }
    return r;
  };
  const cardImage = (slug) => {
    const card = home.cards[slug];
    if (!card) return {};
    const r = rewriteBody(`<img src="${card.image.replace(/"/g, '&quot;')}">`, ctx);
    return { image: load(r.html)('img').attr('src'), image_alt: card.alt };
  };

  for (const p of paths) {
    const c = classify(p);
    if (!c) continue;
    const [kind, info] = c;
    let html;
    try {
      html = await get(fetch, `${live}${p}`);
    } catch (err) {
      report.failed.push([p, `${live}${p}`, err.message]);
      continue;
    }
    if (kind === 'article') {
      const a = parseArticle(html);
      const listed = blog[info.slug];
      const date = listed?.date ?? a.date;
      if (!listed?.date) report.inferred.push([p, date ?? '', 'not on the /blog list, date from the article page']);
      const body = rewrite(p, a.body);
      files.set(`content/blog/${info.slug}.md`, frontMatter({
        title: a.title, date, summary: a.summary, blogtopics: topicOf(p, listed?.topic), ...cardImage(info.slug),
      }) + md(p, body.html));
      report.counts.Articles += 1;
    } else if (kind === 'event') {
      const e = parseEvent(html);
      events.push({ ...e, ...info, path: p, rewritten: rewrite(p, e.body) });
    } else if (kind === 'notice') {
      const n = parseNotice(html);
      notices.push({ ...n, ...info, path: p, rewritten: rewrite(p, n.body) });
    } else if (kind === 'page') {
      if (`${info.type}/${info.slug}` === 'about/contact-us') continue;
      const pg = parsePage(html);
      const body = rewrite(p, pg.body);
      const menu = menus[p] ?? { header: false, footer: false };
      for (const s of sentences(body.html)) if (POLICY.test(s)) report.policy.push([p, s]);
      files.set(`content/page/${info.type}/${info.slug}.md`, frontMatter({
        title: pg.title, header: menu.header, footer: menu.footer, weight: menu.weight, ...(body.embed ?? {}),
      }) + md(p, body.html));
      report.counts.Pages += 1;
    }
  }

  const eventDates = inferEventDates(events, known);
  for (const e of events) {
    const d = eventDates.get(e.id) ?? {};
    if (d.reason) report.inferred.push([e.path, d.start, d.reason]);
    files.set(`content/calendar/${e.id}-${e.slug}.md`, frontMatter({
      title: e.title, date: d.start, end: d.end ?? undefined, summary: e.summary || undefined, location: known.get(`event:${e.id}`)?.location || e.location || undefined,
      eventtopics: topicOf(e.path, e.topicLabel), url: `/calendar/event/${e.id}/${e.slug}`,
    }) + md(e.path, e.rewritten.html));
    report.counts.Events += 1;
  }
  const order = [...new Set([...home.noticeOrder, ...notices.map((n) => n.id).sort((a, b) => b - a)])];
  const noticeDates = notices.length ? inferNoticeDates(order, known) : new Map();
  for (const n of notices) {
    const d = noticeDates.get(n.id);
    if (d.reason) report.inferred.push([n.path, d.date, d.reason]);
    files.set(`content/notices/${n.id}-${n.slug}.md`, frontMatter({
      title: n.title, date: d.date, summary: excerpt(n.rewritten.html), location: known.get(`notice:${n.id}`)?.location || undefined, noticetopics: topicOf(n.path, n.topicLabel), url: `/notices/notice/${n.id}/${n.slug}`,
    }) + md(n.path, n.rewritten.html));
    report.counts.Notices += 1;
  }

  // The home page lead, the only key the script owns in the root _index.md.
  const indexFile = path.join(site, 'content/_index.md');
  if (home.lead && existsSync(indexFile)) {
    const text = readFileSync(indexFile, 'utf8');
    const match = text.match(/^---\n([\s\S]*?\n)?---\n([\s\S]*)$/);
    if (match) {
      const doc = parseDocument(match[1] ?? '');
      if (doc.get('lead') !== home.lead) {
        doc.set('lead', home.lead);
        files.set('content/_index.md', `---\n${doc.toString({ lineWidth: 0 })}---\n${match[2]}`);
      }
    }
  }

  const changed = await writeSite(files, site, { check: opts.check });

  const downloads = [...ctx.legacy.values(), ...ctx.content.values(), ...ctx.acny.values()];
  for (const d of downloads) {
    const dest = path.join(site, 'static', d.dest);
    if (existsSync(dest)) continue;
    // Check mode fetches too, so a file gone from the source (already broken on live) is not a change.
    try {
      const bytes = await get(fetch, d.url, 'bytes');
      changed.push(`static/${d.dest}`);
      if (opts.check) continue;
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, bytes);
    } catch (err) {
      report.failed.push([d.dest, d.url, err.message]);
    }
  }
  const legacyFile = path.join(site, 'data/legacy.yaml');
  if (existsSync(legacyFile) && (await updateLegacy(legacyFile, downloads, { check: opts.check }))) changed.push('data/legacy.yaml');

  if (opts.check) {
    for (const f of changed) log(`would change: ${f}`);
    log(`${changed.length} file(s) would change`);
    return changed.length ? 1 : 0;
  }
  report.unwritten = unwrittenFiles(site, new Set(files.keys()));
  await writeReport(opts.report, report);
  log(`${Object.entries(report.counts).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(', ')}; ${changed.length} file(s) changed; ${report.failed.length} failed; report ${opts.report}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
