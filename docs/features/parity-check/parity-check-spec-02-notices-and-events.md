---
date: 2026-10-19
tags: [spec, plan, stpauls, parity]
status: agreed
---

# Spec 02: notices and events

_One session, after spec 01. Part 1 "Notices" and "Events" of the [parity design](parity-check-feature.md): notices get a start and optional end date with live's rules, and events follow live's timing, labels, date blocks and countdown. Live rules in full: [parity report](parity-check-discovery-legacy-source.md) B-01, B-02, B-05, B-06, B-08 to B-11, B-13, B-30, B-31, C-01 to C-06. Conventions: [page-cms-spec-conventions.md](../page-cms/page-cms-spec-conventions.md)._

---

## Goal

A notice Paul adds shows from its start date and goes away after its end date, like live. An event shows as Soon in its last 7 days, stays Active until it ends (24 hours after the start when there is no end), and its pages, cards and the new home column read like live.

## Starting point

- `config/dates.js`: `wall`, `londonInstant`, `date` (`dd-MMM-yy`), `time` (12-hour), `month`, `day`, `isoLondon`, `eventEnd(data)` (falls back to the start), `eventStatus(data, now)` (`SOON_MS` 168 hours, returns Expired, Active, Soon, Future), `upcoming(items, now)`. All registered as filters. "Now" is `Date.now()` at build; there is no build clock.
- Templates: `sections/calendar-item.njk`, `calendar-list.njk`, `notices-item.njk`, `notices-list.njk`, `home.njk`, `partials/card.njk`, `pages/topics.njk` with `withTopic` (`config/topics.js`), `pages/feeds.njk` (calendar feed uses `upcoming`, notices `newestFirst`), `pages/sitemap-xml.njk` and `sitemapPages` (`config/filters.js`, honours `sitemap: false`).
- `site.js` hides `.event-list .card[data-end]` cards that ended since the build and shows `.event-empty`.
- `.pages.yml` notices: `title`, `date` (date, required), `summary`, `location`, `noticetopics`, `url` (hidden), `body`. Events: `title`, `date`, `end`, `summary`, `location`, `image`, `image_alt`, `eventtopics`, `url`, `body`.
- Tests: `tests/features/calendar.feature`, `notices.feature`, `pages.feature` (home), `feeds.feature`, `sitemap.feature`; step `Given it is "<iso>"` sets the browser clock (Playwright `page.clock`). Fixtures in `tests/fixtures/content/` use far-future (2099) and past dates against the real clock. `tests/serve.js` builds a fixture folder; `tests/playwright.config.js` lists the servers.
- Live has no upcoming events today; the 5 live notices have no end date.

## In scope

Build clock for tests, notice start and end, event rules, the home "Upcoming Events" column, calendar card and event page layout, `site.js` labels and countdowns, topic pages, feeds and sitemaps for ended notices.

## Out of scope

Hero, blog, menus, contact (spec 03). Open Graph (spec 04). Old short notice and event links (dropped).

## Requirements

### Build clock

- `export function buildNow(): number` in `config/dates.js`: `Date.parse(process.env.NOW)` when `NOW` is set and parses, else `Date.now()`. A set but unparsable `NOW` throws (a typo must not build against the real clock). Every `now` default in `config/dates.js` uses it.
- `tests/serve.js` takes `--now <iso>` and sets `NOW` for the build.
- New fixture folder `tests/fixtures/clock/` (its own `_index.md` files copied from `tests/fixtures/content/`), served on port 1316 with `--now 2030-06-15T12:00:00+01:00 --data fixtures/data/no-key`. Scenarios on it open `http://localhost:1316/...` and set the browser clock to the same instant first.

### Notices

