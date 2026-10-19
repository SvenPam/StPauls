import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import * as m from '../../scripts/migrate.mjs';

const snap = (name) => readFileSync(`tests/fixtures/live/${name}`, 'utf8');

test('classify', () => {
  assert.deepEqual(m.classify('/calendar/event/16/mu-advent-carol-service'), ['event', { id: 16, slug: 'mu-advent-carol-service' }]);
  assert.deepEqual(m.classify('/page/about/church-diary'), ['page', { type: 'about', slug: 'church-diary' }]);
  assert.equal(m.classify('/blog/topic/website'), null);
});

test('the blog index gives dates and topics', () => {
  assert.deepEqual(m.parseBlogIndex(snap('blog-index.html'))['st-pauls-churchyard-in-bloom'], { date: '2022-03-02', topic: 'Website' });
});

test('event fields, without the author', () => {
  const e = m.parseEvent(snap('event.html'));
  assert.equal(e.title, 'MU Advent Carol Service');
  assert.equal(e.topicLabel, 'Other Events');
  assert.deepEqual(e.start, [19, 30, 12, 1]);
  assert.deepEqual(e.end, [21, 0, 12, 1]);
  assert.deepEqual(e.textYears, [2015]);
  assert.doesNotMatch(e.body, /Paul Barfoot/);
});

test('notice fields', () => {
  const n = m.parseNotice(snap('notice.html'));
  assert.equal(n.title, 'News / Pew Sheets');
  assert.equal(n.topicLabel, 'Church Services');
});

test('menus', () => {
  const menus = m.parseMenus(snap('home.html'));
  assert.equal(menus['/page/groups/church-groups'].header, true);
  assert.equal(menus['/page/about/privacy-policy'].footer, true);
  assert.ok(menus['/page/about/about-us'].weight < menus['/page/about/privacy-policy'].weight);
});

test('home', () => {
  const h = m.parseHome(snap('home.html'));
  assert.equal(h.lead, 'Serving Christ - Serving the Community');
  assert.deepEqual(h.noticeOrder.slice(0, 3), [46, 44, 43]);
  assert.ok('church-roof-completed' in h.cards);
});

test('a multi-day event reads its day, short month and time', () => {
  const col = (label, day, month, time) =>
    `<div class="col-md-3"><h1><small>${label}</small><br />${day}</h1><p>${month}</p><span class="glyphicon glyphicon-time"></span> ${time}</div>`;
  const e = m.parseEvent(`<main><div class="jumbotron"><h2>Christmas Services</h2><p class="text-muted">Church Services</p>
    ${col('Start', 22, 'Oct', '11:00 AM')}${col('End', 26, 'Dec', '1:00 AM')}</div>
    <div class="bg-default"><div class="col-xs-12"><h4 class="lead">s</h4><p>b</p></div></div></main>`);
  assert.deepEqual(e.start, [11, 0, 10, 22]);
  assert.deepEqual(e.end, [1, 0, 12, 26]);
});

test('legacy links are rewritten and each file is downloaded once', () => {
  const { html, downloads } = m.rewriteBody(
    '<p><a href="http://www.stpaulswarton.co.uk/Areas/st_pauls/Uploads/Gallery\\EasterPoster.jpg">x</a>' +
    ' <a href="/Areas/St_Pauls/Uploads/baptism-form.pdf">form</a> <a href="/areas/st_pauls/uploads/gallery/EasterPoster.jpg">again</a>' +
    ' <a href="http://stpaulswarton.co.uk/Calendar">c</a></p>');
  assert.match(html, /href="\/uploads\/legacy\/Gallery\/EasterPoster\.jpg">x/);
  assert.match(html, /href="\/uploads\/legacy\/baptism-form\.pdf"/);
  assert.match(html, /href="\/uploads\/legacy\/Gallery\/EasterPoster\.jpg">again/);
  assert.match(html, /href="\/calendar"/);
  assert.deepEqual(downloads.map((d) => d.dest).sort(), ['uploads/legacy/Gallery/EasterPoster.jpg', 'uploads/legacy/baptism-form.pdf']);
  assert.ok(downloads.find((d) => d.dest.endsWith('EasterPoster.jpg')).legacyPaths.includes('/areas/st_pauls/uploads/gallery/EasterPoster.jpg'));
});

test('ACNY images are localised without their query string', () => {
  const { html, downloads } = m.rewriteBody('<img src="https://media.acny.uk/media/thumbs/e0/60/e0602c.jpg?h=300&w=350&mode=crop" width="1024">');
  assert.match(html, /src="\/uploads\/acny\/e0602c\.jpg"/);
  assert.equal(downloads[0].url, 'https://media.acny.uk/media/thumbs/e0/60/e0602c.jpg');
});

