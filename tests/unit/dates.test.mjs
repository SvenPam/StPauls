import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  londonOffset, londonInstant, eventEnd, eventStatus, upcoming,
  date, time, month, day, isoLondon, isoDay, rfc822London,
} from '../../config/dates.js';

test('London is +00:00 in winter and +01:00 in summer', () => {
  assert.equal(londonOffset(new Date('2099-01-15T12:00:00Z')), '+00:00');
  assert.equal(londonOffset(new Date('2099-06-01T12:00:00Z')), '+01:00');
  assert.equal(londonInstant(new Date('2099-06-01T12:00:00Z')).toISOString(), '2099-06-01T11:00:00.000Z');
});

test('the hour after the clocks go back is read as GMT', () => {
  assert.equal(londonInstant(new Date('2026-10-25T01:30:00Z')).toISOString(), '2026-10-25T01:30:00.000Z');
});

test('the hour before the clocks go forward is GMT and the hour after is BST', () => {
  assert.equal(londonInstant(new Date('2026-03-29T00:30:00Z')).toISOString(), '2026-03-29T00:30:00.000Z');
  assert.equal(londonInstant(new Date('2026-03-29T02:30:00Z')).toISOString(), '2026-03-29T01:30:00.000Z');
});

test('eventEnd reads Pages CMS strings and falls back to 24 hours after the start', () => {
  const date = new Date('2026-10-17T18:00:00Z');
  assert.equal(eventEnd({ date, end: '2026-10-17T19:30' }).toISOString(), '2026-10-17T19:30:00.000Z');
  assert.equal(eventEnd({ date, end: '2026-10-17T19:30:15' }).toISOString(), '2026-10-17T19:30:15.000Z');
  const dayLater = '2026-10-18T18:00:00.000Z';
  assert.equal(eventEnd({ date, end: '' }).toISOString(), dayLater);
  assert.equal(eventEnd({ date }).toISOString(), dayLater);
  assert.equal(eventEnd({ date, end: 'soon' }).toISOString(), dayLater);
  assert.equal(eventEnd({ date, end: new Date('2026-10-17T17:00:00Z') }).toISOString(), dayLater);
});

test('eventStatus around a summer event', () => {
  const ev = { date: new Date('2099-06-01T10:00:00Z'), end: new Date('2099-06-01T12:00:00Z') };
  assert.equal(eventStatus(ev, Date.parse('2099-06-01T10:30:00+01:00')), 'Active');
  assert.equal(eventStatus(ev, Date.parse('2099-06-01T12:30:00+01:00')), 'Expired');
  assert.equal(eventStatus(ev, Date.parse('2099-05-30T10:00:00+01:00')), 'Soon');
  assert.equal(eventStatus(ev, Date.parse('2099-05-01T10:00:00+01:00')), 'Future');
});

test('upcoming drops ended events and puts the soonest first', () => {
  const item = (start, end) => ({ data: { date: new Date(start), end: new Date(end) } });
  const later = item('2099-07-01T10:00:00Z', '2099-07-01T11:00:00Z');
  const sooner = item('2099-06-01T10:00:00Z', '2099-06-01T12:00:00Z');
  const past = item('2015-12-01T19:30:00Z', '2015-12-01T21:00:00Z');
  assert.deepEqual(upcoming([later, past, sooner], Date.parse('2026-10-18T12:00:00Z')), [sooner, later]);
  assert.deepEqual(upcoming([later, sooner], Date.parse('2099-06-01T12:30:00+01:00')), [later]);
});

test('formats show the wall time and London offset', () => {
  const summer = new Date('2099-06-01T10:00:00Z');
  assert.equal(date(new Date('2015-08-01T00:00:00Z')), '01-Aug-15');
  assert.equal(time(summer), '10:00');
  assert.equal(time(new Date('2099-06-01T12:00:00Z')), '12:00');
  assert.equal(time(new Date('2015-12-01T19:30:00Z')), '19:30');
  assert.equal(time(new Date('2015-12-01T00:05:00Z')), '00:05');
  assert.equal(month(summer), 'June');
  assert.equal(day(summer), '1');
  assert.equal(isoLondon(new Date('2099-06-01T12:00:00Z')), '2099-06-01T12:00:00+01:00');
  // GMT is written Z.
  assert.equal(isoLondon(new Date('2099-01-15T12:00:00Z')), '2099-01-15T12:00:00Z');
  assert.equal(rfc822London(summer), 'Mon, 01 Jun 2099 10:00:00 +0100');
});

test('a quoted date string is read as a wall time, so the filters do not fail the build', () => {
  assert.equal(date('2099-07-03'), '03-Jul-99');
  assert.equal(time('2099-07-03T14:05'), '14:05');
  assert.equal(time('2099-07-03T14:05:09'), '14:05');
  assert.equal(month('2099-07-03T10:00:00'), 'July');
  assert.equal(day('2099-07-03T10:00:00'), '3');
  assert.equal(isoLondon('2099-07-03T10:00:00'), '2099-07-03T10:00:00+01:00');
  assert.equal(rfc822London('2099-01-03T10:00'), 'Sat, 03 Jan 2099 10:00:00 +0000');
});

test('a Date passes through the filters unchanged', () => {
  assert.equal(date(new Date('2099-07-03T10:00:00Z')), '03-Jul-99');
});

