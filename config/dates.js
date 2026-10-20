// Front matter times are London wall-clock times, but Eleventy parses them as UTC Dates.
// So a Date here is a wall time: display reads its UTC fields, and anything compared with
// "now" goes through londonInstant first.
const ZONE = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' });
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SOON_MS = 168 * 60 * 60 * 1000;

// "Now" for the build: NOW (an ISO instant) when set, so tests build against a fixed clock, else the real clock.
// A NOW that does not parse stops the build rather than quietly using the real clock.
export function buildNow() {
  if (process.env.NOW === undefined) return Date.now();
  const ms = Date.parse(process.env.NOW);
  if (Number.isNaN(ms)) throw new Error(`NOW is not a date: ${process.env.NOW}`);
  return ms;
}

const WALL_STRING = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d)(?::(\d\d))?)?$/;

// YAML hands over a Date for an unquoted timestamp but a string for a quoted one, or one without seconds.
// A Date passes through. A YYYY-MM-DD string, with optional THH:MM and :SS, becomes a Date whose UTC fields
// are that wall time. Anything else is returned as it came, for the caller's own fallback.
export function wall(v) {
  if (typeof v !== 'string') return v;
  const m = WALL_STRING.exec(v.trim());
  if (!m) return v;
  const [y, mo, d, h, mi, s] = m.slice(1).map((x) => Number(x ?? 0));
  const out = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  return Number.isNaN(out.getTime()) || out.getUTCMonth() !== mo - 1 ? v : out;
}

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
export function londonInstant(w) {
  const guess = wall(w).getTime();
  const first = offsetMinutesAt(guess);
  const second = offsetMinutesAt(guess - first * 60000);
  return new Date(guess - second * 60000);
}

export function londonOffset(w) {
  const d = wall(w);
  const minutes = Math.round((d.getTime() - londonInstant(d).getTime()) / 60000);
  const abs = Math.abs(minutes);
  return `${minutes < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

// Day-Mon-YY, as 01-Feb-26.
export const date = (v) => {
  const d = wall(v);
  return `${pad(d.getUTCDate())}-${MONTHS[d.getUTCMonth()].slice(0, 3)}-${pad(d.getUTCFullYear() % 100)}`;
};
// 12-hour time, as 7:30 PM.
export const time = (v) => {
  const d = wall(v);
  return `${d.getUTCHours() % 12 || 12}:${pad(d.getUTCMinutes())} ${d.getUTCHours() < 12 ? 'AM' : 'PM'}`;
};
export const month = (v) => MONTHS[wall(v).getUTCMonth()];
export const day = (v) => String(wall(v).getUTCDate());

const wallClock = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

// RFC 3339 with London's offset, and Z for GMT.
export const isoLondon = (v) => {
  const d = wall(v);
  const offset = londonOffset(d);
  return `${wallClock(d)}${offset === '+00:00' ? 'Z' : offset}`;
};

// The wall date as YYYY-MM-DD.
export const isoDay = (v) => isoLondon(v).slice(0, 10);

export const rfc822London = (v) => {
  const d = wall(v);
  return `${DAYS[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ${londonOffset(d).replace(':', '')}`;
};

// An event's end. Pages CMS writes 2026-10-17T19:30 as a string; migrated files have a Date. Both go through wall().
// Missing, empty, unreadable or not after the start falls back to the start.
export function eventEnd(data) {
  const start = wall(data.date);
  const end = wall(data.end);
  return end instanceof Date && !Number.isNaN(end.getTime()) && end > start ? end : start;
}

// Expired, Active, Soon (starts within 168 hours) or Future, as event-status.html did.
export function eventStatus(data, now = buildNow()) {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  if (londonInstant(eventEnd(data)).getTime() < nowMs) return 'Expired';
  const start = londonInstant(wall(data.date)).getTime();
  if (start <= nowMs) return 'Active';
  if (start < nowMs + SOON_MS) return 'Soon';
  return 'Future';
}

// Collection items whose end has not passed, soonest first.
export function upcoming(items, now = buildNow()) {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  return (items ?? [])
    .filter((item) => londonInstant(eventEnd(item.data)).getTime() >= nowMs)
    .sort((a, b) => wall(a.data.date) - wall(b.data.date));
}

export default function (eleventyConfig) {
  for (const [name, fn] of Object.entries({ date, time, month, day, isoLondon, isoDay, rfc822London, eventEnd, eventStatus, upcoming })) {
    eleventyConfig.addFilter(name, fn);
  }
}
