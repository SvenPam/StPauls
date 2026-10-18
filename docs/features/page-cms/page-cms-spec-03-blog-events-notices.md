---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: done
---

# Spec 03: blog, events and notices

_One session. Builds the three dated sections on the new shell: blog articles, calendar events and notices, with topic listings, RSS feeds, live URL patterns, a nightly rebuild, and Pages CMS collections for each. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Built in Hugo, ported to Eleventy on 2026-10-18, see [the switch plan](page-cms-plan-eleventy-switch.md)._

---

## Goal

Blog, calendar and notices work like live, at live URL patterns, editable in Pages CMS. Past events drop off the calendar on their own.

## Starting point

- Spec 02 shell on `main`: `baseof.html`, `href.html`, `menu-items.html`, `footer-groups.html`, `picture.html`, card classes, `.prose`, `site.js`.
- Notices exist at `/notices/{name}`. `hugo.toml` disables `rss`, `sitemap`, `taxonomy` and `term`.
- `.pages.yml` has one collection (`notices`), rich text in the default Markdown format, no `settings`.
- Live structure (fetch with `curl` to compare):

| Live page | Shows |
|---|---|
| `/blog` | Heading "St. Pauls Blog". Each article: title link, "Published 02-Mar-22", topic link, then the body. Aside: "Blog Topics" (the four topics) and "Latest" (7 newest) |
| `/blog/article/{slug}` | Title, summary as a lead paragraph, body, same aside |
| `/blog/topic/{topic}` | As `/blog`, filtered |
| `/calendar` | Heading "Upcoming Events", event cards, or "Could not find any events." |
| `/calendar/event/{id}/{slug}` | Title, topic, status (Expired, Active, Soon, Future), start and end as time, month, day, then summary as lead and the body |
| `/notices` | Heading "Notices", a card per notice with its summary |
| `/notices/notice/{id}/{slug}` | Title, date, location, body |

## In scope

- Taxonomies `blogtopics`, `eventtopics`, `noticetopics` with live term URLs, and `site/data/topics.yaml`.
- Permalinks for new items: `/blog/article/{name}`, `/calendar/event/{name}`, `/notices/notice/{name}`. Migrated items keep live URLs through a hidden `url` field (spec 07 fills it in).
- Templates: blog list and article, calendar list and event, notices (updated), one term template, RSS.
- Partials `body.html`, `date.html`, `event-status.html`, `card.html`.
- Expired events hidden by `site.js` as well as at build time, and a nightly build.
- Pages CMS: `settings.content.merge: true`, `blog` and `events` collections, `notices` updated, every rich text field `format: html`.
- Fixtures and tests for all of it.

## Out of scope

Home page, pages, contact page, computed menus (spec 04). Trailing slash rule, sitemap, legacy redirects (05). Images from `/uploads/` as `<picture>` (06). Migrated content (07).

---

## Requirements

### Content model

| Key | Article | Event | Notice | Pages CMS |
|---|---|---|---|---|
| `title` | required | required | required | `string`, required |
| `date` | publish date | start date and time | publish date | `date`. Event: `time: true`, `format: yyyy-MM-dd'T'HH:mm:ss` (Hugo cannot read a front matter date without seconds), label "Starts" |
| `end` | | required | | `date`, `time: true`, same format, label "Ends" |
| `summary` | optional | optional | optional | `string` |
| `location` | | optional | optional | `string` |
| `image`, `image_alt` | optional | optional | | `image`, `string` (label "Image description") |
| topic | `blogtopics` | `eventtopics` | `noticetopics` | `select`, values from `topics.yaml` as `{ name, label }`, label "Topic", optional |
| `url` | migrated only | migrated only | migrated only | `string`, `hidden: true` |
| body | required | required | required | `rich-text`, `format: html` |

Times are Europe/London (`timeZone` in `hugo.toml`). An event with no `end` falls back to its start.

### Pages CMS

