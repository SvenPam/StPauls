---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: done
---

# Spec 07: content migration

_One session. A re-runnable script extracts every article, event, notice and page from the live site into front matter plus an HTML body, copies uploads and hot-linked images into the repo, moves embeds into fields, and writes a report for the maintainer and the church. It is run again on cutover day. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

`site/content/` holds the live content at live URLs, every image is local and optimised, and the maintainer has a short report of what needs a human look. Running the script again gives the same files.

## Starting point

- Specs 00 to 06 on `main`, on Eleventy. Seed notices from spec 00 (`news-pew-sheets.md`, `safeguarding.md`, `latest-parish-magazine.md`) with invented dates.
- `scripts/check-urls.mjs` and `tests/fixtures/live-urls.txt` (spec 05). `buildSwaConfig` gives every file under `uploads/legacy/` a 301 from each `upload_prefixes` entry in `site/data/legacy.yaml` (spec 05). The `images` transform turns body `<img src="/uploads/...">` into `<picture>` (spec 06). `embedFor` and `site/data/embeds.yaml` (spec 06).
- Bodies are published byte for byte (`config/content.js` registers `.md` raw), so `{{`, `{%` and `---` inside a body are safe.
- Topic pages and links exist only for the slugs in `site/data/topics.yaml`. A topic value outside that list gets no page and no link (see [Eleventy facts](page-cms-spec-conventions.md#eleventy-316)).
- `scripts/screenshots.mjs` for side-by-side screenshots. No migration script yet.
- Live facts (crawl of 2026-10-17):

| Item | Where its data is on live |
|---|---|
| Article | `/blog/article/{slug}`: `h1[itemprop=headline]`, the `<p>` after it (summary), `div[itemprop=articleBody]` (body). Date ("Published 02-Mar-22") and topic link only on `/blog` and topic pages. Card image only for the 3 on the home page |
| Event | `/calendar/event/{id}/{slug}`: `h2` title, `p.text-muted` topic label, start and end as time, month name and day, **no year**, `h4.lead` summary, body after it. Only 21 of 69 mention a year in their text |
| Notice | `/notices/notice/{id}/{slug}`: `h1` title, topic label after the author, body in the second `div.col-xs-12`. **No date shown.** Home page lists notices in descending id |
| Page | `/page/{type}/{slug}`: `h1.page-header` title, body after it in `div.col-xs-12`. `church-diary` and `church-gallery` bodies are mainly an iframe |
| Menus | Header and footer list which pages show where, and in what order |
| Images | 33 unique: 29 on `media.acny.uk` (some with `?h=300&w=350&mode=crop`), 3 on `achurchnearyou.com`, plus `/Areas/st_pauls/Content/Image/generic/2.jpg` |
| Uploads | `/Areas/st_pauls/Uploads/` (2 PDFs, about 12 gallery images), linked as `http://`, `http://www.` and relative, mixed case, one with `\` |
| Policies | Cookie policy mentions Google Analytics, Disqus and accounts. Privacy policy mentions registering |

- Author names ("by Paul Barfoot") are on every item. They are not migrated (no accounts, and the design keeps personal details to a minimum).

## In scope

- `scripts/migrate.mjs` and its `node:test` unit tests on saved HTML snapshots in `tests/fixtures/live/`.
- `cheerio` `1.2.0` as an exact-pinned dev dependency, audited like the rest.
- Dates from a maintainer export of the legacy database (`scripts/legacy-dates.csv`), with inferred and flagged fallbacks.
- Running it: migrated content, uploads in `site/static/uploads/`, extra legacy upload spellings appended to `site/data/legacy.yaml`, `docs/features/page-cms/page-cms-migration-report.md`.
- Seed notices from spec 00 removed (their migrated versions replace them).

## Out of scope

Rewording any content. The privacy and cookie policy decisions (cookie policy: spec 09; privacy policy wording: the church, spec 10). Contact form (08).

---

## Requirements

### Output

| Live | File | Front matter written |
|---|---|---|
| `/blog/article/{slug}` | `site/content/blog/{slug}.md` | `title`, `date`, `summary`, `blogtopics`, `image`, `image_alt` (when on the home page) |
| `/calendar/event/{id}/{slug}` | `site/content/calendar/{id}-{slug}.md` | `title`, `date` (start), `end`, `summary`, `location` (from the export), `eventtopics`, `url: /calendar/event/{id}/{slug}` |
| `/notices/notice/{id}/{slug}` | `site/content/notices/{id}-{slug}.md` | `title`, `date`, `summary` (first 300 characters of the plain body, through the site's `excerpt`), `noticetopics`, `url: /notices/notice/{id}/{slug}` |
| `/page/{type}/{slug}` | `site/content/page/{type}/{slug}.md` | `title`, `header`, `footer`, `weight` (from live menus), `embed`, `embed_src` (when the body had a known iframe) |
| Home hero | `site/content/_index.md` | `lead` only, other keys kept |

Front matter is written with `yaml` (`2.9.1`, already a dependency), keys in the order above, so the files parse the way Eleventy reads them and diffs stay stable. Dates are written as Pages CMS writes them: events `yyyy-MM-dd'T'HH:mm:ss` (`2015-12-01T19:30:00`), articles and notices `yyyy-MM-dd`, as plain scalars, so Eleventy reads a `Date` and Pages CMS shows the same value in its date field. Body is HTML, one block element per line, no leading indentation, no blank lines.

Topics are written as slugs: the live topic label is looked up among the labels in `site/data/topics.yaml` (`Other Events` gives `other-events`). A label that is not there is left out of the front matter and listed in the report under "Unknown topics", because the site builds no page and no link for a topic outside that list.

`site/content/page/about/contact-us.md`, `site/content/sitemap.md`, `_index.md` files and anything the script did not write are never touched, except `lead` in the root `_index.md`.

### Dates

`scripts/legacy-dates.csv`, exported by the maintainer from the legacy database:

```
kind,id,start,end,location
event,16,2015-12-01T19:30,2015-12-01T21:00,"St Michael's, Kirkham"
notice,46,2024-03-10T00:00,,
```

`location` is optional. The legacy event model has a location field that live never shows, so the export is the only source. A value with a comma is quoted.

| Case | Rule | Flagged in report |
|---|---|---|
| Event or notice in the CSV | Use it | No |
| Event not in the CSV | Year from a 4-digit year in its text when there is exactly one, else the year that keeps start dates non-decreasing by id from the nearest earlier anchor | Yes, with the inferred date |
| Notice not in the CSV | A date one day apart per id step, counting back from 2026-10-01, so order matches live | Yes |
| Article | From the `/blog` list | Only if missing |

All times are London wall-clock times, as the site reads them (`config/dates.js`).

### Body rewriting

| Found | Becomes |
|---|---|
| Links and images on `http://` or `https://`, with or without `www.`, `stpaulswarton.co.uk` | Root-relative path |
| `/Calendar`, `/Notices`, `/Contact`, `/Blog` (any case) | Lower case |
| `/Areas/st_pauls/Uploads/{path}` (any case of the prefix, `\` as `/`) | `/uploads/legacy/{path}`, downloaded to `site/static/uploads/legacy/{path}`. `{path}` keeps the spelling of its first occurrence in crawl order, so spec 05's generated routes match the live address |
| `/Areas/st_pauls/Content/Image/{path}` | `/uploads/content/{path with / as -}`, downloaded. Not under `legacy/`, so it gets no legacy upload routes |
| `<img>` on `media.acny.uk` or `achurchnearyou.com` | `/uploads/acny/{last path segment}` without query string, downloaded. On a name clash, prefix the first 8 hex characters of the SHA-256 of the URL |
| `<iframe>` on `calendar.google.com` or `embedsocial.com` | Removed from the body; `embed` and `embed_src` set on the page, checked with `embedFor` |
| Any other `<iframe>` | Kept, and flagged |
| `<script>`, `on*=` attributes, Disqus or share blocks | Removed, and flagged |
| Trailing `<br>` runs and empty paragraphs | Removed |

Spec 05 routes every file in `uploads/legacy/` from `/Areas/st_pauls/Uploads/` and `/Areas/St_Pauls/Uploads/` with the file's own spelling. Any other spelling of the same file seen in live markup (another case of a folder or file name) gets a `redirects` entry in `site/data/legacy.yaml` to the encoded new path, appended once, sorted, under a comment `# uploads (spec 07)`, keeping the existing entries and comments (`yaml`'s document API).

### Report (`docs/features/page-cms/page-cms-migration-report.md`)

Front matter and title per the docs conventions. Tables: counts per type; items with inferred dates; unknown topics; failed downloads; iframes kept; removed scripts; files in content folders the script did not write (practice content or Paul's real additions, for the maintainer to keep or delete on cutover day); policy text that no longer applies (any of `Google Analytics`, `Disqus`, `register`, `log in`, `login`, `account`, `subscribe` in a page body, with the page and the sentence).

### CLI

```
node scripts/migrate.mjs [--live http://stpaulswarton.co.uk] [--dates scripts/legacy-dates.csv] [--site site] [--check]
```

| | |
|---|---|
| Default | Fetch, write files, download missing uploads, update `legacy.yaml`, write the report |
| `--check` | Write nothing. Print each file that would change and exit 1 if any would. Used on cutover day before the real run |
| Network | Node's `fetch`, a `User-Agent` naming the script, one request at a time, 3 retries with a pause, 30 second timeout (`AbortSignal.timeout`). Behind the sandbox proxy, run with `NODE_USE_ENV_PROXY=1` |
| Idempotent | A second run with the same live site changes no file |
| Not in CI | Hand-run only. Never called from the workflow or `npm test`; the unit tests call its functions with a fake `fetch` |

---

## Manual steps (maintainer)

1. Export `kind,id,start,end,location` for every event and notice from the legacy database into `scripts/legacy-dates.csv` (CSV, UTF-8, ISO dates, `location` blank for notices). If this cannot be done, say so: the script infers and flags, and events get no location.
2. Review the migrated content diff and `docs/features/page-cms/page-cms-migration-report.md`. Compare a few pages side by side with the screenshots.
3. Pass the policy section of the report to the church (spec 10 follows it up).

---

## Acceptance

- [x] `npm test` passes, and `npm audit` reports 0 vulnerabilities with `cheerio` added.
- [x] `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site` reports 0 failed against a build of the migrated content.
- [x] No content file references `stpaulswarton.co.uk`, `/Areas/`, `media.acny.uk` or `achurchnearyou.com/...` images.
- [x] Every migrated item's topic is one of the slugs in `site/data/topics.yaml`, and the report's "Unknown topics" table is empty or each entry is decided with the maintainer.
- [x] `node scripts/migrate.mjs --check` straight after a run reports no changes.
- [x] Seed notices from spec 00 are gone and their migrated versions exist.
- [x] The report exists. The maintainer reviews it with the pull request; content match is deferred (below).

### Deferred: content match

Agreed with the maintainer on 2026-10-18. Spec 07 is done with dates inferred and flagged, and events without locations. The maintainer will pull all content out of the legacy databases with SQL, the live site's and the 2019 Umbraco port's, to reach feature and content parity. That step:

- exports `scripts/legacy-dates.csv` (`kind,id,start,end,location`) and re-runs `node scripts/migrate.mjs --dates scripts/legacy-dates.csv`, then `--check`;
- compares the database content with the migrated files and with the Umbraco port's features;
- moves body copy to vanilla Markdown (agreed 2026-10-18): Pages CMS body fields to `format: markdown`, Eleventy renders Markdown with raw HTML allowed, and the script converts bodies (links as `[text](url)`, no `<p>` tags). HTML stays only where Markdown has no form (the table, the iframe); inline styles such as centred images and image widths need a ruling;
- takes side-by-side screenshots of five pages (home, an article with images, the gallery page, the church diary, an expired event) with `scripts/screenshots.mjs`.

It gets its own spec or step before spec 11 (cutover), which re-runs the script anyway.

Built as [spec 07a](page-cms-spec-07a-content-match.md) (2026-10-19). The maintainer's export is in `docs/features/migration/data/` and is read with `--db`, which replaces `--dates` and `scripts/legacy-dates.csv`. Bodies are Markdown.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tested, re-runnable migration from the live site, and its first real run.

**Architecture:** Pure functions parse saved HTML with cheerio into plain objects and rewrite bodies into new HTML plus a list of planned downloads; a thin CLI fetches, calls them, and writes files deterministically with `yaml`. Tests run the functions on trimmed snapshots of real live pages, never on the network, and finish by building the migrated fixture with Eleventy.

**Tech Stack:** Node 26 (`fetch`, `node:crypto`, `node:util` `parseArgs`), `cheerio` 1.2.0, `yaml` 2.9.1, Eleventy for the check build, `node:test`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- `cheerio` pinned exactly at `1.2.0` in `devDependencies`, `npm audit` at 0 after adding it. No other new dependency.
- The test suite never touches the network. Snapshots live in `tests/fixtures/live/` and are trimmed to the `<main>` element plus the header and footer navs, with the maintainer's name and links removed.
- Output front matter keys and file names exactly as in the Output table.
- The script never writes outside `--site` and `docs/features/page-cms/page-cms-migration-report.md`. `scripts/legacy-dates.csv` is read only.

### Review Focus

1. A body with mixed-case and backslash legacy upload paths and an `http://www.` own-domain link in the same paragraph. Expected: all rewritten, each file downloaded once. Pinned by "legacy links are rewritten and each file is downloaded once".
2. Two hot-linked images with the same file name from different ACNY folders. Expected: distinct local names. Pinned by "an ACNY name clash gets distinct names".
3. An event with no year anywhere and no CSV row, between two anchored events. Expected: an inferred year that keeps id order, and a report line. Pinned by "an event year is inferred from its neighbours".
4. Re-running after Paul edited a migrated file in Pages CMS during practice. Expected: the live version wins (live is the source of truth until cutover), and `--check` lists the file first. Pinned by "check mode lists a changed file".
5. A live page body with characters YAML dislikes in the title or summary (`:`, `#`, quotes) and template syntax in the body (`{{`, `---` on its own line). Expected: front matter still parses and Eleventy builds and shows the body as written. Pinned by "front matter survives awkward values" and "the migrated fixture builds".
6. A live topic label the site does not know. Expected: no topic in the file and a report line, never a topic value that has no page. Pinned by "every written topic is a site topic" and "the written files only use site topics".

---

### Task 1: Snapshots and page parsers

**Files:**
- Modify: `package.json`, `package-lock.json` (`cheerio` `1.2.0`, exact)
- Create: `tests/fixtures/live/` with `article.html` (`church-roof-completed`), `blog-index.html` (`/blog`), `event.html` (`/calendar/event/16/mu-advent-carol-service`), `notice.html` (`/notices/notice/46/news-pew-sheets`), `page-diary.html` (`/page/about/church-diary`), `page-gallery.html` (`/page/gallery/church-gallery`), `home.html` (`/`)
- Create: `scripts/migrate.mjs` (parsers only)
- Create: `tests/unit/migrate.test.mjs`

**Interfaces:**
- Produces, as named exports of `scripts/migrate.mjs`:
  - `classify(path: string): [kind, info] | null`: `['article', { slug }]`, `['event', { id, slug }]`, `['notice', { id, slug }]`, `['page', { type, slug }]`, else `null`. `id` is a number.
  - `parseBlogIndex(html): Record<slug, { date: 'YYYY-MM-DD', topic: string | null }>` (`topic` is the live label).
  - `parseArticle(html): { title, summary, body }`.
  - `parseEvent(html): { title, topicLabel, start: [hour, minute, month, day], end, summary, location, body, textYears: number[] }`.
  - `parseNotice(html): { title, topicLabel, body }`.
  - `parsePage(html): { title, body }`.
  - `parseMenus(html): Record<path, { header: boolean, footer: boolean, weight: number }>`.
  - `parseHome(html): { lead, cards: Record<slug, { image, alt }>, noticeOrder: number[] }`.

- [ ] **Step 1: Add `cheerio`, then audit**

Run: `npm install --save-dev --save-exact cheerio@1.2.0 && npm audit`
Expected: `found 0 vulnerabilities`. If not, stop and tell the maintainer before going on.

- [ ] **Step 2: Save and trim the snapshots** with `curl`, then strip personal details (name, `ste-pam.com`, LinkedIn) from each file.

- [ ] **Step 3: Write the failing tests**

```js
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
```

- [ ] **Step 4: Run them and watch them fail**

Run: `npm run test:unit`
Expected: FAIL, `scripts/migrate.mjs` not found.

- [ ] **Step 5: Write the parsers** with `cheerio.load`, selecting by tag and class and keeping inner HTML with `.html()`. No regex over whole documents except for the date and time text. The module runs its CLI only when started directly, so importing it runs nothing.

- [ ] **Step 6: Run the tests and watch them pass, then commit**

Run: `npm run test:unit`
Expected: all pass, `migrate.test.mjs` included.

```bash
git add package.json package-lock.json scripts/migrate.mjs tests
git commit -m "Add live page parsers for the migration script"
```

---

### Task 2: Dates, body rewriting, topics and front matter

**Files:**
- Modify: `scripts/migrate.mjs`
- Create: `tests/fixtures/live/dates.csv` (three rows: event 16, notice 46, and one event that does not exist on live)
- Modify: `tests/unit/migrate.test.mjs`

**Interfaces:**
- Produces:
  - `loadDates(file: string | null): Map<'event:16', { start: string, end: string | null }>` (wall-clock `YYYY-MM-DDTHH:mm:ss`).
  - `inferEventDates(events, known): Map<id, { start, end, reason }>` (`reason` `''` when from the CSV).
  - `inferNoticeDates(order: number[], known): Map<id, { date, reason }>`.
  - `rewriteBody(html): { html, downloads: Download[], embed: { embed, embed_src } | null, notes: string[] }`, where `Download` is `{ url, dest, legacyPaths: string[] }` and `dest` is relative to `site/static/` (`uploads/legacy/Gallery/EasterPoster.jpg`).
  - `topicSlug(label, topics): string` (`''` when the label is not a value in `topics`).
  - `frontMatter(fields): string`: the YAML block between `---` lines, keys in the given order.

- [ ] **Step 1: Write the failing tests**

```js
import { parse } from 'yaml';

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

test('CSV dates win', () => {
  const known = m.loadDates('tests/fixtures/live/dates.csv');
  const got = m.inferEventDates([{ id: 16, start: [19, 30, 12, 1], end: [21, 0, 12, 1], textYears: [] }], known);
  assert.equal(got.get(16).start, '2015-12-01T19:30:00');
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
```

`yaml`'s default schema reads `2015-12-01T19:30:00` as a string, so the round trip compares strings; Eleventy's front matter parser reads the same line as a `Date`, which "the migrated fixture builds" in Task 3 proves.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit`
Expected: FAIL, the functions are not exported yet.

- [ ] **Step 3: Implement the functions**

`frontMatter` builds a `yaml` `Document` from the fields in order and writes date values as plain scalars. `rewriteBody` walks the body with cheerio, collects downloads keyed on the lower-cased legacy path, and records every spelling seen in `legacyPaths`.

- [ ] **Step 4: Run the tests and watch them pass, then commit**

Run: `npm run test:unit`
Expected: all pass.

```bash
git add scripts/migrate.mjs tests
git commit -m "Add date inference, body rewriting, topics and front matter writer"
```

---

### Task 3: Writer, CLI and report

**Files:**
- Modify: `scripts/migrate.mjs` (`main`, writer, report, `legacy.yaml` update)
- Modify: `scripts/README.md`
- Modify: `tests/unit/migrate.test.mjs`

**Interfaces:**
- Produces: `writeSite(items, site: string, { check }): Promise<string[]>` (changed files), `updateLegacy(file: string, downloads: Download[], { check }): Promise<boolean>`, `writeReport(file: string, report): Promise<void>`, `main(argv: string[], { fetch } = {}): Promise<number>` (`fetch` injectable for tests: `(url) => Promise<Response>`).

- [ ] **Step 1: Write the failing tests**

`before` builds a temporary `site/` with `content/` holding the structural `page/**/_index.md` files, `contact-us.md` and the root `_index.md`, `static/uploads/`, and `data/legacy.yaml` copied from the repo. A fake `fetch` serves the snapshots for their paths, a sitemap XML listing them, and fixed bytes for image and PDF URLs. `main([...argv, '--site', site], { fetch })` runs once.

```js
test('writes the expected files', () => {
  for (const f of ['content/calendar/16-mu-advent-carol-service.md', 'content/notices/46-news-pew-sheets.md', 'content/page/about/church-diary.md'])
    assert.ok(existsSync(join(site, f)), f);
  assert.ok(statSync(join(site, 'static/uploads/acny')).isDirectory());
});

test('migrated items keep their live URL', () => {
  assert.match(readFileSync(join(site, 'content/calendar/16-mu-advent-carol-service.md'), 'utf8'), /^url: \/calendar\/event\/16\/mu-advent-carol-service$/m);
});

test('the written files only use site topics', () => { /* every blogtopics, eventtopics, noticetopics value in the written files is a key of topics.yaml */ });

test('a second run changes nothing', async () => {
  assert.equal(await m.main([...argv, '--check'], { fetch }), 0);
});

test('check mode lists a changed file', async () => {
  const p = join(site, 'content/notices/46-news-pew-sheets.md');
  writeFileSync(p, readFileSync(p, 'utf8') + '<p>Edited in practice</p>\n');
  const lines = [];
  const log = console.log;
  console.log = (s) => lines.push(s);
  try { assert.equal(await m.main([...argv, '--check'], { fetch }), 1); } finally { console.log = log; }
  assert.ok(lines.some((l) => l.includes('content/notices/46-news-pew-sheets.md')));
});

test('extra legacy upload spellings are appended once, existing routes kept', () => {
  const text = readFileSync(join(site, 'data/legacy.yaml'), 'utf8');
  assert.match(text, /# uploads \(spec 07\)/);
  assert.match(text, /\{ from: \/Calendar, to: \/calendar \}/);
  assert.equal(text.match(/# uploads \(spec 07\)/g).length, 1);
});

test('files the script did not write are untouched', () => {
  assert.equal(readFileSync(join(site, 'content/page/about/contact-us.md'), 'utf8'), CONTACT_BEFORE);
});

test('the report lists policy text, inferred dates and unknown topics', () => {
  const rep = readFileSync(report, 'utf8');
  for (const h of ['## Policy text that no longer applies', '## Inferred dates', '## Unknown topics']) assert.ok(rep.includes(h), h);
});

test('the migrated fixture builds', () => {
  execFileSync('npx', ['eleventy', `--output=${out}`], {
    env: { ...process.env, CONTENT: join(site, 'content'), UPLOADS: join(site, 'static/uploads') }, stdio: 'pipe',
  });
  assert.ok(existsSync(join(out, 'calendar/event/16/mu-advent-carol-service/index.html')));
});
```

`report` points `main` at a temporary file (`--report`, default `docs/features/page-cms/page-cms-migration-report.md`), so tests never write into `docs/`.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit`
Expected: FAIL, `main` is not exported yet.

- [ ] **Step 3: Implement `main`, the writer, the report and the legacy update**, and add the README row (`Never` in the CI column).

- [ ] **Step 4: Run the full suite, then commit**

Run: `npm test`
Expected: all pass. Nothing under `site/content/` or `docs/` changed (`git status`).

```bash
git add scripts tests
git commit -m "Add migration CLI, report and legacy route update"
```

---

### Task 4: First real run

**Files:**
- Delete: `site/content/notices/news-pew-sheets.md`, `safeguarding.md`, `latest-parish-magazine.md`
- Create (by the script): `site/content/blog/*.md`, `site/content/calendar/*.md`, `site/content/notices/*.md`, `site/content/page/*/*.md`, `site/static/uploads/**`, `docs/features/page-cms/page-cms-migration-report.md`
- Modify (by the script): `site/content/_index.md`, `site/data/legacy.yaml`
- Create: `scripts/legacy-dates.csv` (from the maintainer, if provided)

- [ ] **Step 1: Ask the maintainer for `legacy-dates.csv`.** If it is not available this session, run without `--dates` and say so in the hand-off.

- [ ] **Step 2: Run the migration**

Run: `NODE_USE_ENV_PROXY=1 node scripts/migrate.mjs --dates scripts/legacy-dates.csv`
Expected: summary of counts (7 articles, 69 events, 5 notices, 14 pages), downloads, and report path.

- [ ] **Step 3: Check it**

Run: `node scripts/migrate.mjs --dates scripts/legacy-dates.csv --check` (expect exit 0), `npm test`, then `npm run build && node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site` (expect `0 failed`), `grep -rlE 'stpaulswarton\.co\.uk|/Areas/|media\.acny\.uk' site/content` (expect nothing), and check the report's "Unknown topics" table is empty. Check `_site/staticwebapp.config.json` is under 20,480 bytes with the upload routes in.

- [ ] **Step 4: Screenshots** of five pages side by side (home, an article with images, the gallery page, the church diary, an expired event) with `node scripts/screenshots.mjs`, sent to the maintainer.

- [ ] **Step 5: Commit**

```bash
git add -A site docs scripts
git commit -m "Migrate content and images from the live site"
git push -u origin <session branch>
```

Tell the maintainer the review and the policy follow-up are theirs.
