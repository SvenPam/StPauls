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

test('eventEnd reads Pages CMS strings and falls back to the start', () => {
  const date = new Date('2026-10-17T18:00:00Z');
  assert.equal(eventEnd({ date, end: '2026-10-17T19:30' }).toISOString(), '2026-10-17T19:30:00.000Z');
  assert.equal(eventEnd({ date, end: '2026-10-17T19:30:15' }).toISOString(), '2026-10-17T19:30:15.000Z');
  assert.equal(eventEnd({ date, end: '' }), date);
  assert.equal(eventEnd({ date }), date);
  assert.equal(eventEnd({ date, end: 'soon' }), date);
  assert.equal(eventEnd({ date, end: new Date('2026-10-17T17:00:00Z') }), date);
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
  assert.equal(time(summer), '10:00 AM');
  assert.equal(time(new Date('2099-06-01T12:00:00Z')), '12:00 PM');
  assert.equal(time(new Date('2015-12-01T19:30:00Z')), '7:30 PM');
  assert.equal(time(new Date('2015-12-01T00:05:00Z')), '12:05 AM');
  assert.equal(month(summer), 'June');
  assert.equal(day(summer), '1');
  assert.equal(isoLondon(new Date('2099-06-01T12:00:00Z')), '2099-06-01T12:00:00+01:00');
  // GMT is written Z.
  assert.equal(isoLondon(new Date('2099-01-15T12:00:00Z')), '2099-01-15T12:00:00Z');
  assert.equal(rfc822London(summer), 'Mon, 01 Jun 2099 10:00:00 +0100');
});

test('a quoted date string is read as a wall time, so the filters do not fail the build', () => {
  assert.equal(date('2099-07-03'), '03-Jul-99');
  assert.equal(time('2099-07-03T14:05'), '2:05 PM');
  assert.equal(time('2099-07-03T14:05:09'), '2:05 PM');
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