| Collection | `path` | `filename` | `view.fields` | `view.default` | `operations` |
|---|---|---|---|---|---|
| `blog`, label "Blog" | `site/content/blog` | `{year}-{month}-{day}-{primary}.md` | `title`, `date` | `date` desc | `rename: false` |
| `events`, label "Events" | `site/content/calendar` | same | `title`, `date`, `end` | `date` desc | `rename: false` |
| `notices`, label "Notices" | `site/content/notices` | same | `title`, `date` | `date` desc | `rename: false` |

All three `exclude: [_index.md]`. Top level `settings: { content: { merge: true } }`. Title field `pattern: { regex: "^(?![Ii]ndex$).+", message: "Pick another title" }`.

### URLs and taxonomies

| | `hugo.toml` |
|---|---|
| Taxonomies | `blogtopic = 'blogtopics'`, `eventtopic = 'eventtopics'`, `noticetopic = 'noticetopics'` |
| Page permalinks | `blog = '/blog/article/:slugorcontentbasename/'`, `calendar = '/calendar/event/:slugorcontentbasename/'`, `notices = '/notices/notice/:slugorcontentbasename/'` |
| Term permalinks | `blogtopics = '/blog/topic/:slug/'`, `eventtopics = '/calendar/topic/:slug/'`, `noticetopics = '/notices/topic/:slug/'` |
| Taxonomy permalinks | `/blog/topic/`, `/calendar/topic/`, `/notices/topic/` (a plain list of the four topics) |
| Outputs | `home = ['html']`, `section = ['html', 'rss']`, `taxonomy = ['html']`, `term = ['html']`, `page = ['html']` |
| `disableKinds` | `['sitemap']` until spec 05 |

### Templates

