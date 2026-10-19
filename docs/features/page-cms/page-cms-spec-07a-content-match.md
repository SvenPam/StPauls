---
date: 2026-10-19
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 07a: content match and Markdown bodies

_One session, before spec 11. The migration takes event and notice dates and event locations from the maintainer's SQL export of the live database, and writes every body as plain Markdown with no HTML. Pages CMS and Eleventy switch to Markdown bodies. Closes "Deferred: content match" in [spec 07](page-cms-spec-07-content-migration.md). See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

Every event and notice shows the date it has in the live database, events show their location, and Paul opens every body in Pages CMS as plain Markdown with no HTML in it. Editing is simpler for Paul; looking exactly like live comes second.

## Why

| Decision | Who, when |
|---|---|
| Pure Markdown bodies. Simple editing for Paul comes before looking like live. Jump menus, image widths and centring may go | Maintainer, 2026-10-19 |
| Content is not corrected. The maintainer is not the author: broken links, wrong years in text and typos are migrated as written | Maintainer, 2026-10-19 |
| The SQL export replaces `scripts/legacy-dates.csv` | Builder's call, agreed in principle 2026-10-19 (the CSVs already hold every field the dates file was meant to) |
| Notices follow their real dates, even where that changes live's order (44 Safeguarding now lists above 46 News / Pew Sheets) | Maintainer, 2026-10-19 |

## Starting point

- Spec 07 on `main`: `scripts/migrate.mjs` crawls live, rewrites HTML bodies with cheerio, infers dates and flags them in `docs/features/page-cms/page-cms-migration-report.md`. `--dates scripts/legacy-dates.csv` exists but was never given a file.
- `config/content.js` registers `md` raw (`addExtension('md', { compile: (body) => () => body })`): no Markdown, no Nunjucks.
- `.pages.yml`: every `body` is `rich-text` with `format: html`. Conventions: "Rich text fields use `format: html`".
- `config/images.js` (`images` transform) and `config/links.js` (`noopener` transform) work on the output HTML, so they keep working whatever renders the body.
- `excerpt` (feeds, notice summaries) reads `templateContent`, which becomes rendered HTML.
- Scenarios in `tests/features/notices.feature` pin raw-HTML behaviour: `I see "*stars*"`, `the body shows "Indented after blank" as text, not code`, `the body has a list item "Item one"`, template syntax shown as written. Fixture bodies in `tests/fixtures/content/` are HTML.
- Eleventy 3.1.6 already depends on `markdown-it` (14.3.3 in the lock file).

### The SQL export (`docs/features/migration/data/`, committed 2026-10-19, deleted after the run the same day)

| File | Rows | Columns used |
|---|---|---|
| `events.csv` | 69 | `EventID`, `StartDate`, `EndDate`, `Location`, `HTML` |
| `notices.csv` | 40 (5 on the site, 35 expired) | `NoticeID`, `StartDate`, `Location` |
| `articles.csv` | 7 | `ArticleID`, `TimeStamp`, `HTML` |
| `pages.csv` | 16 (14 visible, 13 and 17 `IsHidden`) | `PageID`, `HTML` |
| `groups.csv` | 5 | Not used |

CSV with a header row, UTF-8 with BOM, `NULL` for empty, dates as `yyyy-MM-dd HH:mm:ss.fff`, bodies quoted with embedded newlines. Times are London wall-clock times: the 35 events whose year was already right match live to the minute.

Compared with the migrated files on 2026-10-19:

| Check | Result |
|---|---|
| Event ids in the export and on the site | Same 69 |
| Event start and end | 35 match, 34 have the wrong year (inferred), times all match |
| Event locations | 68 of 69 set in the export, none on the site |
| Notice dates | All 5 on the site are invented (2026-09-23 to 2026-10-01). The export has the real start dates (2021-11-04, 2021-12-30, 2023-02-20, 2026-02-21, 2023-11-29) |
| Article dates | All 7 match |
| Body text, tags removed | Identical for all 69 events and 7 articles |
| End before start, missing start | None |

So bodies keep coming from live (it is the source of truth until cutover), and the export supplies only dates and locations.

### HTML in the bodies today

Counted across the export on 2026-10-19. `pa` page, `ar` article, `ev` event, `no` notice, followed by the id.

