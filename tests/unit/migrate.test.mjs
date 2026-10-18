import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