| Template | Requirements |
|---|---|
| `blog/section.html` | Heading "St. Pauls Blog". Newest first. Each article: title link, "Published {date}", topic link, image via `picture.html` when set, summary, "Read more" link. Aside partial. _Builder's call:_ summaries rather than full bodies, so the list stays light now that pages carry real images |
| `blog/page.html` | Title (h1), "Published {date}", topic link, summary as `.lead`, image, body in `.prose`, aside |
| `_partials/blog-aside.html` | "Blog Topics": the four topics linking to their term pages. "Latest": the 7 newest articles, newest first (fixes the 2019 port's oldest-first bug) |
| `calendar/section.html` | Heading "Upcoming Events". Events whose end is after build time, soonest first, as cards with status, date, time and location. Each card has `data-end` (RFC 3339). Message "Could not find any events." present in the page, `hidden` when there are cards |
| `calendar/page.html` | Title, topic, status label, Start and End (time `3:04 PM`, month name, day number), location, summary as `.lead`, body in `.prose`. Expired events still render |
| `notices/section.html`, `notices/page.html` | As spec 02, plus a topic link when set |
| `term.html` | One template for all three taxonomies. Heading from the section ("St. Pauls Blog", "Upcoming Events" or "Notices") and topic label. Pages as cards, same order as their section. Calendar terms show upcoming events only |
| `taxonomy.html` | Heading "Topics" and the four topic links |
| `rss.xml` | RSS 2.0 for each section. Item: title, absolute link without trailing slash, `pubDate`, description from `summary` or else the first 300 characters of the plain body. 20 items. Events: upcoming only. No RSS on home or `page` |

### Partials

| Partial | Contract |
|---|---|
| `body.html` | Takes a page. Returns `.RawContent` as `safeHTML`. Nothing else in this spec. Spec 06 adds image rewriting |
| `date.html` | Takes a `time.Time`. Returns `02-Jan-06` |
| `event-status.html` | Takes an event page. With `now` at build time: `Expired` when end is before now, `Active` when start is at or before now and end is after, `Soon` when start is within 7 days, else `Future` |
| `card.html` | Takes a page. Outputs `<article class="card">` with `card__title` link, date (events: start), status (events), location, summary, topic. Used by lists and term pages |

### Expired events

| | |
|---|---|
| Build time | Listings and term pages skip events whose `end` is before build time |
| Nightly | `.github/workflows/deploy.yml` gains `schedule: - cron: '17 3 * * *'`, so listings are rebuilt every night at 03:17 UTC |
| In the browser | `site.js` hides any `.card[data-end]` inside `.event-list` whose `data-end` is in the past, and un-hides the "Could not find any events." message when none are left. This keeps the calendar right even if GitHub pauses the schedule (it does so after 60 days without repository activity on public repositories) |

---

## Manual steps (maintainer)

1. After merge, open Pages CMS and check the Blog, Events and Notices collections appear, a new blog article can be created with a topic, and an event with start and end times saves and shows on the calendar.

---

## Acceptance

- [x] `npm test` in `tests/` passes.
- [x] Fixture articles, events and notices render at `/blog/article/{name}`, `/calendar/event/{name}`, `/notices/notice/{name}`, and a fixture with `url` renders at that URL.
- [x] Term pages exist at `/blog/topic/{topic}`, `/calendar/topic/{topic}`, `/notices/topic/{topic}` with topic labels.
- [x] Past events are absent from `/calendar` and its RSS, present at their own URLs, and labelled Expired.
- [x] RSS feeds at `/blog/index.xml`, `/calendar/index.xml`, `/notices/index.xml` are valid XML.
- [x] `actionlint` passes on the workflow.
- [x] Pages CMS shows the three collections after merge (maintainer).

The plan below was built with Python `unittest`. On 2026-10-18 the tests were rewritten as Playwright scenarios in `tests/features/`, which also found and fixed a menu bug: on a phone, with one dropdown open, tapping another did nothing.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blog, calendar and notices at live URL patterns, with topics, feeds, self-expiring events and Pages CMS collections.

**Architecture:** One Hugo section per type with its own taxonomy, so each type gets its own `/topic/` URLs. Shared partials format dates, compute event status and render cards, so lists and term pages stay consistent. Bodies bypass Goldmark through `body.html`. Event expiry happens at build time, nightly, and in the browser as a safety net.

**Tech Stack:** Hugo extended 0.167.0, Pages CMS config, GitHub Actions, Python 3 `unittest`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Front matter keys, taxonomy names, partial names and Pages CMS collection names exactly as in this spec and the site contract.
- Dates shown as `02-Jan-06`. Event times as `3:04 PM`.
- Tests that depend on "now" use fixture dates far in the past (`2015-...`) or far in the future (`2099-...`), never near today.

### Review Focus

1. Paul enters an event that ends after midnight, or with the end before the start. Expected: shown until its end, and an end before the start is treated as the start. Pinned by `test_end_before_start_uses_start`.
2. Paul saves a migrated event in Pages CMS and its hidden `url` disappears, so the live URL breaks. Pinned by `test_merge_keeps_unknown_keys` and `test_url_field_is_hidden` in the CMS config tests.
3. A topic typed by hand that is not one of the four, or no topic at all. Expected: the item renders with no topic link and no error. Pinned by `test_missing_or_unknown_topic`.
4. All events in the past: calendar says "Could not find any events." and its RSS has no items, but each event page still works. Pinned by `test_past_events_drop_off`.
5. An article titled "Index" overwrites the section index. Pinned by `test_title_pattern_blocks_index` (CMS config) and the dated filename.

---

### Task 1: Taxonomies, permalinks and shared partials

**Files:**
- Modify: `site/hugo.toml`
- Create: `site/data/topics.yaml`
- Create: `site/layouts/_partials/body.html`, `date.html`, `event-status.html`, `card.html`
- Create: `site/layouts/term.html`, `site/layouts/taxonomy.html`
- Modify: `site/layouts/notices/section.html`, `site/layouts/notices/page.html` (use the partials, topic link)
- Create: `tests/fixtures/content/notices/migrated.md` (`title: Fixture migrated`, `date: 2016-01-01`, `url: /notices/notice/46/news-pew-sheets`, `noticetopics: website`)
- Modify: `tests/fixtures/content/notices/newer.md` (`noticetopics: church-events`)
- Modify: `tests/test_notices.py`

**Interfaces:**
- Produces: the four partials as in the spec, the taxonomies and permalinks as in the URLs table, `site.Data.topics` as a map of slug to label.
- Consumes: `href.html`, `picture.html`, card classes (spec 02).

- [ ] **Step 1: Write the failing tests in `tests/test_notices.py`**

```python
def test_live_url_pattern(self):
    self.assertTrue((self.out / "notices/notice/newer/index.html").is_file())
    self.assertIn('href="/notices/notice/newer"', self.list)

def test_migrated_url_is_kept(self):
    self.assertTrue((self.out / "notices/notice/46/news-pew-sheets/index.html").is_file())

def test_topic_term_page(self):
    term = (self.out / "notices/topic/church-events/index.html").read_text()
    self.assertIn("Church Events", term)
    self.assertIn('href="/notices/notice/newer"', term)
    self.assertNotIn("Fixture older", term)

def test_topic_link_on_notice(self):
    self.assertIn('href="/notices/topic/church-events"', self.newer)

def test_body_bypasses_goldmark(self):
    # Indented HTML after a blank line is a code block under Goldmark.
    self.assertNotIn("<pre><code>&lt;", self.newer)

def test_missing_or_unknown_topic(self):
    self.assertNotIn("/notices/topic/", self.older)
```

Read paths change to `notices/notice/newer/index.html` and so on. Add to `newer.md` body, after a blank line, an indented `    <p>Indented after blank</p>` so `test_body_bypasses_goldmark` bites.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_notices.py' -v`
Expected: path and URL assertions fail.

- [ ] **Step 3: Update `hugo.toml`, write `topics.yaml`, the partials, `term.html`, `taxonomy.html`, and the notices templates**

`event-status.html` and `card.html` are written here so Task 3 only adds event templates. Unknown topic slugs are skipped silently: `with index site.Data.topics $slug`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add topic taxonomies, live notice URLs and shared partials"
```

---

### Task 2: Blog

**Files:**
- Create: `site/content/blog/_index.md` (`title: St. Pauls Blog`)
- Create: `site/layouts/blog/section.html`, `site/layouts/blog/page.html`, `site/layouts/_partials/blog-aside.html`
- Create: `tests/fixtures/content/blog/_index.md` and eight articles `a1.md` to `a8.md` (titles `Fixture article 1` to `Fixture article 8`, dates 2015-01-01 to 2015-08-01, one a month; `a8` has `blogtopics: website`, `summary`, `image: images/map.png`, `image_alt: Map`; `a1` has `url: /blog/article/st-pauls-churchyard-in-bloom`)
- Create: `tests/test_blog.py`

**Interfaces:**
- Consumes: Task 1 partials, `picture.html`.
- Produces: `blog-aside.html` (takes site).

`image: images/map.png` resolves as an asset until spec 06 mounts uploads. Spec 06 changes the fixture to an uploads fixture.

- [ ] **Step 1: Write the failing tests in `tests/test_blog.py`**

```python
def test_list_newest_first_with_summaries(self):
    i = [self.list.index(f"Fixture article {n}") for n in (8, 7, 1)]
    self.assertEqual(i, sorted(i))
    self.assertIn("Published 01-Aug-15", self.list)
    self.assertIn('href="/blog/article/a8"', self.list)

def test_aside_latest_is_seven_newest_first(self):
    aside = self.a8.split('class="blog-aside"', 1)[1]
    titles = re.findall(r"Fixture article (\d)", aside)
    self.assertEqual(titles, ["8", "7", "6", "5", "4", "3", "2"])

def test_aside_topics(self):
    for slug, label in [("website", "Website"), ("church-services", "Church Services"),
                        ("church-events", "Church Events"), ("other-events", "Other Events")]:
        self.assertIn(f'href="/blog/topic/{slug}">{label}<', self.a8)

def test_article_image_is_picture(self):
    self.assertIn("<picture>", self.a8)
    self.assertIn('alt="Map"', self.a8)

def test_migrated_article_url(self):
    self.assertTrue((self.out / "blog/article/st-pauls-churchyard-in-bloom/index.html").is_file())

def test_rss(self):
    rss = ET.fromstring((self.out / "blog/index.xml").read_bytes())
    links = [i.findtext("link") for i in rss.iter("item")]
    self.assertEqual(len(links), 8)
    self.assertTrue(all(not l.endswith("/") for l in links))
    self.assertFalse((self.out / "index.xml").exists())
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_blog.py' -v`
Expected: errors on missing files.

- [ ] **Step 3: Write the blog templates and `rss.xml`**

`rss.xml` lives at `site/layouts/rss.xml`. Absolute links come from `.Permalink` through `href.html`. `baseURL` is still `/` until spec 05, so the test checks only the trailing slash.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add blog list, article pages, aside and feed"
```

---

### Task 3: Calendar and expiring events

**Files:**
- Create: `site/content/calendar/_index.md` (`title: Upcoming Events`)
- Create: `site/layouts/calendar/section.html`, `site/layouts/calendar/page.html`
- Modify: `site/assets/js/site.js` (hide expired cards)
- Modify: `.github/workflows/deploy.yml` (schedule)
- Create: `tests/fixtures/content/calendar/_index.md`, `past.md` (2015-12-01 19:30 to 21:00, `eventtopics: other-events`, `url: /calendar/event/16/mu-advent-carol-service`), `future.md` (2099-06-01 10:00 to 12:00, `location: Church Hall`), `later.md` (2099-07-01 10:00 to 11:00), `backwards.md` (start 2099-08-01 10:00, end 2099-07-31 10:00). Titles are `Fixture past`, `Fixture future`, `Fixture later`, `Fixture backwards`
- Create: `tests/fixtures/empty/calendar/_index.md`
- Create: `tests/test_calendar.py`
- Modify: `tests/test_workflow.py`

**Interfaces:**
- Consumes: `event-status.html`, `card.html`, `date.html` (Task 1).
- Produces: `.event-list` container and `data-end` attributes, which `site.js` relies on.

- [ ] **Step 1: Write the failing tests**

`tests/test_calendar.py`:

```python
def test_past_events_drop_off(self):
    self.assertNotIn("Fixture past", self.list)
    self.assertTrue((self.out / "calendar/event/16/mu-advent-carol-service/index.html").is_file())
    self.assertIn(">Expired<", self.past)

def test_upcoming_soonest_first(self):
    i = [self.list.index(t) for t in ("Fixture future", "Fixture later")]
    self.assertEqual(i, sorted(i))

def test_cards_carry_end_for_script(self):
    self.assertRegex(self.list, r'class="card"[^>]*data-end="2099-06-01T12:00:00\+01:00"')
    self.assertIn('class="event-list"', self.list)

def test_empty_message_hidden_when_events(self):
    self.assertRegex(self.list, r"<p[^>]*hidden[^>]*>Could not find any events\.</p>")

def test_event_page_times(self):
    self.assertIn("10:00 AM", self.future)
    self.assertIn("12:00 PM", self.future)
    self.assertIn("June", self.future)
    self.assertIn("Church Hall", self.future)

def test_end_before_start_uses_start(self):
    page = (self.out / "calendar/event/backwards/index.html").read_text()
    self.assertIn("10:00 AM", page)
    self.assertIn("backwards", self.list.lower())

def test_rss_upcoming_only(self):
    rss = ET.fromstring((self.out / "calendar/index.xml").read_bytes())
    titles = [i.findtext("title") for i in rss.iter("item")]
    self.assertNotIn("Fixture past", titles)

# EmptyCalendarTests
def test_no_events_message_shown(self):
    self.assertRegex(self.list, r"<p>Could not find any events\.</p>")
```

In `tests/test_workflow.py`:

```python
def test_nightly_rebuild(self):
    self.assertIn("schedule:", WF)
    self.assertIn("- cron: '17 3 * * *'", WF)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_calendar.py' -v` and `-p 'test_workflow.py'`

- [ ] **Step 3: Write the calendar templates, extend `site.js`, add the schedule**

`site.js` addition: on `DOMContentLoaded`, for each `.event-list .card[data-end]`, hide it when `Date.parse(dataset.end) < Date.now()`. If none are visible, remove `hidden` from the empty message. Keep the whole script under 2,048 bytes (spec 02 test).

- [ ] **Step 4: Run tests and `actionlint`**

Run: `python3 -m unittest discover -s tests -v` and `actionlint .github/workflows/deploy.yml`
Expected: all pass, no actionlint output.

- [ ] **Step 5: Commit**

```bash
git add site tests .github
git commit -m "Add calendar with self-expiring events and nightly rebuild"
```

---

### Task 4: Pages CMS collections

**Files:**
- Modify: `.pages.yml`
- Modify: `tests/test_cms_config.py`

**Interfaces:**
- Consumes: front matter keys from Tasks 1 to 3.
- Produces: collections `blog`, `events`, `notices` as in the Pages CMS table. Spec 04 adds pages and home; spec 10 polishes labels and groups.

- [ ] **Step 1: Write the failing tests**

Split `CFG` into collection blocks with `re.split(r"(?m)^  - name: ", CFG)` and look each up by name.

```python
def test_merge_keeps_unknown_keys(self):
    self.assertRegex(CFG, r"(?m)^settings:\n  content:\n    merge: true$")

def test_collections_and_paths(self):
    for name, path in [("blog", "site/content/blog"), ("events", "site/content/calendar"),
                       ("notices", "site/content/notices")]:
        self.assertIn(f"path: {path}", block(name))
        self.assertIn('filename: "{year}-{month}-{day}-{primary}.md"', block(name))
        self.assertIn("exclude: [_index.md]", block(name))
        self.assertRegex(block(name), r"operations:\n\s+rename: false")

def test_rich_text_is_html(self):
    self.assertEqual(CFG.count("type: rich-text"), CFG.count("format: html"))

def test_url_field_is_hidden(self):
    for name in ("blog", "events", "notices"):
        self.assertRegex(block(name), r"- name: url\n\s+type: string\n\s+hidden: true")

def test_event_times(self):
    b = block("events")
    self.assertEqual(b.count("time: true"), 2)
    self.assertEqual(b.count("format: yyyy-MM-dd'T'HH:mm:ss"), 2)

def test_topic_values_match_data(self):
    slugs = re.findall(r"(?m)^([a-z-]+):", (REPO / "site/data/topics.yaml").read_text())
    for name, key in [("blog", "blogtopics"), ("events", "eventtopics"), ("notices", "noticetopics")]:
        b = block(name)
        self.assertIn(f"- name: {key}", b)
        for s in slugs:
            self.assertIn(f"name: {s}", b)

def test_title_pattern_blocks_index(self):
    self.assertEqual(CFG.count('regex: "^(?![Ii]ndex$).+"'), 3)
```

Update `test_field_names_match_content_model` to the full set of names now in the file.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_cms_config.py' -v`

- [ ] **Step 3: Write `.pages.yml`**

Keep `media` as it is.

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass.

- [ ] **Step 5: Commit and push**

```bash
git add .pages.yml tests
git commit -m "Add blog and events to Pages CMS and keep hidden fields on save"
git push -u origin <session branch>
```

Tell the maintainer the manual check above is theirs after merge.