| HTML | Where | Count |
|---|---|---|
| `<p>`, `<a href>`, `<strong>`, `<em>`, `<h2>` to `<h4>`, `<ul>`/`<li>` | Everywhere | Common |
| `<br>` | Many events and notices, `pa2`, `pa18` | 70 |
| `<img>` with `width` (35) and `height` (24), inside `<p style="text-align:center">` (25) | `ar1068` and most articles, 15 events, `pa4`, `pa5`, `pa14` | 37 |
| Image wrapped in a link | Several articles and events. `ev30` has an `onclick` pop-up | |
| `<figure class="image">` with `<figcaption>`, in `<div style="text-align:center">` | `ar1071` | 1 |
| Jump menus: `<a id name>` targets and `href="#..."` links | `pa4`, `pa5` (one id with a space, `Little People`), `pa7`, `pa13`, `pa17` (links to targets that do not exist), `pa19` | 34 targets |
| `<table>` with `style="width:800px"` / `900px` | `pa12` Contact List (text), `pa14` Website Pictures (images) | 2 |
| `<iframe>` | `pa6`, `pa16`. Already moved to `embed` and `embed_src` by spec 07 | 2 |
| `<sup>` (ordinals: 27`<sup>`th`</sup>`) | `ev27`, `ev33`, `ev53`, `ev1058`, `ev1059`, `ev2075`, `ev2077` | 7 |
| `<u>` | `pa18` | 4 |
| `style` on links (pasted colours and fonts) | `pa5` and others | 35 |
| `<span dir>` | `pa5` | 4 |
| Empty `<p>&nbsp;</p>` spacers, `&nbsp;` between words | Everywhere | |

Text that Markdown would misread once the tags are gone:

| Text | Where | Would become |
|---|---|---|
| `*********` banners | `ar1095`, `ev9`, `no29`, `no33`, `no34` | Bold, italics or a rule |
| `1)` / `1.` at the start of a paragraph | `ar1095`, `ev9` | A numbered list |
| Literal `[` and `]` around links (`[ Sunday ] - [ Wednesday ]`) | `pa4`, `pa5`, `pa7`, `pa13`, `pa17` | Link syntax |
| `_` inside words | `no39`, `no45` | Safe in markdown-it (no emphasis inside words), escaped anyway |
| Bare URLs | `ar1068`, `ar1071`, `ar1097`, `pa19` | Stay text (no linkify), as on live |

## In scope

- `scripts/migrate.mjs`: read the SQL export for dates and locations; convert bodies to Markdown.
- `config/content.js`: render bodies as Markdown.
- `.pages.yml`: `format: markdown` for every `body`.
- One CSS rule for images on their own line.
- Fixtures, scenarios and unit tests for the above.
- Conventions, spec 07 and `CLAUDE.md` updated to match.
- A re-run of the migration on the real content, and the report.

## Out of scope

- Correcting content: broken links (Contact List's split email links, `pa17`'s jump links), wrong years in text (`ev1062` says "Christmas 2018"), typos. Migrated as written.
- Expired notices (35) and hidden pages (13, 17): not on live, not migrated, as in spec 07.
- `groups.csv`, `IncludeSocial`, `IncludeComments`, author and editor ids.
- Notice expiry dates. Live hides expired notices; the 5 current ones have none.
- Taking bodies from the export instead of live.

---

## Requirements

### Dates and locations from the export

```
node scripts/migrate.mjs [--live http://stpaulswarton.co.uk] [--db docs/features/migration/data] [--site site] [--check]
```

`--db` replaces `--dates`. Default `docs/features/migration/data`. The script reads `events.csv` and `notices.csv` from it. The export was deleted once its dates were written (maintainer, 2026-10-19), so a re-run keeps the dates and locations already in the migrated files (`loadWritten`), and only items new on live are inferred and flagged.

| Field written | From | Format |
|---|---|---|
| Event `date` | `StartDate` | `yyyy-MM-dd'T'HH:mm:ss`, milliseconds dropped |
| Event `end` | `EndDate` | Same. Left out when `NULL` |
| Event `location` | `Location` | Trimmed. Left out when `NULL` or blank |
| Notice `date` | `StartDate` | `yyyy-MM-dd` |
| Notice `location` | `Location` | As for events |

