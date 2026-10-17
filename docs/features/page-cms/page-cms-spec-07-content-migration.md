---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 07: content migration

_One session. A re-runnable script extracts every article, event, notice and page from the live site into Markdown with front matter, copies uploads and hot-linked images into the repo, moves embeds into fields, and writes a report for the maintainer and the church. It is run again on cutover day. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

`site/content/` holds the live content at live URLs, every image is local and optimised, and the maintainer has a short report of what needs a human look. Running the script again gives the same files.

## Starting point

- Specs 02 to 06 on `main`. Seed notices from spec 00 (`news-pew-sheets.md`, `safeguarding.md`, `latest-parish-magazine.md`) with invented dates.
- `scripts/check_urls.py` and `tests/fixtures/live-urls.txt` (spec 05). `body.html` turns `/uploads/` images into `<picture>` (spec 06).
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

- `scripts/migrate.py` and its unit tests on saved HTML snapshots in `tests/fixtures/live/`.
- Dates from a maintainer export of the legacy database (`scripts/legacy-dates.csv`), with inferred and flagged fallbacks.
- Running it: migrated content, uploads in `site/static/uploads/`, upload routes appended to `site/data/legacy.yaml`, `docs/features/page-cms/page-cms-migration-report.md`.
- Seed notices from spec 00 removed (their migrated versions replace them).

## Out of scope

Rewording any content. The privacy and cookie policy decisions (cookie policy: spec 09; privacy policy wording: the church, spec 10). Contact form (08).

---

## Requirements

### Output

| Live | File | Front matter written |
|---|---|---|
| `/blog/article/{slug}` | `site/content/blog/{slug}.md` | `title`, `date`, `summary`, `blogtopics`, `image`, `image_alt` (when on the home page) |
| `/calendar/event/{id}/{slug}` | `site/content/calendar/{id}-{slug}.md` | `title`, `date` (start), `end`, `summary`, `location` (when shown), `eventtopics`, `url: /calendar/event/{id}/{slug}` |
| `/notices/notice/{id}/{slug}` | `site/content/notices/{id}-{slug}.md` | `title`, `date`, `summary` (first 300 characters of the plain body), `noticetopics`, `url: /notices/notice/{id}/{slug}` |
| `/page/{type}/{slug}` | `site/content/page/{type}/{slug}.md` | `title`, `header`, `footer`, `weight` (from live menus), `embed`, `embed_src` (when the body had a known iframe) |
| Home hero | `site/content/_index.md` | `lead` only, other keys kept |

Every value is written as a JSON-style double-quoted string, booleans and numbers bare, keys in the order above, so the files are valid YAML with no YAML library and diffs stay stable. Body is HTML, one block element per line, no leading indentation, no blank lines.

`site/content/page/about/contact-us.md`, `_index.md` files and anything the script did not write are never touched.

### Dates

`scripts/legacy-dates.csv`, exported by the maintainer from the legacy database:

```
kind,id,start,end
event,16,2015-12-01T19:30,2015-12-01T21:00
notice,46,2024-03-10T00:00,
```

| Case | Rule | Flagged in report |
|---|---|---|
| Event or notice in the CSV | Use it | No |
| Event not in the CSV | Year from a 4-digit year in its text when there is exactly one, else the year that keeps start dates non-decreasing by id from the nearest earlier anchor | Yes, with the inferred date |
| Notice not in the CSV | A date one day apart per id step, counting back from 2026-10-01, so order matches live | Yes |
| Article | From the `/blog` list | Only if missing |

### Body rewriting