test('an ACNY name clash gets distinct names', () => {
  const { downloads } = m.rewriteBody('<img src="https://media.acny.uk/a/IMG_1.jpg"><img src="https://media.acny.uk/b/IMG_1.jpg">');
  assert.equal(new Set(downloads.map((d) => d.dest)).size, 2);
});

test('a calendar iframe becomes an embed', () => {
  const { html, embed } = m.rewriteBody(m.parsePage(snap('page-diary.html')).body);
  assert.doesNotMatch(html, /<iframe/);
  assert.equal(embed.embed, 'google-calendar');
  assert.match(embed.embed_src, /^https:\/\/calendar\.google\.com\//);
});

test('a protocol-relative gallery iframe becomes an https embed', () => {
  const { html, embed } = m.rewriteBody(m.parsePage(snap('page-gallery.html')).body);
  assert.doesNotMatch(html, /<iframe/);
  assert.equal(embed.embed, 'facebook-album');
  assert.match(embed.embed_src, /^https:\/\/embedsocial\.com\//);
});

test('scripts and handlers are removed and noted', () => {
  const { html, notes } = m.rewriteBody('<p onclick="x()">a</p><script>alert(1)</script>');
  assert.equal(html, '<p>a</p>');
  assert.ok(notes.length);
});

test('no indentation and no blank lines', () => {
  const { html } = m.rewriteBody('<div>\n    <p>a</p>\n\n    <p>b</p>\n</div><br /><br />');
  assert.doesNotMatch(html, /^\s+\S/m);
  assert.doesNotMatch(html, /\n\n/);
});

test('bare text in a notice body becomes a paragraph', () => {
  const { html } = m.rewriteBody(m.parseNotice(snap('notice.html')).body);
  assert.match(html, /^<p>Weekly news sheets[^<]*<\/p>$/);
});

test('an event year is inferred from its neighbours', () => {
  const events = [
    { id: 10, start: [19, 0, 11, 1], end: [20, 0, 11, 1], textYears: [2018] },
    { id: 11, start: [19, 0, 2, 3], end: [20, 0, 2, 3], textYears: [] },
    { id: 12, start: [19, 0, 6, 1], end: [20, 0, 6, 1], textYears: [2019] },
  ];
  const got = m.inferEventDates(events, new Map());
  assert.equal(got.get(11).start, '2019-02-03T19:00:00');
  assert.match(got.get(11).reason, /inferred/);
});

test('the SQL export gives dates and locations, NULL as empty', () => {
  const known = m.loadExport('tests/fixtures/sql');
  assert.deepEqual(known.get('event:16'), { start: '2015-12-01T19:30:00', end: '2015-12-01T21:00:00', location: 'St Michael’s, Kirkham' });
  assert.deepEqual(known.get('event:17'), { start: '2015-12-02T10:00:00', end: null, location: '' });
  assert.deepEqual(known.get('notice:46'), { start: '2023-11-29T09:15:00', end: null, location: '' });
});

test('a missing export folder gives no dates', () => {
  assert.equal(m.loadExport('tests/fixtures/no-such-folder').size, 0);
  assert.equal(m.loadExport(undefined).size, 0);
});

test('export dates win', () => {
  const got = m.inferEventDates([{ id: 16, start: [19, 30, 12, 1], end: [21, 0, 12, 1], textYears: [] }], m.loadExport('tests/fixtures/sql'));
  assert.equal(got.get(16).start, '2015-12-01T19:30:00');
  assert.equal(got.get(16).end, '2015-12-01T21:00:00');
  assert.equal(got.get(16).reason, '');
});

test('notice dates count back one day per id step, export first', () => {
  const got = m.inferNoticeDates([46, 44, 43], m.loadExport('tests/fixtures/sql'));
  assert.deepEqual(got.get(46), { date: '2023-11-29', reason: '' });
  assert.equal(got.get(44).date, '2026-09-29');
  assert.match(got.get(44).reason, /inferred/);
});

test('every written topic is a site topic', () => {
  const topics = parse(readFileSync('site/data/topics.yaml', 'utf8'));
  assert.equal(m.topicSlug('Other Events', topics), 'other-events');
  assert.equal(m.topicSlug('Harvest', topics), '');
});

test('front matter survives awkward values and keeps dates as Pages CMS writes them', () => {
  const fm = m.frontMatter({ title: 'A: "quoted" # not a comment', date: '2015-12-01T19:30:00', header: true, weight: 3 });
  assert.match(fm, /^---\n[\s\S]*\n---\n$/);
  assert.match(fm, /^date: 2015-12-01T19:30:00$/m);
  assert.deepEqual(parse(fm.slice(4, -4)), { title: 'A: "quoted" # not a comment', date: '2015-12-01T19:30:00', header: true, weight: 3 });
});