| Case | Rule | Flagged in report |
|---|---|---|
| Item in the export | Use it | No |
| Item already migrated, not in the export | Keep the date, end and location in its file | No |
| Item new on live | Spec 07 inference | Yes, as now |
| Row in the export, not on live | Ignored | No |

The CSV reader handles the BOM, quoted fields with commas, doubled quotes and newlines, and `NULL`. `scripts/legacy-dates.csv` and `loadDates` go; spec 07's dates table in conventions and its manual step 1 are updated.

### Body conversion to Markdown

`rewriteBody` keeps its link, upload and image rewriting (spec 07), then converts the cleaned HTML to Markdown. The output contains no HTML tags at all. The Markdown is CommonMark as markdown-it reads it, with these choices:

| Found | Becomes |
|---|---|
| `<p>` | Paragraph, one blank line between blocks |
| `<h2>` to `<h4>` | `##` to `####` |
| `<strong>` / `<b>`, `<em>` / `<i>` | `**text**`, `*text*`. Empty or whitespace-only emphasis dropped |
| `<a href>` | `[text](href)`. `mailto:` and `tel:` kept. `target`, `style`, `title`, `id` and every other attribute dropped. Adjacent links stay adjacent, as written (Contact List keeps its split email links) |
| `<a href="#...">` (jump menu link) | Its text, no link |
| `<a id>` / `<a name>` with no `href` (jump target) | Its contents only |
| `<img>` | `![alt](src)`. `width`, `height`, `style` dropped. An empty `alt` stays empty |
| Link wrapping only an image, to an image file (click to enlarge) | `![alt](href)`: the bigger file, no link. The site makes responsive copies anyway (maintainer, 2026-10-19: simpler for Paul) |
| Link wrapping only an image, to anything else | `[![alt](src)](href)`. `onclick` dropped and flagged, as in spec 07 |
| `<figure>` with `<figcaption>` | The image on its own line, then the caption as a paragraph |
| `<ul>`/`<ol>`/`<li>` | `-` / `1.` lists |
| `<br>` | Ends the paragraph: the text after it starts a new paragraph. No hard-break syntax. Trailing `<br>` runs dropped |
| `<sup>`, `<u>`, `<span>`, `<div>`, `<font>`, `<center>` | Their contents only |
| `style`, `class`, `align`, `dir` anywhere | Dropped |
| `<table>` of text, one line per cell | GFM pipe table. Rows where every cell is empty or `&nbsp;` dropped. The header row from `<thead>`, or the first row |
| `<table>` with an image, a list or several paragraphs in a cell | Each cell's contents in reading order (row by row), as paragraphs and images, no table |
| A paragraph of three or more asterisks only | `---`, a divider (maintainer, 2026-10-19) |
| A paragraph starting with three or more asterisks (`********* Cancelled *********`) | The text between them in bold (maintainer, 2026-10-19) |
| `&nbsp;` | A space. Runs of spaces collapse to one. Paragraphs that are then empty are dropped |
| Entities (`&#39;`, `&rsquo;`, `&pound;`) | The character |
| Anything not listed | Not converted: the item is written as it is today (HTML) and listed in the report under "Bodies left as HTML", so nothing is lost silently |