- `.pages.yml` notices: `date` label "Show from", description "The notice shows on the home page from this day". New `until`: type `date`, label "Show until", description "Optional. The notice is taken down after this day", not required. The Pages CMS view stays `[title, date]`.
- `config/dates.js`:
  - `noticeStarted(data, now = buildNow()): boolean`: the start of the `date` day (00:00 UK) is at or before `now`.
  - `noticeEnded(data, now = buildNow()): boolean`: `until` is set and readable, and `now` is at or after 00:00 UK on the day after `until`. A missing, empty or unreadable `until` never ends.
  - Filters `noticesCurrent(items, now)` (not ended, newest `date` first) and `noticesHome(items, now)` (started and not ended, newest first, first 5).
- Home: "Church Notices" uses `noticesHome`; the whole section is left out when it is empty.
- `/notices` uses `noticesCurrent`. "Could not find any notices." when empty, as now.
- Notice page: no date line. When `noticeEnded`, a box before the body: `<div class="alert alert-expired" role="note"><strong>Expired</strong> This notice has now expired and should be ignored.</div>`. Style it in the site's colours.
- Notice cards: no date (`partials/card.njk` drops the `notice-date` span).
- An ended notice has `sitemap: false` (an `eleventyComputed` in the notices directory data or `config/content.js`), so it leaves `/sitemap.xml` and `/sitemap`. The notices feed uses `noticesCurrent`.
- Notices topic pages list every notice in the topic, ended included, newest first.

### Events