test('eventStatus and upcoming accept quoted date strings', () => {
  const ev = { date: '2099-06-01T10:00', end: '2099-06-01T12:00:00' };
  assert.equal(eventStatus(ev, Date.parse('2099-06-01T10:30:00+01:00')), 'Active');
  assert.equal(eventStatus({ date: '2099-06-01T10:00:00' }, Date.parse('2099-05-01T10:00:00+01:00')), 'Future');
  const items = [{ data: { date: '2099-06-02T10:00' } }, { data: { date: new Date('2099-06-01T10:00:00Z') } }];
  assert.deepEqual(upcoming(items, Date.parse('2099-05-01T00:00:00Z')).map((i) => i.data.date), [items[1].data.date, '2099-06-02T10:00']);
});

test('isoDay is the London wall date, for site map lastmod', () => {
  assert.equal(isoDay(new Date(Date.UTC(2026, 9, 25, 23, 30))), '2026-10-25');
  assert.equal(isoDay('2026-02-01'), '2026-02-01');
  assert.equal(isoDay('2026-10-17T19:30'), '2026-10-17');
});

test('buildNow reads NOW', async () => {
  const { buildNow } = await import('../../config/dates.js');
  const saved = process.env.NOW;
  try {
    process.env.NOW = '2030-06-15T12:00:00+01:00';
    assert.equal(buildNow(), Date.parse('2030-06-15T12:00:00+01:00'));
    delete process.env.NOW;
    assert.ok(Math.abs(buildNow() - Date.now()) < 1000);
    process.env.NOW = 'not a date';
    assert.throws(() => buildNow(), /NOW/);
  } finally {
    if (saved === undefined) delete process.env.NOW; else process.env.NOW = saved;
  }
});

test('a notice ends after its Show until day, UK time', async () => {
  const { noticeEnded } = await import('../../config/dates.js');
  const n = { date: '2030-05-01', until: '2030-06-15' };
  assert.equal(noticeEnded(n, Date.parse('2030-06-15T23:59:00+01:00')), false);
  assert.equal(noticeEnded(n, Date.parse('2030-06-16T00:00:00+01:00')), true);
  for (const until of [undefined, '', 'nonsense']) assert.equal(noticeEnded({ date: '2030-05-01', until }, Date.parse('2099-01-01T00:00:00Z')), false);
  assert.equal(noticeEnded({ until: new Date('2030-06-15T00:00:00Z') }, Date.parse('2030-06-16T00:00:00+01:00')), true);
});

test('a notice starts at the beginning of its Show from day, UK time', async () => {
  const { noticeStarted } = await import('../../config/dates.js');
  const n = { date: '2030-07-01' };
  assert.equal(noticeStarted(n, Date.parse('2030-06-30T23:59:00+01:00')), false);
  assert.equal(noticeStarted(n, Date.parse('2030-07-01T00:00:00+01:00')), true);
});

test('the home shows at most 5 started, current notices, newest first', async () => {
  const { noticesHome, noticesCurrent } = await import('../../config/dates.js');
  const item = (name, date, until) => ({ name, data: { date, until } });
  const items = [
    item('old', '2030-01-01'), item('a', '2030-06-01'), item('b', '2030-06-02'), item('c', '2030-06-03'),
    item('d', '2030-06-04'), item('e', '2030-06-05'), item('ended', '2030-06-10', '2030-06-14'), item('later', '2030-07-01'),
  ];
  const now = Date.parse('2030-06-15T12:00:00+01:00');
  assert.deepEqual(noticesHome(items, now).map((i) => i.name), ['e', 'd', 'c', 'b', 'a']);
  assert.deepEqual(noticesCurrent(items, now).map((i) => i.name), ['later', 'e', 'd', 'c', 'b', 'a', 'old']);
});

test('countdown and status on the clock site', async () => {
  const { countdown } = await import('../../config/dates.js');
  const now = Date.parse('2030-06-15T12:00:00+01:00');
  const ev = (date, end) => ({ date, end });
  assert.equal(eventStatus(ev('2030-06-15T15:30'), now), 'Soon');
  assert.equal(eventStatus(ev('2030-06-20T10:00', '2030-06-20T12:00'), now), 'Soon');
  assert.equal(eventStatus(ev('2030-06-23T12:30'), now), 'Future');
  assert.equal(eventStatus(ev('2030-06-14T19:00'), now), 'Active');
  assert.equal(eventStatus(ev('2030-06-14T11:00'), now), 'Expired');
  assert.equal(countdown(ev('2030-06-15T15:30'), now), '3 hours to go');
  assert.equal(countdown(ev('2030-06-15T12:40'), now), '40 minutes to go');
  assert.equal(countdown(ev('2030-06-15T12:00:30'), now), '1 minutes to go');
  assert.equal(countdown(ev('2030-06-14T19:00'), now), 'In Progress');
  assert.equal(countdown(ev('2030-06-14T11:00'), now), 'Expired');
  assert.equal(countdown(ev('2030-06-20T10:00', '2030-06-20T12:00'), now), '4 days to go');
  assert.equal(countdown(ev('2030-06-16T11:59'), now), '23 hours to go');
});

test('countdown across the October clock change', async () => {
  const { countdown } = await import('../../config/dates.js');
  // 01:30 on 27 October happens twice; it is read as GMT (01:30Z). 02:00Z is 03:00 BST the day before.
  assert.equal(countdown({ date: '2030-10-27T01:30' }, Date.parse('2030-10-26T03:00:00+01:00')), '23 hours to go');
});