Escaping: only what Markdown would read as markup gets a `\`, so Paul sees as few backslashes as possible (maintainer, 2026-10-19):

| Text | Escaped | Left alone |
|---|---|---|
| Start of a paragraph | `# ` to `###### ` (a space after), `>`, `- ` and `+ `, a number of up to 9 digits followed by `. ` or `) `, `---`, `~~~` | `7.30 pm`, `#PrayForTheRoof`, `+44` |
| Anywhere | `*`, `` ` ``, `\`, `_` at a word edge, `]` before `(`, `[` or `:`, `<` before a letter, `/`, `!` or `?`, `&` before an entity, `~~` | `a_b_c`, `[ Sunday ]`, `3 < 4`, `Tea & cake` |
| A table cell | `\|` | |

URLs with spaces or parentheses are written `<url>` inside the link (`[text](<url with space>)`).

The report gets one more table, "Bodies left as HTML", with the item and the tag that stopped it. It is expected to be empty after the real run.

### Rendering (`config/content.js`)

| Requirement | Why |
|---|---|
| `md` files render with Eleventy's own markdown-it (`amendLibrary`, no direct dependency), CommonMark plus tables, `html: true` (Eleventy's default), `linkify: false`, `typographer: false`, `breaks: false` | `html: true` is a safety net for anything Pages CMS writes as HTML; migrated content has none |
| Indented code blocks are off (`md.disable('code')`); fenced code stays | Paul indenting a line must never turn it into a code box |
| No template engine runs on bodies (`markdownTemplateEngine: false` in `eleventy.config.js`) | `{{` and `{%` in a body stay as written (existing scenario) |
| The `images` and `noopener` transforms keep working on the rendered HTML | Pictures and `rel="noopener"` as now |
| `excerpt` keeps working on the rendered HTML | Feeds and summaries as now |

`markdown-it` was a direct dependency for the first build and was removed (maintainer, 2026-10-19): Eleventy's copy is enough for the site, and the migration no longer renders.

### Images on their own line

An image alone in its paragraph (after the `images` transform, a `<p>` whose only content is one `<picture>`, or one `<a>` around one) is centred. Images never exceed the column width (already true from spec 06, check). One rule in the stylesheet, which stays under its 25000-byte budget. Selector is the builder's call; it must not centre an image that shares its paragraph with text.

### Pages CMS (`.pages.yml`)

Every `body` field: `type: rich-text`, `options.format: markdown`. Nothing else changes. The conventions line "Rich text fields use `format: html`" becomes "`format: markdown`".

### Docs

| File | Change |
|---|---|
| `page-cms-spec-conventions.md` | Markdown bodies (Build and Content sections), `--db`, `format: markdown` |
| `page-cms-spec-07-content-migration.md` | "Deferred: content match" points here. Dates table and manual step 1 point here |
| `CLAUDE.md` | Open items: content match done when this spec is. Decisions table: "Body format: pure Markdown, no HTML in bodies (2026-10-19)" |
| `page-cms-migration-report.md` | Regenerated by the run |

---

## Tests

Behaviour only, per the [conventions](page-cms-spec-conventions.md#tests).

### Unit (`tests/unit/migrate.test.mjs`)

| Case | Expected |
|---|---|
| An event row with start, end and a location with a comma and a curly apostrophe | `date`, `end`, `location` written exactly |
| A row with `NULL` end and location | No `end`, no `location` |
| A notice row | `date` as `yyyy-MM-dd` |
| An event on live not in the export | Inferred and flagged, as spec 07 |
| CSV with BOM, a quoted body with commas, quotes and newlines | Parsed into the right columns |
| `--db` folder missing | Runs as spec 07, no error |
| Each row of the conversion table | The Markdown shown in the table |
| A centred `<p>` with a sized image linking to a bigger copy | `![alt](/uploads/big...)` alone in a paragraph, no link |
| Jump menu page (trimmed `pa4` snapshot) | Link text with no `#` links, targets gone, escaped brackets |
| Contact List table (trimmed `pa12`, names replaced) | A pipe table, empty rows gone, split email links kept as two links |
| Website Pictures table (trimmed `pa14`) | Images and captions in reading order, no table |
| `*********` banner, `1)` and `1.` paragraphs, `#hashtag` at a line start | Shown as written when rendered with the site's markdown-it |
| An unknown tag (`<marquee>`) | Body left as HTML and listed in "Bodies left as HTML" |
| A re-run with no export folder | `--check` reports no changes: written dates and locations are kept |
| `--check` straight after a run | No changes |

### Scenarios

| Feature | Scenario |
|---|---|
| `notices.feature`, "A notice page" | Fixture body becomes Markdown: list item, link, heading. `I see "*stars*"` becomes an escaped `\*stars\*` in the fixture, still shown as `*stars*`. "Indented after blank" still shown as text, not code |
| `notices.feature`, "Template syntax in a body is shown as written" | Unchanged, passes with Markdown |
| `pages.feature`, "A Markdown body" (new) | Heading, list, pipe table header cells, an escaped `*****` line and `1.` shown as written, an image alone centred and one beside text not |
| `editor.feature` | Every `body` field has `format: markdown` |
| `calendar.feature`, "An event page" | Already shows the fixture `location` ("Church Hall"). No change |

Legacy HTML fixtures stay as they are (see Implementation notes); `about-us.md` and `contact-thanks.md` are Markdown.

---

## Implementation notes

- The converter is a walk over the cheerio tree already used by `rewriteBody`. No new dependency is expected; adding an HTML-to-Markdown library is the builder's call only if the walk proves unworkable, exact-pinned and audited.
- Output stays deterministic: same input, same bytes. Bodies end with one newline.
- Order of work: dates and locations first (they stand alone), then the converter, rendering and `.pages.yml`, then the Pages CMS save check (manual step 0) on the converted content. The escaping and table rules are small separate pieces (`escapeText`, `LINE_START`, `table` in `toMarkdown`), so the check's result changes only them.
- As built (2026-10-19): `config/content.js` amends Eleventy's markdown-it (`amendLibrary`). Centring is a markdown-it core rule that gives a paragraph holding only an image, or only a linked image, `class="solo"`; `.prose .solo` centres it. `bodyMarkdown` keeps the HTML and lists the item under "Bodies left as HTML" when a tag has no Markdown form. The text check against the originals was run by hand on the real content (111 bodies, 0 differences apart from the asterisk banners) rather than kept in the script. Legacy HTML fixtures in `tests/fixtures/content/` stay HTML: they pin the `html: true` safety net and the image and link transforms. The Markdown scenario uses `page/about/about-us.md`, so no list scenario changes.
- First run on 2026-10-19: 95 items, 0 inferred dates, 0 bodies left as HTML, 68 event locations, 0 text changes against the previous files, `--check` reports no changes, `check-urls` 120 checked, 0 failed. The 6 failed downloads are the same as spec 07's (already broken on live). `contact-us.md` and `contact-thanks.md` were converted by hand.
- The report's existing tables stay. "Inferred dates" should be empty or only hold items created after the export.

## Manual steps (maintainer)

0. **Pages CMS save check, before merging.** The converted content is on the spec branch, so no test page is needed. In Pages CMS, switch to the branch `ccr-03ea18e8-l6hzof`, open each of these, save without changing anything, and look at the commit Pages CMS makes:

   | Item | What it checks |
   |---|---|
   | Pages, About, Contact List | Pipe table, adjacent links |
   | Blog, Progress Update on St. Paul's Church Roof Fund | Escaped `\*` banners, `1\)` paragraphs |
   | Pages, Services, Regular Church Services | Escaped `\[ \]`, headings, images |
   | Events, Christmas Market - Cancelled (id 9) | `1\.` paragraphs, a link |
   | Pages, Gallery, Website Pictures | Linked images one after another |

   Expected: no commit, or whitespace only. Send back any diff. The builder then matches the converter to what Pages CMS writes for each construct (builder's call, 2026-10-19: simple editing wins, so the editor's format is the target), re-runs, and the check is repeated. If Pages CMS drops or flattens the table, Contact List uses the "each cell in reading order" rule. If it cannot keep Markdown at all, stop and bring it to the maintainer; the dates and locations work can ship on its own.
1. Nothing to keep: the SQL export is deleted and its dates live in the migrated files. On cutover day (spec 11) the re-run keeps them; only items new on live get inferred dates, flagged in the report. A fresh export into `docs/features/migration/data/` is optional and wins if present.
2. Before merging, open one converted page, one event and one article in Pages CMS on the test site, save each without changes, and check the commit Pages CMS makes. Expected: no change, or whitespace only. Report anything else; it decides whether the editor rewrites Markdown in a way the site cannot take. Pages CMS cannot be reached from the sandbox.
3. Review the content diff and the report. Compare home, an article with images, Website Pictures, Contact List and Regular Church Services with live using `scripts/screenshots.mjs`.

## Acceptance

- [ ] `npm test` passes and `npm audit` reports 0 vulnerabilities.
- [ ] Every event's `date` and `end` equal the export's `StartDate` and `EndDate`; every event with a `Location` in the export has it as `location`.
- [ ] The 5 notices' `date` equal the export's `StartDate`.
- [ ] "Inferred dates" in the report is empty, or lists only items created after the export.
- [ ] No body in `site/content/` contains an HTML tag, and "Bodies left as HTML" is empty.
- [ ] Each body's text, tags removed, is unchanged by the conversion (content not corrected).
- [ ] `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site` reports 0 failed.
- [ ] `node scripts/migrate.mjs --check` straight after a run reports no changes.
- [ ] Every `body` in `.pages.yml` has `format: markdown`.
- [ ] Manual step 2 done and its result recorded here.