- `SOON_MS` stays 168 hours (7 days). Maintainer, 2026-10-19: not live's 24 hours.
- Times are UK wall-clock times as typed in Pages CMS (no zone), never UTC. Pages show them as typed. `site.js` compares the visitor's clock with the UK instant (`data-` attributes carry the London offset), so a countdown is right in any time zone.
- `eventEnd(data)`: a readable `end` after the start, else the start plus 24 hours.
- `eventStatus` unchanged otherwise: Expired after the end, Active from start to end, Soon when the start is under 7 days away, else Future.
- `time(v)` becomes 24-hour `HH:mm` (`19:30`). Every caller wants that (design, Decisions).
- New `countdown(data, now = buildNow()): string`: Expired, "In Progress" (Active), "{m} minutes to go" when the start is under an hour away (whole minutes rounded down, at least 1), "{h} hours to go" under 24 hours (whole hours rounded down), else "{d} days to go" (whole days rounded down). Live tied hours to Soon; with Soon at 7 days, hours apply under 24 hours only (builder's call). Singular forms are not used, like live ("1 hours to go").
- Status labels on cards and the home column: Expired, "In Progress" (Active), Soon; nothing for Future. On the home column Active reads "Active" (live B-01).
- Event page (`calendar-item.njk`):
  - `<p class="countdown" data-start data-end>` with `countdown`, after the heading. The status span goes.
  - Date blocks. Start and end on the same wall date (day, month and year): `Start {HH:mm} {full month} {day}`, `End` likewise. Otherwise: `Start {day} {short month} {HH:mm}`, and `End` the same only when `end` is readable and after the start. Each value stays in a `<time datetime>`.
  - Topic link, location, summary lead, image and body as now.
- Calendar card (event cards in `partials/card.njk`): day number, status label, `HH:mm`, full month, title (a real link), location, summary. No topic, no `dd-MMM-yy`. Keep `data-end`, add `data-start`.
- `/calendar` heading "Upcoming Events" (already so), `<title>` "Calendar | St Paul's Warton": set `title: Calendar` and a `heading: Upcoming Events` in `site/content/calendar/_index.md` if the layout cannot already show a heading different from the title.
- Calendar topic pages: every event in the topic, ended included, soonest first.
- Calendar feed unchanged (upcoming).

### Home "Upcoming Events" column

- In `home.njk`, beside "Church Notices": `<section class="home-events" aria-labelledby="home-events">`, `<h2 id="home-events"><a href="/calendar">Upcoming Events</a></h2>`, the first 20 of `upcoming`, grouped under `<h3>` month name (no year) in date order, each `<li data-start data-end>`: `<strong>{day}</strong> <a href>{title}</a>` and a label span ("Soon" or "Active") when one applies.
- Left out when there are no upcoming events. Notices and events sit side by side from the desktop breakpoint, notices wider; stacked on a phone, notices first. Exact widths are the builder's call.

### `site.js`

From `data-start` and `data-end` (ISO with offset) and the visitor's clock, on load:

- Event page `.countdown`: recompute the text with the same rules as `countdown`.
- Card and home labels: recompute (Expired, "In Progress" or "Active", Soon, none).
- Hide home column items and calendar cards that have ended (the existing card rule extends to `.home-events li`); hide a month group with nothing left, and the whole column when empty.
- No timers. The page is right when it opens.

## Manual steps (maintainer)

1. After merge, add a test notice on the test site with "Show until" yesterday: next build it is gone from home and `/notices`, and its page shows the Expired box. Delete it.
2. Add a test event starting in 2 hours: home shows it with "Soon", the event page shows "2 hours to go". Delete it.

## Acceptance

- [ ] Notices follow start and end as above on home, `/notices`, pages, cards, feed, sitemaps and topic pages.
- [ ] Events: 7-day Soon, 24-hour default end, 24-hour times, live date blocks and countdown, live card fields.
- [ ] Home "Upcoming Events" column as above, hidden when empty.
- [ ] `site.js` corrects labels, countdowns and ended items between builds.
- [ ] `npm test` green.

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** as above.

**Architecture:** all date rules live in `config/dates.js` as pure functions with a `now` argument defaulting to `buildNow()`, registered as filters. Templates only call them. `site.js` repeats the event rules from `data-` attributes. A fixed build clock (`NOW`) and a matching browser clock make the scenarios exact.

**Tech Stack:** Eleventy 3, Nunjucks, vanilla JS, `node:test`, Playwright with `playwright-bdd`.

**Spec:** this document and [parity-check-feature.md](parity-check-feature.md).

### Global Constraints

- All wall times are UK (`Europe/London`). Compare with `londonInstant`.
- Exact copy: "Show from", "Show until", "**Expired** This notice has now expired and should be ignored.", "In Progress", "Active", "Soon", "{h} hours to go", "{m} minutes to go", "{d} days to go", "Upcoming Events".
- Soon is 7 days. Times are UK wall-clock, never UTC. Default event length is 24 hours. Home: 5 notices, 20 events.
- No inline script or style (content security policy).

### Review Focus

- A notice with "Show until" today: still shown all day, gone from tomorrow 00:00 UK (unit test at 23:59 and 00:00).
- Clock change: an event at 01:30 on the last Sunday of October; countdown and status use `londonInstant` (unit test across 2030-10-27).
- A notice dated in the future: on `/notices`, not on home (scenario).
- An event with `end` before `start` or unreadable: ends 24 hours after start (unit test; the existing "backwards" fixture scenario changes to expect no End block).
- Visitor's clock past the build: home month group empties and hides (scenario with `Given it is`).

---

### Task 1: Build clock and fixed-clock fixtures

**Files:**
- Modify: `config/dates.js`, `tests/serve.js`, `tests/playwright.config.js`
- Create: `tests/fixtures/clock/` (`_index.md` files, `calendar/`, `notices/`, `blog/` empty index)
- Test: `tests/unit/dates.test.mjs`

**Interfaces:**
- Produces: `buildNow(): number`; serve flag `--now <iso>`; server `http://localhost:1316` built at `2030-06-15T12:00:00+01:00`.

- [ ] **Step 1: Write the failing tests**: `buildNow reads NOW` (set `process.env.NOW = '2030-06-15T12:00:00+01:00'`, expect `Date.parse` of it), `buildNow without NOW is the real clock` (within 1000 ms of `Date.now()`), `buildNow throws on a bad NOW` (`'not a date'`).
- [ ] **Step 2: Run** `node --test tests/unit/dates.test.mjs`. Expected: FAIL, not exported.
- [ ] **Step 3: Implement `buildNow`**, use it for every `now` default, add `--now` to `serve.js`, add the 1316 server, create `tests/fixtures/clock/` with index files only.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Add a build clock for tests"`

### Task 2: Notice start and end

**Files:**
- Modify: `config/dates.js`, `.pages.yml`, `site/_includes/sections/home.njk`, `notices-list.njk`, `notices-item.njk`, `partials/card.njk`, `site/pages/feeds.njk`, `site/pages/topics.njk` (if notices need their own order), the computed `sitemap` for notices, CSS for `.alert-expired`
- Create: notices in `tests/fixtures/clock/notices/`: `current.md` (date 2030-06-01), `until-today.md` (date 2030-05-01, until 2030-06-15), `ended.md` (date 2030-05-01, until 2030-06-14), `not-started.md` (date 2030-07-01), `no-until-1.md` to `no-until-5.md` (dates 2030-06-02 to 06-06)
- Test: `tests/unit/dates.test.mjs`, `tests/features/notices-dates.feature`, `tests/features/editor.feature`

**Interfaces:**
- Produces: `noticeStarted(data, now)`, `noticeEnded(data, now)`, filters `noticesCurrent(items, now)`, `noticesHome(items, now)`.

- [ ] **Step 1: Write the failing tests.**
  - Unit: `noticeEnded` false at `2030-06-15T23:59:00+01:00` and true at `2030-06-16T00:00:00+01:00` for `until: 2030-06-15`; false for no, empty or `'nonsense'` until. `noticeStarted` false at `2030-06-30T23:59+01:00`, true at `2030-07-01T00:00+01:00` for `date: 2030-07-01`. `noticesHome` returns at most 5, newest first, no not-started or ended.
  - Scenarios on 1316: home "Church Notices" lists, in order, "No until 5", "No until 4", "No until 3", "No until 2", "No until 1" and nothing else (titles match file names); `/notices` includes "Not started" and "Until today", excludes "Ended"; `/notices/notice/ended` shows "Expired" and "This notice has now expired and should be ignored."; `/notices/notice/current` does not; no notice card or page shows a `dd-MMM-yy` date; `/sitemap.xml` and `/sitemap` have no `/notices/notice/ended`; `/notices/index.xml` has no "Ended"; the notices topic page for the fixtures' topic includes "Ended".
  - Editor scenario: the notices collection has a `date` field labelled "Show from" and an optional `until` date labelled "Show until".
- [ ] **Step 2: Run** `npm test`. Expected: new tests FAIL.
- [ ] **Step 3: Implement** per "Requirements, Notices".
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Existing notice scenarios that check a date on cards are updated to expect none.
- [ ] **Step 5: Commit** `git commit -m "Give notices a start and optional end date, as on live"`

### Task 3: Event timing, times and countdown

**Files:**
- Modify: `config/dates.js`, `site/_includes/sections/calendar-item.njk`
- Create: events in `tests/fixtures/clock/calendar/`: `soon.md` (2030-06-15T15:30, no end), `minutes.md` (2030-06-15T12:40), `active-no-end.md` (2030-06-14T19:00, no end), `ended-no-end.md` (2030-06-14T11:00, no end), `future-same-day.md` (2030-06-20T10:00 to 2030-06-20T12:00), `future-two-days.md` (2030-06-20T10:00 to 2030-06-21T09:00), `same-day-next-month.md` (2030-06-20T10:00 to 2030-07-20T10:00)
- Test: `tests/unit/dates.test.mjs`, `tests/features/calendar.feature`

**Interfaces:**
- Produces: `countdown(data, now)`; `time` returns `HH:mm`; `eventEnd` default start + 24 h.

- [ ] **Step 1: Write the failing tests.**
  - Unit, now `2030-06-15T12:00:00+01:00`: `eventStatus` of `soon` is Soon, of `future-same-day` (5 days away) is Soon, of a start at 2030-06-23T12:30 is Future; `active-no-end` Active; `ended-no-end` Expired. `countdown`: `soon` "3 hours to go", `minutes` "40 minutes to go", `active-no-end` "In Progress", `ended-no-end` "Expired", `future-same-day` "4 days to go". `time('2030-06-15T19:30')` is "19:30". Clock change: event `2030-10-27T01:30`, now `2030-10-26T02:00:00+01:00`, `countdown` "23 hours to go" (builder confirms the number from `londonInstant` before fixing it in the test).
  - Scenarios on 1316: `/calendar/event/future-same-day` shows Start "10:00 June 20" and End "12:00 June 20"; `future-two-days` shows "20 Jun 10:00" and "21 Jun 09:00"; `same-day-next-month` shows "20 Jun 10:00" and "20 Jul 10:00"; `soon` has no End block and shows "3 hours to go"; `active-no-end` shows "In Progress".
  - Update the existing calendar scenarios to 24-hour times and the "backwards" fixture to "no End block".
- [ ] **Step 2: Run** `npm test`. Expected: new tests FAIL.
- [ ] **Step 3: Implement** per "Requirements, Events" (event page part).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Match live's event timing, 24-hour times and countdown"`

### Task 4: Calendar cards, topic pages and the home column

**Files:**
- Modify: `partials/card.njk` (event branch), `calendar-list.njk`, `site/content/calendar/_index.md` and the layout if needed for `<title>`, `site/pages/topics.njk` or `config/topics.js`, `home.njk`, CSS for `.home-events` and the card layout
- Test: `tests/features/calendar.feature`, `tests/features/pages.feature`

**Interfaces:**
- Consumes: `eventStatus`, `upcoming`, `day`, `month`, `time` from Tasks 1 to 3.
- Produces: markup `data-start`, `data-end` on event cards and `.home-events li`; `.countdown` on the event page; label element `.status`.

- [ ] **Step 1: Write the failing tests** on 1316:
  - The `soon` card shows "15", "Soon", "15:30", "June", its location and summary, and no topic link.
  - `<title>` of `/calendar` is "Calendar | St Paul's Warton", heading "Upcoming Events".
  - Home "Upcoming Events" heading links to `/calendar`, month groups in order "June" then "July", "Soon" next to `soon`, "Active" next to `active-no-end`, no `ended-no-end`.
  - On 1314 (empty), home has no "Upcoming Events".
  - The calendar topic page for the fixtures' topic includes `ended-no-end`, soonest first.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Requirements, Events" (cards, topic pages) and "Home column".
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Add live's calendar cards and the home Upcoming Events column"`

### Task 5: `site.js` labels and countdowns

**Files:**
- Modify: `site/assets/js/site.js`
- Test: `tests/features/calendar.feature`, `tests/features/pages.feature`

- [ ] **Step 1: Write the failing scenarios** on 1316, each starting `Given it is "<iso>"`:
  - At `2030-06-15T15:00:00+01:00`, `/calendar/event/soon` shows "30 minutes to go".
  - At `2030-06-15T16:00:00+01:00`, it shows "In Progress"; the `soon` card shows "In Progress"; home shows "Active" next to it.
  - At `2030-06-20T12:30:00+01:00`, home no longer lists `future-same-day`, and an emptied month group is hidden.
  - At `2030-08-01T00:00:00+01:00`, home has no visible "Upcoming Events" column.
- [ ] **Step 2: Run** `npm run test:bdd`. Expected: FAIL.
- [ ] **Step 3: Implement** in `site.js` per "Requirements, `site.js`", in the file's existing style (one IIFE, no globals).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Refresh event labels and countdowns in the browser"`

### Finish

- [ ] `npm ci && npm test` green with Node 26. Push. Give the maintainer the manual steps.