| Found | Becomes |
|---|---|
| Links and images on `http://` or `https://`, with or without `www.`, `stpaulswarton.co.uk` | Root-relative path |
| `/Calendar`, `/Notices`, `/Contact`, `/Blog` (any case) | Lower case |
| `/Areas/st_pauls/Uploads/{path}` (any case, `\` as `/`) | `/uploads/{path with the first folder lower-cased}`, file downloaded to `site/static/uploads/{same}` |
| `/Areas/st_pauls/Content/Image/{path}` | `/uploads/legacy/{path with / as -}`, downloaded |
| `<img>` on `media.acny.uk` or `achurchnearyou.com` | `/uploads/acny/{last path segment}` without query string, downloaded. On a name clash, prefix the first 8 hex characters of the SHA-256 of the URL |
| `<iframe>` on `calendar.google.com` or `embedsocial.com` | Removed from the body; `embed` and `embed_src` set on the page |
| Any other `<iframe>` | Kept, and flagged |
| `<script>`, `on*=` attributes, Disqus or share blocks | Removed, and flagged |
| Trailing `<br>` runs and empty paragraphs | Removed |

Each downloaded upload also gets a `legacy.yaml` rewrite from its exact live path (and the `St_Pauls` spelling) to its new path. Entries are appended once, sorted, under a comment `# uploads (spec 07)`, keeping the existing entries.

### Report (`docs/features/page-cms/page-cms-migration-report.md`)

Front matter and title per the docs conventions. Tables: counts per type; items with inferred dates; failed downloads; iframes kept; removed scripts; files in content folders the script did not write (practice content or Paul's real additions, for the maintainer to keep or delete on cutover day); policy text that no longer applies (any of `Google Analytics`, `Disqus`, `register`, `log in`, `login`, `account`, `subscribe` in a page body, with the page and the sentence).

### CLI

```
python3 scripts/migrate.py [--live http://stpaulswarton.co.uk] [--dates scripts/legacy-dates.csv] [--site site] [--check]
```

| | |
|---|---|
| Default | Fetch, write files, download missing uploads, update `legacy.yaml`, write the report |
| `--check` | Write nothing. Print each file that would change and exit 1 if any would. Used on cutover day before the real run |
| Network | `urllib.request`, a `User-Agent` naming the script, one request at a time, 3 retries with a pause, 30 second timeout |
| Idempotent | A second run with the same live site changes no file |

---

## Manual steps (maintainer)

1. Export `kind,id,start,end` for every event and notice from the legacy database into `scripts/legacy-dates.csv` (CSV, UTF-8, ISO dates). If this cannot be done, say so: the script infers and flags.
2. Review the migrated content diff and `docs/features/page-cms/page-cms-migration-report.md`. Compare a few pages side by side with the screenshots.
3. Pass the policy section of the report to the church (spec 10 follows it up).

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] `python3 scripts/check_urls.py --list tests/fixtures/live-urls.txt --built <build>` reports 0 failed against a build of the migrated content.
- [ ] No content file references `stpaulswarton.co.uk`, `/Areas/`, `media.acny.uk` or `achurchnearyou.com/...` images.
- [ ] `python3 scripts/migrate.py --check` straight after a run reports no changes.
- [ ] Seed notices from spec 00 are gone and their migrated versions exist.
- [ ] The report exists and the maintainer has reviewed it.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tested, re-runnable migration from the live site, and its first real run.

**Architecture:** Pure functions parse saved HTML into plain dicts and rewrite bodies into a list of planned downloads; a thin CLI fetches, calls them, and writes files deterministically. Tests run the functions on trimmed snapshots of real live pages, never on the network.

**Tech Stack:** Python 3 standard library (`html.parser`, `urllib`, `csv`, `hashlib`, `re`, `json`), Hugo for the check build.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Standard library only. Python 3.12 compatible.
- The test suite never touches the network. Snapshots live in `tests/fixtures/live/` and are trimmed to the `<main>` element plus the header and footer navs, with the maintainer's name and links removed.
- Output front matter keys and file names exactly as in the Output table.
- The script never writes outside `--site`, `scripts/legacy-dates.csv` excepted (read only), and `docs/features/page-cms/page-cms-migration-report.md`.

### Review Focus

1. A body with mixed-case and backslash legacy upload paths and an `http://www.` own-domain link in the same paragraph. Expected: all rewritten, each file downloaded once. Pinned by `test_rewrite_legacy_links`.
2. Two hot-linked images with the same file name from different ACNY folders. Expected: distinct local names. Pinned by `test_acny_name_clash`.
3. An event with no year anywhere and no CSV row, between two anchored events. Expected: an inferred year that keeps id order, and a report line. Pinned by `test_infer_event_year`.
4. Re-running after Paul edited a migrated file in Pages CMS during practice. Expected: the live version wins (live is the source of truth until cutover), and `--check` lists the file first. Pinned by `test_check_mode_lists_changes`.
5. A live page body with characters YAML or Hugo dislike: `:`, `#`, quotes, `---` on its own line, `{{`. Expected: front matter still parses and Hugo builds. Pinned by `test_front_matter_escaping` and the build in `test_migrated_fixture_builds`.

---

### Task 1: Snapshots and page parsers

**Files:**
- Create: `tests/fixtures/live/` with `article.html` (`church-roof-completed`), `blog-index.html` (`/blog`), `event.html` (`/calendar/event/16/mu-advent-carol-service`), `notice.html` (`/notices/notice/46/news-pew-sheets`), `page-diary.html` (`/page/about/church-diary`), `page-gallery.html` (`/page/gallery/church-gallery`), `home.html` (`/`)
- Create: `scripts/migrate.py` (parsers only)
- Create: `tests/test_migrate.py`

**Interfaces:**
- Produces in `scripts/migrate.py`:
  - `classify(path: str) -> tuple[str, dict] | None`: `("article", {"slug"})`, `("event", {"id", "slug"})`, `("notice", {"id", "slug"})`, `("page", {"type", "slug"})`, else `None`.
  - `parse_blog_index(html: str) -> dict[str, dict]`: slug to `{"date": date, "topic": str | None}`.
  - `parse_article(html: str) -> dict` with `title`, `summary`, `body`.
  - `parse_event(html: str) -> dict` with `title`, `topic_label`, `start` (`(hour, minute, month, day)`), `end` (same), `summary`, `location`, `body`, `text_years: list[int]`.
  - `parse_notice(html: str) -> dict` with `title`, `topic_label`, `body`.
  - `parse_page(html: str) -> dict` with `title`, `body`.
  - `parse_menus(html: str) -> dict[str, dict]`: page path to `{"header": bool, "footer": bool, "weight": int}`.
  - `parse_home(html: str) -> dict` with `lead`, `cards: dict[str, dict]` (article slug to `{"image", "alt"}`), `notice_order: list[int]`.

- [ ] **Step 1: Save and trim the snapshots** with `curl`, then strip personal details (name, `ste-pam.com`, LinkedIn) from each file.

- [ ] **Step 2: Write the failing tests**

```python
def test_classify(self):
    self.assertEqual(m.classify("/calendar/event/16/mu-advent-carol-service"),
                     ("event", {"id": 16, "slug": "mu-advent-carol-service"}))
    self.assertEqual(m.classify("/page/about/church-diary"), ("page", {"type": "about", "slug": "church-diary"}))
    self.assertIsNone(m.classify("/blog/topic/website"))

def test_blog_index_dates_and_topics(self):
    idx = m.parse_blog_index(snap("blog-index.html"))
    self.assertEqual(idx["st-pauls-churchyard-in-bloom"], {"date": date(2022, 3, 2), "topic": "website"})

def test_event_fields(self):
    e = m.parse_event(snap("event.html"))
    self.assertEqual(e["title"], "MU Advent Carol Service")
    self.assertEqual(e["topic_label"], "Other Events")
    self.assertEqual(e["start"], (19, 30, 12, 1))
    self.assertEqual(e["end"], (21, 0, 12, 1))
    self.assertEqual(e["text_years"], [2015])
    self.assertNotIn("Paul Barfoot", e["body"])

def test_notice_fields(self):
    n = m.parse_notice(snap("notice.html"))
    self.assertEqual(n["title"], "News / Pew Sheets")
    self.assertEqual(n["topic_label"], "Church Services")

def test_menus(self):
    menus = m.parse_menus(snap("home.html"))
    self.assertEqual(menus["/page/groups/church-groups"]["header"], True)
    self.assertEqual(menus["/page/about/privacy-policy"]["footer"], True)
    self.assertLess(menus["/page/about/about-us"]["weight"], menus["/page/about/privacy-policy"]["weight"])

def test_home(self):
    h = m.parse_home(snap("home.html"))
    self.assertEqual(h["lead"], "Serving Christ - Serving the Community")
    self.assertEqual(h["notice_order"][:3], [46, 44, 43])
    self.assertIn("church-roof-completed", h["cards"])
```

- [ ] **Step 3: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_migrate.py' -v`

- [ ] **Step 4: Write the parsers** on `html.parser.HTMLParser`: one small tree builder that keeps raw inner HTML for chosen elements, then per-type functions that pick elements by tag and class. No regex over whole documents except for the date and time text.

- [ ] **Step 5: Run the tests and watch them pass, then commit**

```bash
git add scripts/migrate.py tests
git commit -m "Add live page parsers for the migration script"
```

---

### Task 2: Dates, body rewriting and front matter

**Files:**
- Modify: `scripts/migrate.py`
- Create: `tests/fixtures/live/dates.csv` (three rows: event 16, notice 46, and one event that does not exist on live)
- Modify: `tests/test_migrate.py`

**Interfaces:**
- Produces:
  - `load_dates(path: Path | None) -> dict[tuple[str, int], tuple[datetime, datetime | None]]`.
  - `infer_event_dates(events: list[dict], known: dict) -> dict[int, tuple[datetime, datetime, str]]` (id to start, end, reason).
  - `infer_notice_dates(order: list[int], known: dict) -> dict[int, tuple[datetime, str]]`.
  - `rewrite_body(html: str) -> tuple[str, list[Download], dict | None, list[str]]`: new HTML, planned downloads, embed `{"embed", "embed_src"}` or `None`, report notes.
  - `Download` is a `NamedTuple(url: str, dest: str, legacy_paths: tuple[str, ...])`, `dest` relative to `site/static/`.
  - `front_matter(fields: dict) -> str`: the YAML block with `---` lines.

- [ ] **Step 1: Write the failing tests**

```python
def test_rewrite_legacy_links(self):
    html, dl, embed, notes = m.rewrite_body(
        '<p><a href="http://www.stpaulswarton.co.uk/Areas/st_pauls/Uploads/Gallery\\EasterPoster.jpg">x</a>'
        ' <a href="/Areas/St_Pauls/Uploads/baptism-form.pdf">form</a> <a href="http://stpaulswarton.co.uk/Calendar">c</a></p>')
    self.assertIn('href="/uploads/gallery/EasterPoster.jpg"', html)
    self.assertIn('href="/uploads/baptism-form.pdf"', html)
    self.assertIn('href="/calendar"', html)
    self.assertEqual(sorted(d.dest for d in dl), ["uploads/baptism-form.pdf", "uploads/gallery/EasterPoster.jpg"])

def test_acny_images_are_localised(self):
    html, dl, _, _ = m.rewrite_body('<img src="https://media.acny.uk/media/thumbs/e0/60/e0602c.jpg?h=300&w=350&mode=crop" width="1024">')
    self.assertIn('src="/uploads/acny/e0602c.jpg"', html)
    self.assertEqual(dl[0].url, "https://media.acny.uk/media/thumbs/e0/60/e0602c.jpg")

def test_acny_name_clash(self):
    _, dl, _, _ = m.rewrite_body('<img src="https://media.acny.uk/a/IMG_1.jpg"><img src="https://media.acny.uk/b/IMG_1.jpg">')
    self.assertEqual(len({d.dest for d in dl}), 2)

def test_iframe_becomes_embed(self):
    html, _, embed, _ = m.rewrite_body(snap_body("page-diary.html"))
    self.assertNotIn("<iframe", html)
    self.assertEqual(embed["embed"], "google-calendar")
    self.assertTrue(embed["embed_src"].startswith("https://calendar.google.com/"))

def test_scripts_and_handlers_removed(self):
    html, _, _, notes = m.rewrite_body('<p onclick="x()">a</p><script>alert(1)</script>')
    self.assertEqual(html, "<p>a</p>")
    self.assertTrue(notes)

def test_no_indent_no_blank_lines(self):
    html, _, _, _ = m.rewrite_body("<div>\n    <p>a</p>\n\n    <p>b</p>\n</div><br /><br />")
    self.assertNotRegex(html, r"(?m)^\s+\S")
    self.assertNotIn("\n\n", html)

def test_infer_event_year(self):
    events = [{"id": 10, "start": (19, 0, 11, 1), "end": (20, 0, 11, 1), "text_years": [2018]},
              {"id": 11, "start": (19, 0, 2, 3), "end": (20, 0, 2, 3), "text_years": []},
              {"id": 12, "start": (19, 0, 6, 1), "end": (20, 0, 6, 1), "text_years": [2019]}]
    got = m.infer_event_dates(events, known={})
    self.assertEqual(got[11][0], datetime(2019, 2, 3, 19, 0))
    self.assertIn("inferred", got[11][2])

def test_csv_dates_win(self):
    known = m.load_dates(FIX / "live/dates.csv")
    got = m.infer_event_dates([{"id": 16, "start": (19, 30, 12, 1), "end": (21, 0, 12, 1), "text_years": []}], known)
    self.assertEqual(got[16][0], datetime(2015, 12, 1, 19, 30))

def test_front_matter_escaping(self):
    fm = m.front_matter({"title": 'A: "quoted" # not a comment', "header": True, "weight": 3})
    self.assertEqual(fm, '---\ntitle: "A: \\"quoted\\" # not a comment"\nheader: true\nweight: 3\n---\n')
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_migrate.py' -v`

- [ ] **Step 3: Implement the functions**

`front_matter` uses `json.dumps(value, ensure_ascii=False)` for strings, so the output is valid YAML.

- [ ] **Step 4: Run the tests and watch them pass, then commit**

```bash
git add scripts/migrate.py tests
git commit -m "Add date inference, body rewriting and front matter writer"
```

---

### Task 3: Writer, CLI and report

**Files:**
- Modify: `scripts/migrate.py` (`main`, writer, report, `legacy.yaml` update)
- Modify: `scripts/README.md`
- Modify: `tests/test_migrate.py`

**Interfaces:**
- Produces: `write_site(items: list[dict], site: Path, check: bool) -> list[Path]` (changed files), `update_legacy(path: Path, downloads: list[Download], check: bool) -> bool`, `write_report(path: Path, report: dict) -> None`, `main(argv: list[str] | None = None, fetch=None) -> int` (`fetch` injectable for tests: `Callable[[str], bytes]`).

- [ ] **Step 1: Write the failing tests**

Use a fake `fetch` that serves the snapshots for their paths, a two-line sitemap XML listing them, and fixed bytes for image and PDF URLs. Run `main` into a temp copy of `site/` (copy `site/hugo.toml`, `site/layouts`, `site/assets`, `site/data`, empty `site/content` with the structural `_index.md` files and `contact-us.md`).

```python
def test_writes_expected_files(self):
    self.assertTrue((self.site / "content/calendar/16-mu-advent-carol-service.md").is_file())
    self.assertTrue((self.site / "content/notices/46-news-pew-sheets.md").is_file())
    self.assertTrue((self.site / "content/page/about/church-diary.md").is_file())
    self.assertTrue((self.site / "static/uploads/acny").is_dir())

def test_url_fields(self):
    fm = (self.site / "content/calendar/16-mu-advent-carol-service.md").read_text()
    self.assertIn('url: "/calendar/event/16/mu-advent-carol-service"', fm)

def test_second_run_changes_nothing(self):
    self.assertEqual(m.main(self.argv + ["--check"], fetch=self.fetch), 0)

def test_check_mode_lists_changes(self):
    p = self.site / "content/notices/46-news-pew-sheets.md"
    p.write_text(p.read_text() + "<p>Edited in practice</p>\n")
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        self.assertEqual(m.main(self.argv + ["--check"], fetch=self.fetch), 1)
    self.assertIn("content/notices/46-news-pew-sheets.md", out.getvalue())

def test_legacy_routes_appended(self):
    text = (self.site / "data/legacy.yaml").read_text()
    self.assertIn("# uploads (spec 07)", text)
    self.assertIn("/Areas/st_pauls/Uploads/baptism-form.pdf", text)
    self.assertIn("{ from: /Calendar, to: /calendar/index.html }", text)

def test_untouched_files(self):
    self.assertEqual((self.site / "content/page/about/contact-us.md").read_text(), CONTACT_BEFORE)

def test_report_lists_policy_text_and_inferred_dates(self):
    rep = (self.report).read_text()
    self.assertIn("## Policy text that no longer applies", rep)
    self.assertIn("## Inferred dates", rep)

def test_migrated_fixture_builds(self):
    build_site(self.out, self.site / "content")
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_migrate.py' -v`

- [ ] **Step 3: Implement `main`, the writer, the report and the legacy update**

- [ ] **Step 4: Run the full suite, then commit**

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

Run: `python3 scripts/migrate.py --dates scripts/legacy-dates.csv`
Expected: summary of counts (7 articles, 69 events, 5 notices, 14 pages), downloads, and report path.

- [ ] **Step 3: Check it**

Run: `python3 scripts/migrate.py --dates scripts/legacy-dates.csv --check` (expect exit 0), the full test suite, then a build and `python3 scripts/check_urls.py --list tests/fixtures/live-urls.txt --built <build>` (expect `0 failed`), and `grep -rlE 'stpaulswarton\.co\.uk|/Areas/|media\.acny\.uk' site/content` (expect nothing).

- [ ] **Step 4: Screenshots** of five pages side by side (home, an article with images, the gallery page, the church diary, an expired event) with `scripts/screenshots.py`, sent to the maintainer.

- [ ] **Step 5: Commit and push**

```bash
git add -A site docs scripts
git commit -m "Migrate content and images from the live site"
git push -u origin <session branch>
```

Tell the maintainer the review and the policy follow-up are theirs.
