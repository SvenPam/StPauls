// Front matter times are London wall-clock times, but Eleventy parses them as UTC Dates.
// So a Date here is a wall time: display reads its UTC fields, and anything compared with
// "now" goes through londonInstant first.
const ZONE = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' });
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SOON_MS = 168 * 60 * 60 * 1000;
const PAGES_CMS_TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d)?$/;

const pad = (n) => String(n).padStart(2, '0');

// Minutes London is ahead of UTC at a real instant (ms since the epoch).
function offsetMinutesAt(ms) {
  const name = ZONE.formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName').value;
  const m = /^GMT([+-])(\d\d):(\d\d)$/.exec(name);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

// The real instant of a London wall time. Guess with the offset at the wall time read as UTC,
// then re-read the offset at the result; if it differs, a clock change lies between and the
// second reading is the right one. An hour that happens twice (October) is read as GMT.
export function londonInstant(wall) {
  const guess = wall.getTime();
  const first = offsetMinutesAt(guess);
  const second = offsetMinutesAt(guess - first * 60000);
  return new Date(guess - second * 60000);
}

export function londonOffset(wall) {
  const minutes = Math.round((wall.getTime() - londonInstant(wall).getTime()) / 60000);
  const abs = Math.abs(minutes);
  return `${minutes < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// Day-Mon-YY, as 01-Feb-26.
export const date = (d) => `${pad(d.getUTCDate())}-${MONTHS[d.getUTCMonth()].slice(0, 3)}-${pad(d.getUTCFullYear() % 100)}`;
// 12-hour time, as 7:30 PM.
export const time = (d) => `${d.getUTCHours() % 12 || 12}:${pad(d.getUTCMinutes())} ${d.getUTCHours() < 12 ? 'AM' : 'PM'}`;
export const month = (d) => MONTHS[d.getUTCMonth()];
export const day = (d) => String(d.getUTCDate());

const wallClock = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

// RFC 3339 with London's offset, and Z for GMT.
export const isoLondon = (d) => {
  const offset = londonOffset(d);
  return `${wallClock(d)}${offset === '+00:00' ? 'Z' : offset}`;
};

export const rfc822London = (d) =>
  `${DAYS[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ${londonOffset(d).replace(':', '')}`;

// An event's end. Pages CMS writes 2026-10-17T19:30 as a string; migrated files have a Date.
// Missing, empty, unreadable or not after the start falls back to the start.
export function eventEnd(data) {
  const start = data.date;
  let end = data.end;
  if (typeof end === 'string') {
    const s = end.trim();
    end = PAGES_CMS_TIME.test(s) ? new Date(`${s.length === 16 ? `${s}:00` : s}Z`) : null;
  }
  return end instanceof Date && !Number.isNaN(end.getTime()) && end > start ? end : start;
}

// Expired, Active, Soon (starts within 168 hours) or Future, as event-status.html did.
export function eventStatus(data, now = Date.now()) {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  if (londonInstant(eventEnd(data)).getTime() < nowMs) return 'Expired';
  const start = londonInstant(data.date).getTime();
  if (start <= nowMs) return 'Active';
  if (start < nowMs + SOON_MS) return 'Soon';
  return 'Future';
}

// Collection items whose end has not passed, soonest first.
export function upcoming(items, now = Date.now()) {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  return (items ?? [])
    .filter((item) => londonInstant(eventEnd(item.data)).getTime() >= nowMs)
    .sort((a, b) => a.data.date - b.data.date);
}

export default function (eleventyConfig) {
  for (const [name, fn] of Object.entries({ date, time, month, day, isoLondon, rfc822London, eventEnd, eventStatus, upcoming })) {
    eleventyConfig.addFilter(name, fn);
  }
}
