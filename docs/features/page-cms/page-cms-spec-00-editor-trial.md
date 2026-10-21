---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 00: editor trial

_One session. Sets up the static site foundations and proves that a non-technical editor can publish through Pages CMS. See [way forward](page-cms-discovery-way-forward.md). The spec comes first; the [implementation plan](#implementation-plan) follows it._

_Built in Hugo, ported to Eleventy on 2026-10-18, see [the switch plan](page-cms-plan-eleventy-switch.md)._

---

## Goal

Paul (or the maintainer standing in for him) adds a notice in Pages CMS and sees it on the Static Web App URL within a few minutes, without touching Git.

## Starting point

`main` is the default branch and holds `README.md`, `CLAUDE.md`, `docs/` and `.claude/skills/`. `master` no longer exists (checked 2026-10-17). The Umbraco code is on `archive/umbraco-2019`. Legacy CSS and images are copied from that branch where needed.

## In scope

- Hugo site in `site/`, with a Notices section only: list page and single page.
- Minimal layout reusing the legacy `bootstrap.css` and `Site.css` from the archive branch. Header, footer, no personal details, no analytics.
- Three notices copied from the live site as seed content: `news-pew-sheets`, `safeguarding`, `latest-parish-magazine`.
- Pages CMS config (`.pages.yml` at repo root) for the Notices collection and a media folder.
- Bicep for the Static Web App in `infra/`.
- GitHub Actions workflow that runs the tests, deploys the Bicep, builds the site and deploys it.
- Tests in `tests/`, Python standard library only, run locally and in the workflow.
- How-to in `docs/` for the manual Azure and Pages CMS setup.

## Out of scope

Other sections, home page, URL parity with live, DNS and custom domain, style modernisation (spec 06), nightly build, RSS, sitemap.

---

## Requirements

### Content model: notice

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | |
| `date` | date | Yes | Sort order, newest first. Shown as `dd-MMM-yy`, like live. Future dates are still published |
| `summary` | string | No | Shown on the list page. Nothing is shown when empty |
| `location` | string | No | Shown on the single page. Nothing is shown when empty |
| body | rich text (HTML) | Yes | Stored as the file body. Hugo must render raw HTML |

Files live at `site/content/notices/`. Pages CMS names new files `{yyyy}-{mm}-{dd}-{slug}.md`, so a notice titled "Index" cannot become `index.md` (which empties the section in Hugo) and same-title notices do not overwrite each other. The seed notices keep plain `{slug}.md` names. Uploaded images go to `site/static/uploads/`.

### Site

| | |
|---|---|
| URLs | `/notices/` and `/notices/{slug}/`. Live URLs come in spec 04 |
| Root | `/` redirects (302) to `/notices/` until the home page exists (spec 03) |
| Empty list | "Could not find any notices." (live wording) |
| 404 | Legacy "Page Not Found" text, without the Google link helper script |

### Infrastructure (`infra/`)

| | |
|---|---|
| File | `infra/main.bicep`, resource group scope, plus `infra/main.bicepparam` |
| Resource | `Microsoft.Web/staticSites@2025-03-01` (newest GA version known to Bicep 0.48.1, checked 2026-10-17), SKU `Free`, `provider: 'Custom'` |
| Parameters | `name` (`swa-stpauls-web` in the param file), `location` (default `westeurope`), `tags` |
| Outputs | `name`, `defaultHostname` |
| Not included | Custom domain (spec 09), linked backends, app settings |

### Pipeline (`.github/workflows/deploy.yml`)

| | |
|---|---|
| Triggers | Push to `main` touching `site/**`, `infra/**`, `.pages.yml` or the workflow. Manual dispatch |
| Azure sign in | `azure/login` with OIDC. No client secret, no stored SWA deployment token |
| Test step | `python3 -m unittest discover -s tests -v`, before anything is deployed |
| Infra step | Deploy `infra/main.bicep` to the resource group (idempotent). Site URL written to the run summary |
| Build step | Hugo extended `0.167.0`, `hugo --source site --minify`. No npm |
| Deploy step | Read the SWA deployment token at run time with Azure CLI, mask it, deploy `site/public` with `Azure/static-web-apps-deploy` (`skip_app_build: true`) |
| Config | `staticwebapp.config.json` with a 404 page and the root redirect |
| Concurrency | One run at a time. A newer push waits rather than cancelling a deploy |
| Secrets | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` |
| Variables | `AZURE_RESOURCE_GROUP` |
| Permissions | `id-token: write`, `contents: read` |

### Pages CMS

- Notices collection: create, edit, delete. Fields as above. `_index.md` is hidden from the editor.
- Media: upload to `site/static/uploads/`, referenced as `/uploads/...`.
- Commits go to `main`.

---

## Manual steps (maintainer)

_Tracked in [the maintainer checklist](page-cms-how-to-run-the-maintainer-checklist.md) (spec 10), which is the one list to run through. Kept here for detail._

1. ~~GitHub: set the default branch to `main`. Optionally delete `master`.~~ Done.
2. Azure: create a resource group (e.g. `rg-stpauls-web`, West Europe).
3. Entra ID: create an app registration with a federated credential for `repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main` (case matters). Grant it Contributor on the resource group.
4. GitHub: add the three `AZURE_*` secrets and the `AZURE_RESOURCE_GROUP` variable. Check no branch rule stops the Pages CMS app pushing to `main`.
5. Run the workflow. Note the `*.azurestaticapps.net` URL from the run summary.
6. Sign in at `app.pagescms.org` with GitHub and install the Pages CMS GitHub App on this repo.
7. In Pages CMS, invite the trial editor by email.

The how-to written in Task 6 gives the commands for each step.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes locally and in the workflow.
- [ ] Workflow creates the Static Web App from Bicep on first run and is a no-op on later runs.
- [ ] Push to `main` deploys the site to its `*.azurestaticapps.net` URL.
- [ ] Notices list and single pages render with the legacy styling.
- [ ] A notice created in Pages CMS, with an image, appears on the site within 5 minutes with no other action.
- [ ] Editing and deleting a notice in Pages CMS is reflected on the site.
- [ ] The email-invited editor can do the above without a GitHub account.
- [ ] Maintainer records go or no-go in the way forward doc.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Hugo site with a Notices section, edited through Pages CMS and deployed to an Azure Static Web App by GitHub Actions, ready for the editor trial.

**Architecture:** Notices are Markdown files with YAML front matter and an HTML body. Hugo renders them with layouts that reuse the legacy Bootstrap 3 CSS. One workflow on `main` runs the tests, deploys `infra/main.bicep`, builds with a pinned Hugo and uploads `site/public` using a deployment token read at run time.

**Tech Stack:** Hugo extended 0.167.0, Bicep, GitHub Actions, Azure Static Web Apps Free, Pages CMS (hosted), Python 3 `unittest`.

**Spec:** the sections above in this file, from Goal to Acceptance. Background in [way forward](page-cms-discovery-way-forward.md).

### Global Constraints

- Work on the session branch. Never push to `main`: it is the deploy branch and Pages CMS commits to it. No pull request unless the maintainer asks.
- Hugo extended `0.167.0`, the same string everywhere. No npm, no `package.json`, no Hugo modules, no theme.
- Hugo config has no `languageCode` (deprecated since 0.158, it trips `--panicOnWarning`). Templates live in the 0.146+ layout: `site/layouts/baseof.html`, `site/layouts/_partials/`, `site/layouts/notices/section.html`, `site/layouts/notices/page.html`.
- Tests use the Python 3 standard library only (the runner has 3.12, no guaranteed PyYAML). Run all with `python3 -m unittest discover -s tests -v` from the repo root.
- Tests never assert on files in `site/content/`. Paul edits and deletes those; a test that depends on them would block his publishes. Tests build `tests/fixtures/` instead.
- No maintainer name, `ste-pam.com`, LinkedIn, analytics, Disqus or social share links anywhere in `site/`.
- Static Web App: `Microsoft.Web/staticSites@2025-03-01`, SKU `Free`, `location` default `westeurope`, name `swa-stpauls-web`.
- Azure sign in by OIDC only. Secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, variable `AZURE_RESOURCE_GROUP`. No client secret, no stored SWA token, no `environment:` on the job (it changes the OIDC subject away from `repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main`).
- Legacy files are copied byte for byte: `git fetch origin archive/umbraco-2019`, then `git show origin/archive/umbraco-2019:StPauls.Web/<path> > <dest>`. They keep their legacy paths under `site/static/` so the relative `url(...)` references in `Site.css` still resolve.
- Local tools. The sandbox has none; github.com downloads are blocked, PyPI and NuGet work. Install outside the repo (e.g. the scratchpad):
  - Hugo and actionlint: `python3 -m venv <dir> && <dir>/bin/pip install hugo==0.167.0 actionlint-py`, then put `<dir>/bin` on `PATH`.
  - Bicep 0.48.1: download `https://api.nuget.org/v3-flatcontainer/azure.bicep.commandline.linux-x64/0.48.1/azure.bicep.commandline.linux-x64.0.48.1.nupkg`, extract with `python3 -m zipfile -e <nupkg> <dir>`, `chmod +x <dir>/tools/bicep`, put `<dir>/tools` on `PATH`.
  - `az`, Azure and Pages CMS cannot be reached from the sandbox (`pagescms.org` does not resolve). Say so in the hand-off rather than guessing.
- Docs follow `docs/features/page-cms/page-cms-discovery-*.md`: YAML front matter (`date`, `tags`, `status`), one H1, italic one-line summary, tables over prose, no em dashes. Markdown file names never contain `:`, `/`, `#` or `^`.
- Commit messages are a short imperative sentence, as in `git log` (no `feat:` prefix), ending with the session's attribution lines.

### Review Focus

1. A notice dated in the future (Paul dates it for the day of the event) must still be published; Hugo hides future content by default. Pinned by `test_future_dated_notice_is_published` (Task 2).
2. A notice saved with no summary or no location shows no empty panel body and no empty `<address>`. Pinned by `test_summary_only_when_set` and `test_location_only_when_set` (Task 2).
3. A rich-text body with several HTML blocks, blank lines between them, a link, a list and literal `*` characters renders as HTML, never escaped and never as a code block. Pinned by `test_body_html_is_rendered_raw` (Task 2).
4. Paul deletes the seed notices, or every notice: the workflow still passes and `/notices/` says "Could not find any notices.", and Pages CMS never offers `_index.md` as a notice to delete. Pinned by `test_empty_section_message` (Task 2), the fixtures-only rule, and `test_index_file_excluded` (Task 3).
5. An image inserted through the rich-text editor is written to `site/static/uploads/` and referenced as `/uploads/<file>`, which is where Hugo publishes it. Pinned by `test_media_maps_to_hugo_static` (Task 3).

---

### Task 1: Base layout, 404 page and test harness

**Files:**
- Modify: `.gitignore` (add `__pycache__/`)
- Create: `site/hugo.toml`
- Create: `site/layouts/baseof.html`, `site/layouts/_partials/header.html`, `site/layouts/_partials/footer.html`, `site/layouts/404.html`
- Create: `site/static/staticwebapp.config.json`
- Copy from archive: `Content/bootstrap.css`, `Content/Site.css`, `Content/Image/map.png`, `Content/Image/social-sprites.png` to `site/static/Content/` (same sub-paths); `fonts/muli.woff2` to `site/static/fonts/muli.woff2`
- Create: `tests/helpers.py`, `tests/test_layout.py`

**Interfaces:**
- Produces in `tests/helpers.py` (test modules import it as `from helpers import ...`; `discover -s tests` puts `tests/` on `sys.path`):
  - `REPO: Path` (repo root) and `FIXTURES: Path` (`REPO / "tests" / "fixtures"`)
  - `build_site(dest: Path, content_dir: Path | None = None, *, minify: bool = False, strict: bool = True) -> None`. Runs `hugo --source <REPO>/site --destination <dest> --quiet`, adding `--contentDir <content_dir>` when given, `--minify` when `minify`, `--panicOnWarning` when `strict`. Absolute paths only. On non-zero exit raises `AssertionError` with Hugo's stderr.
  - `find_banned(out: Path) -> list[str]`. Reads every `.html`, `.css`, `.js`, `.json` and `.xml` file under `out` as `utf-8-sig`, lower-cased, and returns `"<relative path>: <term>"` for each hit of: `stephen pammenter`, `ste-pam.com`, `linkedin.com`, `licdn.com`, `ua-68397826`, `google-analytics.com`, `googletagmanager.com`, `disqus`. (`linkedin.com`, not `linkedin`: `Site.css` has a harmless `.linkedin` class.)
- Produces for later templates: block `main` in `baseof.html`; `site.Title` is `St Paul's Warton`.

- [ ] **Step 1: Write the failing tests in `tests/test_layout.py`**

`LayoutTests.setUpClass` builds with `build_site(dest, content_dir=<empty temp dir>)` into a `TemporaryDirectory` and reads `404.html` into `cls.page`. Every page shares `baseof.html`, so the 404 page carries the layout checks.

```python
def test_page_uses_legacy_css(self):
    self.assertIn('href="/Content/bootstrap.css"', self.page)
    self.assertIn('href="/Content/Site.css"', self.page)
    for f in ["Content/bootstrap.css", "Content/Site.css", "Content/Image/map.png",
              "Content/Image/social-sprites.png", "fonts/muli.woff2"]:
        self.assertTrue((self.out / f).is_file(), f)

def test_header_and_footer(self):
    self.assertIn('class="navbar-brand"', self.page)
    self.assertIn('href="/notices/"', self.page)
    self.assertIn("PR4 1BD", self.page)
    self.assertIn("https://www.facebook.com/stpaulswarton", self.page)

def test_not_found_page(self):
    self.assertIn("Page Not Found", self.page)
    self.assertNotIn("linkhelp.clients.google.com", self.page)

def test_no_personal_details_or_trackers(self):
    self.assertEqual(find_banned(self.out), [])

def test_swa_config(self):
    cfg = json.loads((self.out / "staticwebapp.config.json").read_text())
    self.assertEqual(cfg["responseOverrides"]["404"], {"rewrite": "/404.html", "statusCode": 404})
    self.assertIn({"route": "/", "redirect": "/notices/", "statusCode": 302}, cfg["routes"])
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_layout.py' -v`
Expected: errors from `build_site` (no `site/` yet).

- [ ] **Step 3: Write `site/hugo.toml`**

```toml
baseURL = '/'
title = "St Paul's Warton"
timeZone = 'Europe/London'
buildFuture = true
disableKinds = ['rss', 'sitemap', 'taxonomy', 'term']

[markup.goldmark.renderer]
unsafe = true
```

`buildFuture` is Review Focus 1. `unsafe` lets the HTML body through. `home` stays on with a stub `site/layouts/home.html`: the Static Web Apps deploy action refuses a folder with no root `index.html`. The root redirect still sends visitors to `/notices/` until spec 03.

- [ ] **Step 4: Write the layouts and copy the legacy files**

- `baseof.html`: `<html lang="en-GB">`, charset and viewport metas, `<title>{{ .Title }} | {{ site.Title }}</title>`, `{{ with .Params.summary }}<meta name="description" content="{{ . }}">{{ end }}`, the inline Muli `@font-face` from legacy `Views/masterLayout.cshtml` (`src: local('Muli'), url(/fonts/muli.woff2) format('woff2')`), links to `/Content/bootstrap.css` and `/Content/Site.css`, header partial, `<main class="body"><div class="container pageWrap bg-default">{{ block "main" . }}{{ end }}</div></main>`, footer partial. No scripts.
- `header.html`: legacy `<header class="navbar navbar-default"><nav class="container-fluid">` with `<a href="/notices/" class="navbar-brand">{{ site.Title }}</a>` and a `nav navbar-nav` list holding one link, Notices, to `/notices/`. No collapse toggle (no Bootstrap JS, see legacy defect list).
- `footer.html`: legacy `<footer class="footer"><div class="container"><nav class="row">` holding the "Find Us" column of `Views/Partials/_Links.cshtml` as it stands (map link and `/Content/Image/map.png` with alt "Map showing St Paul's Church, Warton", address, Facebook icon link), then `<hr>` and `<p>&copy; {{ now.Year }} {{ site.Title }}</p>`. Leave out the commented Razor block and the whole "Site by" column.
- `404.html`: the text of legacy `Views/Error/NotFound.cshtml` inside `{{ define "main" }}`, without its two `<script>` tags.
- `staticwebapp.config.json`: exactly the `routes` entry and `responseOverrides` entry that `test_swa_config` asserts, nothing else.
- Copy the five legacy files listed under **Files**.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -p 'test_layout.py' -v`
Expected: 5 tests, OK.

- [ ] **Step 6: Commit**

```bash
git add .gitignore site tests
git commit -m "Add Hugo base layout, 404 page and test harness"
```

---

### Task 2: Notices section and seed content

**Files:**
- Create: `site/layouts/notices/section.html`, `site/layouts/notices/page.html`
- Create: `site/content/notices/_index.md`, `news-pew-sheets.md`, `safeguarding.md`, `latest-parish-magazine.md`
- Create: `tests/fixtures/content/notices/_index.md`, `newer.md`, `older.md`, `future.md`
- Create: `tests/fixtures/empty/notices/_index.md`
- Create: `tests/test_notices.py`

**Interfaces:**
- Consumes: `build_site`, `find_banned`, `FIXTURES`, `REPO` and block `main` (Task 1).
- Produces: front matter keys `title`, `date`, `summary`, `location`; body is the file body. Each `_index.md` holds only `title: Notices`. Task 3 maps Pages CMS fields to exactly these names.
- Produces: URLs `/notices/` and `/notices/{file name without .md}/`.
- Produces: CSS hooks `<span class="date-time notice-date">` (list and single), `<p class="notice-summary">` (list), `<address class="notice-location">` (single).

- [ ] **Step 1: Write the fixtures**

| File | `title` | `date` | `summary` | `location` | Body |
|---|---|---|---|---|---|
| `content/notices/newer.md` | `Fixture newer` | `2026-02-01` | `Newer summary` | `Church Hall` | the block below |
| `content/notices/older.md` | `Fixture older` | `2025-12-01` | | | `<p>Older body</p>` |
| `content/notices/future.md` | `Fixture future` | `2099-01-01` | | | `<p>Future body</p>` |

Body of `newer.md`, blank lines included:

```html
<p>First block</p>

<p>Second block with <a href="https://example.org/">a link</a> and *stars*</p>

<ul>
  <li>Item one</li>
</ul>
```

- [ ] **Step 2: Write the failing tests in `tests/test_notices.py`**

`NoticesTests` builds `FIXTURES / "content"` once and reads `notices/index.html` (`self.list`), `notices/newer/index.html` (`self.newer`) and `notices/older/index.html` (`self.older`). `EmptyNoticesTests` builds `FIXTURES / "empty"`. `RealContentTests` builds the real content the way the pipeline does.

```python
def test_list_is_newest_first(self):
    i = [self.list.index(t) for t in ("Fixture future", "Fixture newer", "Fixture older")]
    self.assertEqual(i, sorted(i))

def test_list_links_and_dates(self):
    self.assertIn('href="/notices/newer/"', self.list)
    self.assertIn("01-Feb-26", self.list)

def test_summary_only_when_set(self):
    self.assertEqual(self.list.count('class="notice-summary"'), 1)
    self.assertIn("Newer summary", self.list)

def test_location_only_when_set(self):
    self.assertIn('class="notice-location">Church Hall<', self.newer)
    self.assertNotIn('class="notice-location"', self.older)

def test_single_shows_title_and_date(self):
    self.assertIn("<h1>Fixture newer</h1>", self.newer)
    self.assertIn("01-Feb-26", self.newer)

def test_body_html_is_rendered_raw(self):
    self.assertIn('<a href="https://example.org/">a link</a>', self.newer)
    self.assertIn("<li>Item one</li>", self.newer)
    self.assertIn("*stars*", self.newer)
    self.assertNotIn("&lt;p&gt;", self.newer)
    self.assertNotIn("<pre>", self.newer)

def test_future_dated_notice_is_published(self):
    self.assertTrue((self.out / "notices/future/index.html").is_file())

def test_no_personal_details_or_trackers(self):
    self.assertEqual(find_banned(self.out), [])

# EmptyNoticesTests
def test_empty_section_message(self):
    self.assertIn("Could not find any notices.", self.list)

# RealContentTests: builds whatever Paul has saved; asserts nothing about it
def test_real_content_builds(self):
    build_site(self.dest, minify=True, strict=False)
```

- [ ] **Step 3: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_notices.py' -v`
Expected: `--panicOnWarning` build failures (no notices layouts) and missing files.

- [ ] **Step 4: Write the two layouts**

Markup follows legacy `Views/notices.cshtml` and `Views/notice.cshtml`; dates use `.Date.Format "02-Jan-06"`.

- `section.html`: `<h1>{{ .Title }}</h1>`, then `range .Pages.ByDate.Reverse`. Each item is the legacy `col-lg-6 col-md-6 col-sm-6 col-xs-12` panel: an `<a href="{{ .RelPermalink }}">` around a `panel-heading panel-heading-link` holding `<h3>{{ .Title }}</h3>` and the date span, then a `panel-body` holding the `notice-summary` paragraph only `with .Params.summary`. The `else` branch of the `range` prints `<p>Could not find any notices.</p>`.
- `page.html`: `<h1>{{ .Title }}</h1>`, a `col-xs-12` div with the date span, the `notice-location` address only `with .Params.location`, and `<hr>`, then `<div class="col-xs-12 article-body">{{ .Content }}</div>`. `.article-body img { max-width: 100% }` in `Site.css` keeps uploaded photos inside the page.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all tests in `test_layout.py` and `test_notices.py` OK.

- [ ] **Step 6: Write the seed content**

Fetch each page with `curl -sS <url>`; the notice text is in the second `<div class="col-xs-12">` inside `<main>`.

| File | `title` | `date` | Live URL |
|---|---|---|---|
| `news-pew-sheets.md` | `"News / Pew Sheets"` | `2026-10-17` | `http://stpaulswarton.co.uk/notices/notice/46/news-pew-sheets` |
| `safeguarding.md` | `"SAFEGUARDING"` | `2026-10-16` | `http://stpaulswarton.co.uk/notices/notice/44/safeguarding` |
| `latest-parish-magazine.md` | `"Latest Parish Magazine"` | `2026-10-15` | `http://stpaulswarton.co.uk/notices/notice/43/latest-parish-magazine` |

- `summary`: the live text verbatim as plain text, HTML entities decoded (`&#39;` becomes `'`). This reproduces the live list, which shows the whole text.
- Body: the same text in one `<p>`, each bare URL wrapped as `<a href="URL">URL</a>`.
- No `location`; live has none. Double-quote `title` and `summary` (the safeguarding text contains `: `).
- Live shows no dates. These dates only keep the live order (highest id newest). Spec 05 re-extracts all content.

- [ ] **Step 7: Check the real site builds**

Run: `python3 -m unittest discover -s tests -v`
Expected: all OK, including `test_real_content_builds`.

- [ ] **Step 8: Commit**

```bash
git add site tests
git commit -m "Add Notices section with seed notices from the live site"
```

---

### Task 3: Pages CMS config

**Files:**
- Create: `.pages.yml`
- Create: `site/static/uploads/.gitkeep`
- Create: `tests/test_cms_config.py`

**Interfaces:**
- Consumes: front matter keys and `site/content/notices` path (Task 2).
- Produces: media `input: site/static/uploads`, `output: /uploads` (Task 6 how-to tells the editor where images go).

- [ ] **Step 1: Write the failing tests in `tests/test_cms_config.py`**

Plain text checks against `CFG = (REPO / ".pages.yml").read_text()`; no YAML library.

```python
def test_media_maps_to_hugo_static(self):
    self.assertRegex(CFG, r"(?m)^\s+input: site/static/uploads$")
    self.assertRegex(CFG, r"(?m)^\s+output: /uploads$")
    self.assertTrue((REPO / "site/static/uploads").is_dir())

def test_notices_collection(self):
    self.assertRegex(CFG, r"(?m)^\s+path: site/content/notices$")
    self.assertRegex(CFG, r'(?m)^\s+filename: "\{year\}-\{month\}-\{day\}-\{primary\}\.md"$')

def test_index_file_excluded(self):
    self.assertRegex(CFG, r"(?m)^\s+exclude: \[_index\.md\]$")

def test_field_names_match_content_model(self):
    names = set(re.findall(r"(?m)^\s*- name: (\S+)$", CFG))
    self.assertEqual(names, {"notices", "title", "date", "summary", "location", "body"})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_cms_config.py' -v`
Expected: `FileNotFoundError` for `.pages.yml`.

- [ ] **Step 3: Write `.pages.yml` and `site/static/uploads/.gitkeep`**

```yaml
media:
  input: site/static/uploads
  output: /uploads

content:
  - name: notices
    label: Notices
    type: collection
    path: site/content/notices
    filename: "{year}-{month}-{day}-{primary}.md"
    exclude: [_index.md]
    view:
      fields: [title, date]
      primary: title
      sort: [date, title]
      default:
        sort: date
        order: desc
    fields:
      - name: title
        label: Title
        type: string
        required: true
      - name: date
        label: Date
        type: date
        required: true
      - name: summary
        label: Summary
        description: Short text shown on the list of notices
        type: string
      - name: location
        label: Location
        type: string
      - name: body
        label: Notice
        type: rich-text
        required: true
```

`body` is Pages CMS's name for the file body. `{primary}` is the slugified title, so "News / Pew Sheets" saved on 17 October 2026 becomes `2026-10-17-news-pew-sheets.md`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all OK. Pages CMS's own validation of this file happens at manual step 6; it cannot run here.

- [ ] **Step 5: Commit**

```bash
git add .pages.yml site/static/uploads/.gitkeep tests/test_cms_config.py
git commit -m "Add Pages CMS config for notices and uploads"
```

---

### Task 4: Bicep for the Static Web App

**Files:**
- Create: `infra/main.bicep`, `infra/main.bicepparam`
- Create: `tests/test_infra.py`

**Interfaces:**
- Produces: parameters `name: string`, `location: string = 'westeurope'`, `tags: object = {}`; outputs `name: string` (`site.name`) and `defaultHostname: string` (`site.properties.defaultHostname`). `main.bicepparam` sets `name = 'swa-stpauls-web'` and `tags = { project: 'stpauls-web' }`.
- Task 5 runs it with `--template-file infra/main.bicep --parameters infra/main.bicepparam` and reads `properties.outputs`.

- [ ] **Step 1: Write the failing tests in `tests/test_infra.py`**

`InfraTests` is skipped with `unittest.skipUnless(shutil.which("bicep"), ...)`: the runner has `az bicep`, not `bicep`, and the deploy step compiles the file anyway. `run(*args) -> str` returns stdout plus stderr, cwd `REPO`.

```python
def test_static_web_app(self):
    tpl = json.loads(run("bicep", "build", "infra/main.bicep", "--stdout"))
    res = tpl["resources"]
    res = list(res.values()) if isinstance(res, dict) else res
    self.assertEqual(len(res), 1)
    swa = res[0]
    self.assertEqual(swa["type"], "Microsoft.Web/staticSites")
    self.assertEqual(swa["apiVersion"], "2025-03-01")
    self.assertEqual(swa["sku"], {"name": "Free", "tier": "Free"})
    self.assertEqual(swa["properties"], {"provider": "Custom"})
    self.assertEqual(set(tpl["parameters"]), {"name", "location", "tags"})
    self.assertEqual(tpl["parameters"]["location"]["defaultValue"], "westeurope")
    self.assertEqual(set(tpl["outputs"]), {"name", "defaultHostname"})

def test_parameter_file(self):
    out = json.loads(run("bicep", "build-params", "infra/main.bicepparam", "--stdout"))
    params = json.loads(out["parametersJson"])["parameters"]
    self.assertEqual(params["name"]["value"], "swa-stpauls-web")

def test_lint_is_clean(self):
    out = run("bicep", "lint", "infra/main.bicep")
    self.assertNotIn("Warning", out)
    self.assertNotIn("Error", out)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_infra.py' -v` with Bicep on `PATH`.
Expected: errors, `infra/main.bicep` not found. If they report "skipped", Bicep is not on `PATH`; install it per Global Constraints first.

- [ ] **Step 3: Write `infra/main.bicep` and `infra/main.bicepparam`**

`targetScope = 'resourceGroup'`, the three parameters with `@description`, one `Microsoft.Web/staticSites@2025-03-01` resource with the `sku` and `properties` the test asserts, and the two outputs. `provider: 'Custom'` marks it as deployed by our own pipeline, so Azure does not try to link a repo or add its own workflow.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all OK, `test_infra.py` not skipped. Bicep may log a refused connection to `aka.ms`; that is harmless.

- [ ] **Step 5: Commit**

```bash
git add infra tests/test_infra.py
git commit -m "Add Bicep for the Static Web App"
```

---

### Task 5: Deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `tests/test_workflow.py`

**Interfaces:**
- Consumes: the test command (Tasks 1 to 4), `infra/main.bicep` and its outputs (Task 4), `site/public` from the build.
- Produces: secret and variable names for the how-to (Task 6); the site URL in the run summary.

- [ ] **Step 1: Write the failing tests in `tests/test_workflow.py`**

Plain text checks against `WF = (REPO / ".github/workflows/deploy.yml").read_text()`.

```python
def test_oidc_only(self):
    self.assertIn("id-token: write", WF)
    self.assertIn("contents: read", WF)
    self.assertIn("uses: azure/login@v3", WF)
    for s in ("creds:", "client-secret", "AZURE_CREDENTIALS", "secrets.AZURE_STATIC_WEB_APPS"):
        self.assertNotIn(s, WF)
    self.assertNotRegex(WF, r"(?m)^\s+environment:")

def test_secret_and_variable_names(self):
    used = set(re.findall(r"\$\{\{\s*(?:secrets|vars)\.(\w+)", WF))
    self.assertEqual(used, {"AZURE_CLIENT_ID", "AZURE_TENANT_ID",
                            "AZURE_SUBSCRIPTION_ID", "AZURE_RESOURCE_GROUP"})

def test_token_is_masked_before_it_is_output(self):
    self.assertLess(WF.index('echo "::add-mask::$token"'),
                    WF.index('echo "token=$token" >> "$GITHUB_OUTPUT"'))

def test_tests_and_build_run_before_deploy(self):
    self.assertIn("HUGO_VERSION: 0.167.0", WF)
    steps = ["python3 -m unittest discover -s tests", "hugo --source site --minify",
             "uses: azure/login@v3", "uses: Azure/static-web-apps-deploy@v1"]
    pos = [WF.index(s) for s in steps]
    self.assertEqual(pos, sorted(pos))

def test_triggers_and_concurrency(self):
    for p in ("'site/**'", "'infra/**'", "'.pages.yml'", "'.github/workflows/deploy.yml'"):
        self.assertIn(p, WF)
    self.assertIn("workflow_dispatch:", WF)
    self.assertIn("cancel-in-progress: false", WF)

def test_uploads_prebuilt_site(self):
    self.assertIn("app_location: site/public", WF)
    self.assertIn("skip_app_build: true", WF)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_workflow.py' -v`
Expected: `FileNotFoundError` for `deploy.yml`.

- [ ] **Step 3: Write `.github/workflows/deploy.yml`**

Top level: `name: Deploy`; `on.push` with `branches: [main]` and the four single-quoted `paths`; `workflow_dispatch:`; `permissions` as tested; `concurrency: { group: deploy, cancel-in-progress: false }` (a second Pages CMS save waits for the running deploy, then ships the newer commit); `env.HUGO_VERSION: 0.167.0`. One job `deploy` on `ubuntu-24.04` with `if: github.ref == 'refs/heads/main'`. Pass values into `run:` scripts through `env:`; never put `${{ }}` inside a `run:` script.

| # | Step | Detail |
|---|---|---|
| 1 | `actions/checkout@v6` | |
| 2 | Install Hugo | `curl -fsSL` `https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz`, extract `hugo` into `$RUNNER_TEMP/hugo`, append that dir to `$GITHUB_PATH`, then `hugo version` |
| 3 | Test | `python3 -m unittest discover -s tests -v` |
| 4 | Build | `hugo --source site --minify` |
| 5 | `azure/login@v3` | `client-id`, `tenant-id`, `subscription-id` from the three secrets |
| 6 | Deploy infrastructure (`id: infra`) | `az deployment group create --resource-group "$AZURE_RESOURCE_GROUP" --name stpauls-web --template-file infra/main.bicep --parameters infra/main.bicepparam --query properties.outputs -o json`, then `jq -r` `.name.value` to output `name` and `.defaultHostname.value` to output `hostname`, and append `Site: https://<hostname>` to `$GITHUB_STEP_SUMMARY`. `AZURE_RESOURCE_GROUP` comes from `vars` via `env` |
| 7 | Read deployment token (`id: token`) | `token=$(az staticwebapp secrets list --name "$NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query properties.apiKey -o tsv)`, then the two `echo` lines the test pins, in that order |
| 8 | `Azure/static-web-apps-deploy@v1` | `azure_static_web_apps_api_token: ${{ steps.token.outputs.token }}`, `action: upload`, `app_location: site/public`, `output_location: ""`, `skip_app_build: true` |

- [ ] **Step 4: Run the tests and actionlint**

Run: `python3 -m unittest discover -s tests -v && actionlint .github/workflows/deploy.yml`
Expected: all tests OK; actionlint prints nothing and exits 0.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml tests/test_workflow.py
git commit -m "Add deploy workflow with OIDC sign in"
```

---

### Task 6: Setup how-to and hand-off

**Files:**
- Create: `docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md`
- Create: `tests/test_docs.py`
- Modify: `CLAUDE.md` (Repo layout, Environment notes, Open items)

**Interfaces:**
- Consumes: secret and variable names (Task 5), media folder (Task 3), resource group `rg-stpauls-web`, OIDC subject `repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main`.

- [ ] **Step 1: Write the failing tests in `tests/test_docs.py`**

```python
def test_mentions_every_secret_and_variable(self):
    for name in set(re.findall(r"\$\{\{\s*(?:secrets|vars)\.(\w+)", WF)):
        self.assertIn(name, DOC)

def test_federated_subject_is_exact(self):
    self.assertIn("repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main", DOC)

def test_no_em_dash(self):
    self.assertNotIn("\u2014", DOC)  # em dash
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_docs.py' -v`
Expected: `FileNotFoundError` for the how-to.

- [ ] **Step 3: Write the how-to**

Front matter `tags: [how-to, stpauls]`, `status: draft`. H1 "How to set up Azure and Pages CMS for the editor trial". One numbered section per manual step 2 to 7, each with the `az` command or the exact portal or GitHub page, then:

| Section | Must say |
|---|---|
| Before you start | Needs Owner (or User Access Administrator) on the subscription to assign the role, and admin on the GitHub repo |
| Identity | `az ad app create`, `az ad sp create`, `az ad app federated-credential create` with issuer `https://token.actions.githubusercontent.com`, the subject above (case-sensitive), audience `api://AzureADTokenExchange`; `az role assignment create --role Contributor` scoped to the resource group |
| GitHub | Table of the four names, where each value comes from, and secret or variable. Plus: no ruleset or branch protection may require pull requests on `main`, or Pages CMS saves fail |
| First run | Actions, Deploy, Run workflow on `main`; site URL is in the run summary |
| Pages CMS | Install the app on `SvenPam/StPauls` only; Notices shows the three seed notices and no `_index.md`; invite the editor by email under Collaborators |
| Trial | Checklist matching the Acceptance section: add a notice with an image, edit it, delete it, add one dated next month. Allow 5 minutes per change. Record go or no-go as a new row in the Decisions table of `docs/features/page-cms/page-cms-discovery-way-forward.md` |
| Troubleshooting | `AADSTS70021` at sign in means the subject does not match; a failed Pages CMS save usually means a branch rule; a Pages CMS config error names the key to fix in `.pages.yml` |

- [ ] **Step 4: Update `CLAUDE.md`**

Repo layout: drop "(to be created in spec 00)" from `site/`, `infra/` and `.pages.yml`; add rows for `tests/` and `.github/workflows/deploy.yml`. Environment notes: replace the "check whether Hugo and Bicep can be installed" advice with the PyPI and NuGet install lines from Global Constraints. Open items: remove the default branch item (done).

- [ ] **Step 5: Run everything**

Run: `python3 -m unittest discover -s tests -v && actionlint .github/workflows/deploy.yml && hugo --source site --minify --destination "$(mktemp -d)"`
Expected: all tests OK with none skipped (Bicep on `PATH`), actionlint silent, Hugo exits 0.

- [ ] **Step 6: Commit and push the branch**

```bash
git add docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md tests/test_docs.py CLAUDE.md
git commit -m "Add Azure and Pages CMS setup how-to"
git push -u origin <session branch>
```

- [ ] **Step 7: Hand off to the maintainer**

Report in a few lines: what ran locally (tests, Hugo build, Bicep build and lint, actionlint), what could not (Azure deploy, Pages CMS validation, every Acceptance item after the first), and that the work is blocked on merging to `main` and manual steps 2 to 7. Link the how-to. Do not open a pull request unless asked.
