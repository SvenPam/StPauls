---
date: 2026-10-18
tags: [plan, stpauls, eleventy]
status: draft
---

# Switch from Hugo to Eleventy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild what specs 00 to 03 shipped in Hugo as an Eleventy 3 site with identical URLs and pages, deploy it with a narrowly scoped OIDC identity, and rewrite specs 04 to 12 and the shared docs for Eleventy.

**Architecture:** Eleventy reads Paul's content straight from `site/content/` (or a test fixture folder) and treats every `.md` file as an HTML body published untouched. Layouts, site-owned pages (topic pages, feeds, 404) and data live in `site/`, wired in by small modules in `config/`, as in tranquility. The workflow builds and tests in one job with no Azure rights, and a separate deploy job, the only one allowed to request an OIDC token, runs Bicep and uploads the built artifact.

**Tech Stack:** Node 26, Eleventy 3.1.6, Nunjucks, sharp, clean-css, terser, yaml, Playwright Test with `playwright-bdd`, `node:test`, Bicep, GitHub Actions.

**Spec:** the maintainer's request of 2026-10-18 (decisions copied into the table below), [page-cms-feature.md](page-cms-feature.md), [page-cms-spec-conventions.md](page-cms-spec-conventions.md), and the behaviour specs 02 and 03 already pin in `tests/features/`.

---

## Decisions

From the maintainer unless marked _builder's call_. Not reopened in this plan.

| Topic | Decision |
|---|---|
| Generator | Eleventy 3.x, exact-pinned. Node 26, as tranquility |
| npm | Allowed in the build, provided `npm audit` runs and Dependabot updates npm and GitHub Actions |
| Audit | Runs in CI, never blocks a deploy. Fails only the scheduled weekly run |
| Deploy identity | OIDC sign-in and deploy-time token read kept. Custom role on the Static Web App resource: `staticSites` read and write, `customDomains/*`, `listSecrets/action` |
| Bicep | Stays in CI. A second custom role at resource group scope grants `Microsoft.Resources/deployments/*` only |
| Jobs | Build and deploy are separate jobs. Only deploy has `id-token: write` |
| Everything else | Content model, URLs, Pages CMS, Web3Forms, Cloudflare, cutover, no personal details: unchanged |
| Spike (2026-10-18) | Passed: Node 26.12.0 from `npm i node@26`; HTML bodies (indented HTML after a blank line, `*`, `{{ }}`) publish untouched; topic pages, RSS and sitemap work; layouts outside the content folder and `addTemplate` virtual pages work |
| One `package.json` | _Builder's call:_ one root `package.json` and lockfile for build and tests, so one `npm ci`, one audit and one Dependabot entry. `tests/package.json` goes. **Maintainer to confirm in review** |
| Test runners | _Builder's call:_ Playwright and Gherkin scenarios stay for behaviour, as CLAUDE.md requires. `node:test` is added in `tests/unit/` for pure functions and generated config (dates, `staticwebapp.config.json`, the workflow), as tranquility does. There are no Python tests on `main` to keep |
| Hugo URL quirk | _Builder's call:_ the URL name is the file name with its date prefix kept (`2026-10-17-x.md` gives `/notices/notice/2026-10-17-x`), as Hugo did. Eleventy's own `fileSlug` drops the date, so it is not used |
| Time zone | _Builder's call:_ front matter times are London wall-clock times, as in Hugo (`timeZone = 'Europe/London'`). Eleventy reads them as UTC, so display uses UTC getters and anything compared with "now" goes through `londonInstant` |
| Asset names | _Builder's call:_ fingerprint in the file name (`/css/site.<hash>.css`) with an `integrity` attribute, as Hugo did, rather than tranquility's `?v=` query. Names never change for the same bytes, so they can be cached `immutable` in spec 09 |

## Global Constraints

- Node `26` everywhere: `.nvmrc` holds `26`, `package.json` has `"engines": { "node": ">=26" }`, the workflow uses `node-version-file: .nvmrc`.
- Exact versions only (no `^` or `~`), `.npmrc` with `save-exact=true`. Pins: `@11ty/eleventy` `3.1.6`, `sharp` `0.35.5`, `clean-css` `5.3.3`, `terser` `5.51.2`, `yaml` `2.9.1`, `@playwright/test` `1.56.1` (matches sandbox Chromium), `playwright-bdd` `8.5.1`. `overrides`: `chokidar` `4.0.3`, `argparse` `2.0.1` (without them `npm audit` reports 1 high, 1 moderate).
- `npm audit` reports 0 vulnerabilities at the end of every task that touches `package.json`.
- URLs identical to what Hugo built on `main` at `5063ce3`. Internal links have no trailing slash except `/`.
- Bodies are published byte for byte. No Markdown and no Nunjucks runs on any `.md` file.
- No inline `<script>`, `<style>`, `style=` or `on*=` in templates. One stylesheet under 25000 bytes, one deferred script under 2048 bytes, both with `integrity="sha256-..."`.
- Tests never assert on `site/content/` or `site/data/settings.yaml`, except "Whatever Paul has saved builds".
- None of the `BANNED` strings in `tests/steps/site.js` anywhere in the built site.
- Docs: front matter, one H1, italic one-line summary, tables over prose, no em dashes, file names without `:`, `/`, `#`, `^`.
- Commits: short imperative sentence, no `feat:` prefix, the session's attribution lines. Work on `ccr-468dc11c-uctizw`. No push to `main`, no pull request.

## Review Focus

1. **Summer time.** An event ending 12:00 London time in June must be hidden from 12:00 BST (11:00 UTC), not an hour later. Pinned by a new calendar scenario at `2099-06-01T12:30:00+01:00` (Task 3) and `londonInstant` unit tests (Task 3).
2. **Pages CMS end times without seconds, or empty.** `end: 2026-10-17T19:30` arrives as a string, `end: ""` as an empty string. Both must render, falling back to the start when unreadable. Pinned by `eventEnd` unit tests (Task 3).
3. **Dated file names.** A Pages CMS save named `2026-01-05-dated.md` must publish at `/notices/notice/2026-01-05-dated`, not `/notices/notice/dated`. Pinned by a new notices scenario (Task 1).
4. **Template syntax in a body.** A body containing `{{ site }}` or `{% include %}` must show those characters, not run them or fail the build. Pinned by a new notices scenario (Task 1).
5. **A compromised npm package in the build.** It must not be able to get an Azure token or run in the job that has one. Pinned by workflow unit tests: only `deploy` has `id-token: write`, `deploy` runs no `npm`, `npx` or `node`, and `deploy` does not need `audit` (Task 6).

---

## File structure

| Path | Responsibility | Task |
|---|---|---|
| `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc` | Toolchain, scripts `build`, `test`, `test:unit`, `test:bdd`, `audit` | 1 |
| `eleventy.config.js` | Directories, loads every `config/*.js` in name order | 1 |
| `config/content.js` | Raw `.md` extension, URLs, `section`, `isIndex`, section collections | 1 |
| `config/data.js` | Global data from `site/data/*.yaml` | 1 |
| `config/pages.js` | Registers every `site/pages/*.njk` with `addTemplate` | 1 |
| `config/assets.js` | Passthrough `site/static/`, CSS and JS bundles with hash and integrity | 2 |
| `config/images.js` | `picture` shortcode: WebP and original at 480/800/1200/1600 | 2 |
| `config/filters.js` | `href`, `plainText`, `excerpt` | 2, 4 |
| `config/dates.js` | London time, date formats, `eventEnd`, `eventStatus`, `upcoming` | 3 |
| `config/swa.js` | Writes `staticwebapp.config.json` after the build | 5 |
| `site/_includes/*.njk` | `base`, `content` (dispatch), `partials/*`, `sections/*` | 1 to 4 |
| `site/pages/*.njk` | Home stub, 404, topic pages, topic indexes, feeds | 1, 3, 4 |
| `site/data/topics.yaml`, `site/data/menus.yaml` | Topics (unchanged), header and footer menus moved out of `hugo.toml` | 1, 2 |
| `tests/serve.js` | Builds a fixture folder with Eleventy and serves it | 1 |
| `tests/unit/*.test.mjs` | `node:test`: dates, filters, SWA config, workflow, roles | 3 to 7 |
| `.github/workflows/deploy.yml`, `.github/dependabot.yml` | Build, audit, deploy jobs. npm and Actions updates | 6 |
| `infra/roles/*.json` | The two custom role definitions | 7 |
| `scripts/screenshots.mjs`, `scripts/compare-hugo.mjs` | Hand-run: screenshots, Hugo parity check | 8 |

Deleted at the end (Task 8): `site/hugo.toml`, `site/layouts/`, `site/static/staticwebapp.config.json`, `tests/package.json`, `tests/package-lock.json`, `scripts/screenshots.py`.

---

## Phase A: port specs 00 to 03

### Task 1: Toolchain, raw content and URLs

**Files:**
- Create: `package.json`, `.npmrc`, `.nvmrc`, `eleventy.config.js`, `config/content.js`, `config/data.js`, `config/pages.js`, `site/_includes/base.njk`, `site/_includes/content.njk`, `site/_includes/sections/{blog,calendar,notices}-{list,item}.njk` (minimal: `<h1>` and `<div class="prose">`), `site/pages/home.njk`, `site/pages/404.njk`, `tests/fixtures/content/notices/2026-01-05-dated.md`, `tests/fixtures/content/notices/syntax.md`
- Modify: `tests/serve.js`, `tests/playwright.config.js`, `tests/steps/editor.js` (real content build), `.gitignore` (`_site/`, `.cache/`, remove Hugo lines)
- Delete: `tests/package.json`, `tests/package-lock.json`
- Test: `tests/features/notices.feature`, `blog.feature`, `calendar.feature`, `editor.feature` (URL and body scenarios)

**Interfaces:**
- Produces: `CONTENT_DIR` (`process.env.CONTENT ?? 'site/content'`), `sectionOf(inputPath): string` (folder under the content dir, `''` at its root), `isIndex(inputPath): boolean` (basename `_index`), `itemPermalink(inputPath, data): string | false`. Global data and computed keys on every `.md`: `section`, `isIndex`, `layout: 'content.njk'`. Collections `blog`, `calendar`, `notices`: items only (no `_index.md`), date ascending.
- URL rules for `itemPermalink`: `_index.md` in a section gives `/{section}/index.html`; an item gives `{data.url}/index.html` when `url` is set (trailing slash trimmed first), else `/blog/article/{name}/index.html`, `/calendar/event/{name}/index.html`, `/notices/notice/{name}/index.html`, where `{name}` is the file basename without `.md`, date prefix kept. Any other `.md` returns `false` for now (spec 04 adds pages).
- `content.njk` includes `sections/{section}-list.njk` or `sections/{section}-item.njk` and extends `base.njk`. Site pages in `site/pages/` set their own `layout` and `permalink`; feeds set `layout: false`.
- `npm run build` writes `_site/`. `tests/serve.js <content dir> <port>` runs `npx @11ty/eleventy --output=<tmp> --quiet` with `CONTENT=<content dir>` from the repo root.

- [ ] **Step 1: Add the two new fixtures and scenarios**

`tests/fixtures/content/notices/2026-01-05-dated.md`: `title: Fixture dated`, `date: 2015-01-05`. `syntax.md`: `title: Fixture syntax`, `date: 2015-01-04`, body `<p>Braces {{ site.title }} and {% include "base.njk" %} stay</p>`. In `notices.feature`:

```gherkin
  Scenario: A Pages CMS file name keeps its date in the URL
    Then "/notices/notice/2026-01-05-dated" exists
    And "/notices/notice/dated" does not exist

  Scenario: Template syntax in a body is shown as written
    When I open "/notices/notice/syntax"
    Then I see "Braces {{ site.title }} and {% include \"base.njk\" %} stay"
```

Append `Fixture dated` then `Fixture syntax` to the end of the "Newest first" card table: both are older than `Fixture wide...` (2015-06-01), the oldest today. Bump the notices feed count in `feeds.feature` from 5 to 7.

- [ ] **Step 2: Root toolchain**

`package.json` (`"type": "module"`, `"private": true`) with the Global Constraints pins and scripts: `build: "eleventy"`, `test: "npm run test:unit && npm run test:bdd"`, `test:unit: "node --test \"tests/unit/**/*.test.mjs\""`, `test:bdd: "cd tests && bddgen && playwright test"`, `audit: "npm audit"`. Run `npm install` under Node 26 (sandbox: `npm i node@26` in the scratchpad, put its `.bin` first on `PATH`), then `npm audit`.
Expected: `found 0 vulnerabilities`.

- [ ] **Step 3: Point the tests at Eleventy and run them**

Change `tests/serve.js` to the Interfaces command; keep its static server as is. `playwright.config.js` keeps its two sites. `editor.js` "the real content builds" runs the same command with no `CONTENT`.
Run: `npm run test:bdd`
Expected: FAIL, the servers cannot build (no `eleventy.config.js`).

- [ ] **Step 4: Implement `eleventy.config.js`, `config/content.js`, `config/data.js`, `config/pages.js`, the minimal layouts, home stub and 404**

`eleventy.config.js` copies tranquility's loader. Its exported `config`: `dir.input = CONTENT_DIR`, `dir.includes = path.relative(CONTENT_DIR, 'site/_includes')`, `dir.output = '_site'`, `templateFormats: ['md', 'njk']`, `htmlTemplateEngine: 'njk'`. `config/content.js` registers `addExtension('md', { compile: (body) => () => body })` so bodies skip Markdown and Nunjucks (spike-proven). `config/data.js` loads each `site/data/*.yaml` as a global named after the file. `config/pages.js` reads `site/pages/*.njk` and calls `addTemplate(name, source)`. Home stub and 404 copy the Hugo markup from `site/layouts/home.html` and `404.html`.

- [ ] **Step 5: Run the URL and body scenarios**

Run: `npm run test:bdd -- --grep "URL|exists|body|syntax|date in the URL"`
Expected: the URL, migrated URL, raw body and new scenarios PASS. Layout, list and menu scenarios still fail (Tasks 2 and 3).

- [ ] **Step 6: Commit**

```bash
git add -A package.json package-lock.json .npmrc .nvmrc .gitignore eleventy.config.js config site/_includes site/pages tests
git commit -m "Build the site with Eleventy and publish bodies untouched"
```

### Task 2: Shell, menus, stylesheet, script and pictures

**Files:**
- Create: `config/assets.js`, `config/images.js`, `config/filters.js`, `site/data/menus.yaml`, `site/_includes/partials/{head,header,footer}.njk`
- Modify: `site/_includes/base.njk`
- Move unchanged: `site/assets/css/*.css`, `site/assets/js/site.js`, `site/assets/images/map.png`, `site/static/favicon.ico`, `site/static/fonts/muli.woff2`, `site/static/uploads/.gitkeep`
- Test: `tests/features/menu.feature`, `layout.feature`; `tests/unit/filters.test.mjs`, `tests/unit/images.test.mjs`

**Interfaces:**
- Consumes: Task 1 layouts and global data.
- Produces: filter `href(url: string): string`. Global `assets: { css: { url, integrity }, js: { url, integrity } }`, built in `eleventy.before`: CSS is `site/assets/css/*.css` concatenated in name order, minified with clean-css level 1, written to `/css/site.<first 10 hex of sha256>.css`; JS is `site/assets/js/site.js` minified with terser, written to `/js/site.<hash>.js`; `integrity` is `sha256-<base64>`. Async shortcode `picture({ src, alt, sizes = '100vw', eager = false })` where `src` is relative to `site/assets/` (`images/map.png`). Global `menus: { main: [{ name, url, children: [{ name, url }] }], footer: [{ title, links: [{ name, url }] }] }` from `menus.yaml`, same items and order as `hugo.toml` today.
- `picture` output: widths from `[480, 800, 1200, 1600]` that are no wider than the source, or the source width alone if all are wider. One `<source type="image/webp" srcset sizes>`, an `<img>` with original-format `srcset`, `src` of the largest width up to 800, its `width` and `height`, `alt`, `decoding="async"`, `loading="lazy"` unless `eager`. Files written as `/images/{name}-{width}.<hash8>.{webp,png}`, cached in `.cache/images/` keyed on source hash, width, format and quality.

- [ ] **Step 1: Write the unit tests**

```js
// tests/unit/filters.test.mjs
test('href drops a trailing slash except on the root', () => {
  assert.equal(href('/blog/article/a8/'), '/blog/article/a8');
  assert.equal(href('/'), '/');
  assert.equal(href('https://example.org/'), 'https://example.org/');
});
// tests/unit/images.test.mjs, with a 1000x500 PNG written by sharp into a temp folder
test('picture offers WebP and PNG at every width up to the source', async () => {
  const html = await pictureHtml({ src: 'images/t.png', alt: 'T', sizes: '50vw' }, { assets: tmp, out });
  assert.match(html, /<source type="image\/webp" srcset="[^"]*-480\.\w{8}\.webp 480w, [^"]*-800\.\w{8}\.webp 800w"/);
  assert.match(html, /<img src="[^"]*-800\.\w{8}\.png"[^>]* width="800" height="400"[^>]* alt="T"[^>]* loading="lazy"/);
  assert.doesNotMatch(html, /1200w/);
});
test('a source narrower than 480 is offered at its own width', async () => { /* 300x150 gives one 300w entry, width="300" */ });
test('eager drops lazy loading', async () => { /* eager: true gives no loading= */ });
```

`pictureHtml(opts, { assets, out })` is the shortcode's testable core, exported from `config/images.js`.

- [ ] **Step 2: Run them to see them fail**

Run: `npm run test:unit`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `config/filters.js`, `config/images.js`, `config/assets.js`, `menus.yaml` and the partials**

Partials are the Hugo partials `head.html`, `header.html`, `footer.html` rewritten in Nunjucks with identical markup, reading `menus` and `assets`. `aria-current="page"` compares `href(page.url)`. The copyright year comes from a global `build.year`, as in tranquility.

- [ ] **Step 4: Run unit and shell scenarios**

Run: `npm run test:unit && npm run test:bdd -- --grep "menu|Menu|stylesheet|skip link|personal|sideways|trailing slash"`
Expected: PASS. Stylesheet under 25000 bytes, script under 2048 bytes (2182 unminified today, so terser is needed).

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Port the site shell, menus, assets and pictures to Eleventy"
```

### Task 3: Blog, calendar and notices pages

**Files:**
- Create: `config/dates.js`, `site/_includes/partials/{card,topic-link,blog-aside}.njk`, `site/pages/topics.njk` (term pages), `site/pages/topic-index.njk` (`/blog/topic`, `/calendar/topic`, `/notices/topic`)
- Modify: `site/_includes/sections/*.njk` (full Hugo markup)
- Test: `tests/features/blog.feature`, `calendar.feature`, `notices.feature`; `tests/unit/dates.test.mjs`

**Interfaces:**
- Consumes: collections, `href`, `picture`, `topics`.
- Produces, all taking a front matter `Date` read as UTC that means London wall time:
  - `londonOffset(wall: Date): string` such as `'+01:00'`, `londonInstant(wall: Date): Date`
  - filters `date` (`'01-Aug-15'`), `time` (`'10:00 AM'`), `month` (`'June'`), `day` (`'1'`), `isoLondon` (`'2099-06-01T12:00:00+01:00'`), `rfc822London` (`'Mon, 01 Jun 2099 10:00:00 +0100'`)
  - `eventEnd(data): Date`: `data.end` as a `Date`, or a string `YYYY-MM-DDTHH:MM[:SS]` read as wall time; missing, empty, unreadable or before `data.date` gives `data.date`
  - `eventStatus(data, now = Date.now()): 'Expired' | 'Active' | 'Soon' | 'Future'`, comparing `londonInstant` values, `Soon` within 168 hours, as `event-status.html`
  - `upcoming(items, now = Date.now())`: items whose end has not passed, soonest first
  - topic pages: one per section and slug in `topics`, at `/blog/topic/{slug}`, `/calendar/topic/{slug}`, `/notices/topic/{slug}`; calendar topic pages use `upcoming`
  - Card `data-end` is `eventEnd | isoLondon`, so `site.js` keeps working unchanged

- [ ] **Step 1: Write the unit tests and the summer time scenario**

```js
test('London is +00:00 in winter and +01:00 in summer', () => {
  assert.equal(londonOffset(new Date('2099-01-15T12:00:00Z')), '+00:00');
  assert.equal(londonOffset(new Date('2099-06-01T12:00:00Z')), '+01:00');
  assert.equal(londonInstant(new Date('2099-06-01T12:00:00Z')).toISOString(), '2099-06-01T11:00:00.000Z');
});
test('the hour after the clocks go back is read as GMT', () => {
  assert.equal(londonInstant(new Date('2026-10-25T01:30:00Z')).toISOString(), '2026-10-25T01:30:00.000Z');
});
test('eventEnd reads Pages CMS strings and falls back to the start', () => {
  const date = new Date('2026-10-17T18:00:00Z');
  assert.equal(eventEnd({ date, end: '2026-10-17T19:30' }).toISOString(), '2026-10-17T19:30:00.000Z');
  assert.equal(eventEnd({ date, end: '' }), date);
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
```

In `calendar.feature`:

```gherkin
  Scenario: An event is hidden from its London end time in summer
    Given it is "2099-06-01T12:30:00+01:00"
    When I open "/calendar"
    Then I do not see "Fixture future"
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "Blog|Calendar|Notices"`
Expected: FAIL.

- [ ] **Step 3: Implement `config/dates.js`**

`londonInstant`: take the wall time's UTC fields as a guess instant, read the Europe/London offset at that instant with `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })`, subtract it, then re-read the offset at the result and use that if it differs (covers both clock changes). Formats use UTC getters only.

- [ ] **Step 4: Port the section templates, card, aside, topic link and topic pages**

Same markup and classes as the Hugo files of the same name. Blog and notices lists are newest first, the aside has the 7 newest articles, the topic link shows nothing for a missing or unknown topic.

- [ ] **Step 5: Run everything so far**

Run: `npm run test:unit && npm run test:bdd`
Expected: PASS except `feeds.feature`.

- [ ] **Step 6: Commit**

```bash
git add config site tests
git commit -m "Port blog, calendar and notices pages with London event times"
```

### Task 4: RSS feeds

**Files:**
- Create: `site/pages/feeds.njk`
- Modify: `config/filters.js`
- Test: `tests/features/feeds.feature`; `tests/unit/filters.test.mjs`

**Interfaces:**
- Consumes: collections, `upcoming`, `rfc822London`, `href`.
- Produces: `plainText(html: string): string` (tags removed, `&amp; &lt; &gt; &quot; &#39; &nbsp;` and numeric entities decoded, whitespace collapsed, trimmed), `excerpt(html, max = 300)` (`plainText`, cut at `max` code points with `…` appended when cut). Feeds at `/blog/index.xml`, `/calendar/index.xml`, `/notices/index.xml`: RSS 2.0, up to 20 items, newest first (calendar: `upcoming`), `<link>` and `<guid>` absolute without a trailing slash on `https://stpaulswarton.co.uk`, description `summary` or `excerpt(body)`, escaped once by Nunjucks autoescape.

- [ ] **Step 1: Write the unit tests**

```js
test('plainText decodes entities once', () => {
  assert.equal(plainText("<p>Tea &amp; cake at St Paul&#39;s&nbsp;hall</p>"), "Tea & cake at St Paul's hall");
});
test('excerpt cuts long text at 300 characters', () => {
  assert.equal([...excerpt(`<p>${'a'.repeat(400)}</p>`)].length, 301);
  assert.equal(excerpt('<p>short</p>'), 'short');
});
```

- [ ] **Step 2: Run, see them fail, implement, run `npm test`**

Expected after implementing: all unit tests and every scenario PASS.

- [ ] **Step 3: Commit**

```bash
git add config site tests
git commit -m "Port the section RSS feeds"
```

### Task 5: Generated Static Web Apps config

**Files:**
- Create: `config/swa.js`, `tests/unit/swa-config.test.mjs`
- Delete: `site/static/staticwebapp.config.json`

**Interfaces:**
- Produces: `buildSwaConfig(outDir = '_site'): Promise<object>`, run in `eleventy.after`, writing `staticwebapp.config.json` with the same content as today: `routes: [{ route: '/', redirect: '/notices/', statusCode: 302 }]`, `responseOverrides: { '404': { rewrite: '/404.html', statusCode: 404 } }`. Spec 05 adds `trailingSlash` and generated routes here.

- [ ] **Step 1: Write the tests, from tranquility's `swa-config.test.mjs`, against a fixture build in a temp folder**

Tests: parses and is under 20 KB; the 404 rewrite target exists in the build; every local redirect target exists; route values are unique exactly as written (matching is case-sensitive); no route contains `%XX` (Azure matches the decoded path).

- [ ] **Step 2: Run, see them fail, implement, run `npm test`**

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add config site tests
git commit -m "Generate staticwebapp.config.json at build time"
```

### Task 6: Workflow with separate build, audit and deploy jobs

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Create: `.github/dependabot.yml`, `tests/unit/workflow.test.mjs`

**Interfaces:**
- Produces, in `deploy.yml`:
  - Triggers: `push` to `main` (paths add `config/**`, `eleventy.config.js`, `package.json`, `package-lock.json`, `.nvmrc`), `pull_request`, `workflow_dispatch`, nightly `'17 3 * * *'`, weekly audit `'41 4 * * 1'`.
  - Top level `permissions: { contents: read }`. No `id-token` at the top.
  - `build` (skipped on the weekly audit schedule): checkout with `persist-credentials: false`, setup-node from `.nvmrc` with npm cache, `npm ci`, `npx playwright install --with-deps chromium`, `npm run build`, `npm test`, upload `_site` as artifact `site`. Upload the Playwright report on failure.
  - `audit`: `npm ci --ignore-scripts`, `npm audit`. `continue-on-error: ${{ github.event.schedule != '41 4 * * 1' }}`, so only the weekly run goes red.
  - `deploy`: `needs: build`, `if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request' && github.event.schedule != '41 4 * * 1'`, `permissions: { id-token: write, contents: read }`, no `environment:`. Steps: checkout (for `infra/`), download artifact `site` to `_site`, `azure/login`, Bicep `az deployment group create` (unchanged), token read (unchanged), `Azure/static-web-apps-deploy` with `app_location: _site`. No npm, npx or node.
  - `dependabot.yml`: `npm` at `/` and `github-actions` at `/`, `monthly`, each with one group for all updates, `open-pull-requests-limit: 5`.

- [ ] **Step 1: Write the workflow tests, parsing the YAML with `yaml`**

```js
test('only the deploy job can request an Azure token', () => {
  assert.equal(wf.permissions['id-token'], undefined);
  for (const [name, job] of Object.entries(wf.jobs)) {
    assert.equal(job.permissions?.['id-token'] === 'write', name === 'deploy', name);
  }
});
test('the deploy job runs no npm code', () => {
  const runs = wf.jobs.deploy.steps.map((s) => s.run ?? '').join('\n');
  assert.doesNotMatch(runs, /\b(npm|npx|node)\b/);
  assert.ok(!wf.jobs.deploy.steps.some((s) => /setup-node/.test(s.uses ?? '')));
});
test('a deploy never waits on the audit', () => {
  assert.deepEqual([wf.jobs.deploy.needs].flat(), ['build']);
});
test('the audit fails only the weekly scheduled run', () => {
  assert.ok(wf.on.schedule.some((s) => s.cron === '41 4 * * 1'));
  assert.equal(wf.jobs.audit['continue-on-error'], "${{ github.event.schedule != '41 4 * * 1' }}");
  assert.ok(wf.jobs.audit.steps.some((s) => /^npm audit\b/.test(s.run ?? '')));
});
test('the deploy job keeps the OIDC subject', () => {
  assert.equal(wf.jobs.deploy.environment, undefined);
});
test('Dependabot updates npm and GitHub Actions', () => {
  assert.deepEqual(dependabot.updates.map((u) => u['package-ecosystem']).sort(), ['github-actions', 'npm']);
});
```

- [ ] **Step 2: Run, see them fail, rewrite `deploy.yml` and add `dependabot.yml`**

- [ ] **Step 3: Verify**

Run: `npm run test:unit && actionlint .github/workflows/deploy.yml` (actionlint from PyPI, see conventions).
Expected: PASS, no actionlint findings.

- [ ] **Step 4: Commit**

```bash
git add .github tests/unit
git commit -m "Split build and deploy so only deploy can sign in to Azure"
```

### Task 7: Scoped deploy roles

**Files:**
- Create: `infra/roles/stpauls-static-web-app-deployer.json`, `infra/roles/stpauls-template-deployer.json`, `tests/unit/roles.test.mjs`
- Modify: `docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md`, `infra/main.bicep` (comment only, no resource change)

**Interfaces:**
- Produces, as `az role definition create --role-definition @<file>` inputs (`assignableScopes` holds `/subscriptions/<SUB>/resourceGroups/<RG>`, filled in by the how-to with `sed`):
  - `StPauls Static Web App deployer`, `Actions`: `Microsoft.Web/staticSites/read`, `Microsoft.Web/staticSites/write`, `Microsoft.Web/staticSites/customDomains/*`, `Microsoft.Web/staticSites/listSecrets/action`. Assigned at the Static Web App resource ID.
  - `StPauls template deployer`, `Actions`: `Microsoft.Resources/deployments/*`. Assigned at the resource group.
- Action names were checked against `MicrosoftDocs/azure-docs` `articles/role-based-access-control/permissions/web-and-mobile.md` and `management-and-governance.md` on 2026-10-18. The how-to has the maintainer confirm with `az provider operation show --namespace Microsoft.Web --query "resourceTypes[?name=='staticSites'].operations[].name" -o tsv` and `az role definition list --custom-role-only true --query "[?roleName=='StPauls Static Web App deployer']"` (the sandbox cannot reach Azure).

- [ ] **Step 1: Write the role tests**

```js
test('the site role grants exactly the four actions', () => {
  assert.deepEqual(site.Actions.sort(), ['Microsoft.Web/staticSites/customDomains/*', 'Microsoft.Web/staticSites/listSecrets/action',
    'Microsoft.Web/staticSites/read', 'Microsoft.Web/staticSites/write']);
  assert.deepEqual(site.NotActions ?? [], []);
  assert.deepEqual(site.DataActions ?? [], []);
});
test('the template role grants deployments only', () => {
  assert.deepEqual(template.Actions, ['Microsoft.Resources/deployments/*']);
});
```

- [ ] **Step 2: Run, see them fail, add the two files**

- [ ] **Step 3: Rewrite the role section of the Azure how-to**

Replace the `Contributor` assignment with, in order: first-time Bicep deploy by the maintainer with their own rights (the resource must exist before a role can be assigned on it); create both roles; assign them (`az role assignment create --assignee $APP_ID --role "StPauls Static Web App deployer" --scope $(az staticwebapp show -n swa-stpauls-web -g $RG --query id -o tsv)` and `--role "StPauls template deployer" --scope $(az group show -n $RG --query id -o tsv)`); remove the old `Contributor` assignment; confirm with `az role assignment list --assignee $APP_ID --all -o table`. Add troubleshooting rows: `AuthorizationFailed` on `deployments/write` (template role missing), on `staticSites/write` (site role missing or on the wrong scope), and on an async `operationResults` read during a custom domain add (add that single action, see spec 11).

- [ ] **Step 4: Run `npm run test:unit`, then commit**

```bash
git add infra docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md tests/unit
git commit -m "Scope the deploy identity to the Static Web App and deployments"
```

### Task 8: Hugo parity check, screenshots and removing Hugo

**Files:**
- Create: `scripts/compare-hugo.mjs`, `scripts/screenshots.mjs`
- Modify: `scripts/README.md`
- Delete: `site/hugo.toml`, `site/layouts/`, `scripts/screenshots.py`

**Interfaces:**
- Produces: `node scripts/compare-hugo.mjs <hugo out> <eleventy out>`: lists HTML and XML files present in only one build, and for files in both, a diff of the normalised text (asset hashes, `integrity` values, image file names and whitespace between tags replaced by placeholders). Exit 1 on any difference. Sandbox only.
- `node scripts/screenshots.mjs --out <dir> --width 390 --width 1280 <name>=<url> ...`: same arguments and output as the Python script, using `@playwright/test`'s `chromium` (sandbox finds `/opt/pw-browsers` through `PLAYWRIGHT_BROWSERS_PATH`).

- [ ] **Step 1: Build both from the fixtures and the real content**

Hugo 0.167.0 from PyPI into the scratchpad. Hugo: `git worktree add <scratch>/hugo 5063ce3`, then `hugo --source <scratch>/hugo/site --contentDir <fixtures> --destination <scratch>/h --minify` for `tests/fixtures/content` and for `site/content`. Eleventy: `CONTENT=<same> npx @11ty/eleventy --output=<scratch>/e`.

- [ ] **Step 2: Compare**

Run: `node scripts/compare-hugo.mjs <scratch>/h <scratch>/e` for each pair.
Expected: no difference, apart from the two fixtures added in Task 1 and any differences listed and explained in the hand-off (allowed: attribute order, entity spelling such as `&#39;` against `&rsquo;`). Every other difference is fixed in the Eleventy templates before going on.

- [ ] **Step 3: Screenshots**

Serve both builds and run `scripts/screenshots.mjs` at 390 and 1280 for `/notices`, `/notices/notice/newer`, `/blog`, `/blog/article/a8`, `/calendar`, `/calendar/event/future`, `/404.html`. Send the pairs to the maintainer.

- [ ] **Step 4: Delete the Hugo files, run `npm test` and `npm audit`**

Expected: all PASS, 0 vulnerabilities, `git grep -il hugo -- site config tests scripts .github` returns nothing.

- [ ] **Step 5: Commit**

```bash
git add -A scripts site
git commit -m "Remove Hugo after checking Eleventy builds the same pages"
```

---

## Phase B: docs

Each task is one commit. Every rewritten spec keeps its current shape: front matter, Goal, Starting point, In scope, Out of scope, Requirements, Manual steps, Acceptance, then Implementation plan with header, Global Constraints, Review Focus and TDD tasks. Python `unittest` examples become `node:test` for pure functions and generated files, and Gherkin for behaviour. Status stays `agreed`.

### Task 9: Conventions, design, CLAUDE.md and README

**Files:** `docs/features/page-cms/page-cms-spec-conventions.md`, `page-cms-feature.md`, `CLAUDE.md`, `README.md`, specs 00 to 03 (one-line note under the summary: "Built in Hugo, ported to Eleventy on 2026-10-18, see [the switch plan](page-cms-plan-eleventy-switch.md)". Bodies stay as the record).

- [ ] **Step 1: Conventions**

Replace the Build section (Eleventy, Node 26, exact pins, raw `.md` extension, `site/_includes/`, `site/pages/`, `config/`), the Hugo facts table (with Eleventy facts: `fileSlug` drops a date prefix; front matter times are UTC; `layout` front matter names a file in `site/_includes/`; global `eleventyComputed` applies to virtual templates, which set their own `permalink` and `layout`), the Site contract (partials become Nunjucks includes and the functions in this plan's Interfaces, Hugo params become `site/data/site.yaml`), the Tests section (`npm test` at the root, `tests/unit/` for `node:test`), the Azure section (two roles, build and deploy jobs), and Local tools (Node 26 from `npm i node@26`, Hugo only for the parity check). Add to the Static Web Apps facts, as verified against tranquility and ste-pam.com:

| Fact | Consequence |
|---|---|
| Route matching is case-sensitive: the exact-case legacy path 301s, the lower-cased one 404s | Each legacy case variant needs its own route. A redirect cannot loop on a target that differs in case. Replaces the "undocumented, use rewrite" row |
| Routes match the decoded path | Legacy routes with spaces are written with spaces, not `%20`. Redirect targets are encoded |
| On a custom domain SWA adds `strict-transport-security: max-age=10886400; includeSubDomains; preload` itself | A 5-minute HSTS only helps a rollback if our header replaces it. Spec 09 tests this on the `azurestaticapps.net` URL first |

- [ ] **Step 2: Design doc**

`page-cms-feature.md`: Hugo becomes Eleventy throughout; Images row uses `config/images.js` and sharp; Security Pipeline row: Actions pinned to SHAs (spec 09), Node from `.nvmrc`, `npm audit` weekly-blocking, Dependabot for npm and Actions monthly grouped, deploy-only OIDC with the two roles; Goal 6 and the "recurring chore" anti-goal note that merging the monthly Dependabot PRs is the one accepted chore (2026-10-18); "What exists now" updated; HSTS decision row points to spec 09's test.

- [ ] **Step 3: CLAUDE.md and README**

CLAUDE.md rows: Generator ("Eleventy 3.x, exact-pinned, Node 26. npm allowed with `npm audit` and Dependabot (2026-10-18, replaces Hugo)"), Infrastructure ("Bicep in `infra/`, run by the deploy job. OIDC sign-in in the deploy job only, with two custom roles: Static Web App deployer on the resource, template deployer on the resource group. No long-lived token stored as a secret"), Tests (root `npm ci && npm test`). Environment notes: Node 26 via `npm i node@26`. Repo layout gains `config/`, loses `site/hugo.toml`. Next steps unchanged (spec 04). README says Eleventy.

- [ ] **Step 4: Check and commit**

Run: `grep -rn -i 'hugo' CLAUDE.md README.md docs/features/page-cms/page-cms-spec-conventions.md docs/features/page-cms/page-cms-feature.md` and `grep -rnP '\x{2014}' docs CLAUDE.md README.md`.
Expected: Hugo only where history is described, no em dash.

### Task 10: Spec 04, pages, home and menus

Changes: `page/{type}/_index.md` read as page types by `config/content.js` (`pageTypes` collection, not rendered: `itemPermalink` returns `false`); `pages` collection with `/page/{type}/{name}`; `menuItems(collections)` and `footerGroups(collections)` in `config/menus.js` replace `site/data/menus.yaml` with the same shapes as Task 2; root `_index.md` is the home page (`sectionOf` gives `''`), the home stub and the `/` redirect in `config/swa.js` go; `layout: contact` and `layout: sitemap` name `site/_includes/contact.njk` and `sitemap.njk`; hero through `picture` with `eager: true` and a `fill` option. Tests become scenarios in `pages.feature` and `menu.feature`, and `menus.test.mjs` for the two functions.

### Task 11: Spec 05, URL parity

Changes: `trailingSlash: "never"` and routes from `site/data/legacy.yaml` in `buildSwaConfig`; exact-case routes per legacy variant (case-sensitive fact), `redirect` allowed where it cannot match its own target; legacy paths with spaces written decoded, targets encoded; one route per legacy upload file from the built `uploads/`; `sitemap.xml` from `site/pages/sitemap-xml.njk`; `scripts/check_urls.py` becomes `scripts/check-urls.mjs` (hand-run, never in CI). Tests in `swa-config.test.mjs` (size, uniqueness, decoded routes, every target exists, a new upload gets its route) plus scenarios for the site maps.

### Task 12: Spec 06, images and embeds

Changes: `picture` accepts `/uploads/...` from `site/static/uploads/`; an HTML transform rewrites `<img src="/uploads/...">` in bodies to `<picture>` (480/800/1200/1600, `width`, `height`, `sizes`, lazy except the first image in `main`), extending tranquility's single 1600 px WebP; other images are left alone and fit by CSS; embeds from `embed`, `embed_src` and `site/data/embeds.yaml`; workflow caches `.cache/images` with `actions/cache` keyed on `package-lock.json` and the image settings. Tests: `images.test.mjs` for the transform, scenarios for pages, image fixtures written with sharp.

### Task 13: Spec 07, content migration

Changes: `scripts/migrate.py` becomes `scripts/migrate.mjs` with `cheerio` `1.2.0` (exact-pinned dev dependency, audited like the rest), hand-run only; parsers and rewriters tested with `node:test` in `tests/unit/migrate.test.mjs` against `tests/fixtures/live/`; output front matter written with `yaml` so dates come out as Pages CMS writes them; everything else (dates export, report) unchanged.

### Task 14: Spec 08, contact form and site settings

Changes: `site/data/settings.yaml` loaded by `config/data.js`, with a `DATA` folder option layered over `site/data` for fixtures (fixture files win), and `tests/serve.js` gains a data folder argument; templates in Nunjucks; script additions stay in `site/assets/js/site.js` within 2048 bytes minified.

### Task 15: Spec 09, security and delivery

Changes: headers in `buildSwaConfig` `globalHeaders`; cache routes for `/css/*`, `/js/*`, `/images/*`, `/uploads/*`; Actions pinned to full SHAs (Dependabot keeps them current, so the "pinned and Dependabot" tasks merge); the Hugo checksum task goes (setup-node and `npm ci` with the lockfile replace it); budget tests stay as scenarios. **HSTS revised:** first task is a check on the `azurestaticapps.net` URL with a test header `max-age=300` deployed from a branch build: if `curl -sI` shows only ours, keep the plan; if it shows SWA's alongside or instead, record that the 5-minute HSTS cannot work, drop it, and make the spec 11 rollback rely on Cloudflare serving the old site over HTTPS (proxied, SSL mode Flexible) rather than plain HTTP.

### Task 16: Spec 10, editor rollout

Changes: wording only ("a form Hugo reads" becomes "a form the build reads"); round-trip check builds with `npm run build`; scenarios unchanged in kind.

### Task 17: Spec 11, cutover

Changes: Bicep gains `customDomain` (default empty) and `Microsoft.Web/staticSites/customDomains@2025-03-01` with `validationMethod: 'dns-txt-token'`, as tranquility; the deploy job applies it because Bicep stays in CI, and the site role already covers `customDomains/*`; runbook borrows tranquility's `docs/runbook-cutover.md` order (validate a week ahead, TXT record, Ready, flip); rollback follows the spec 09 HSTS result; `scripts/check-urls.mjs` against both hosts.

### Task 18: Spec 12, handover and decommission

Changes: HSTS to one year through `site/data/site.yaml` `hsts_max_age`, only if spec 09 found our header wins, otherwise SWA's default stays and the task records it; maintainer runbook covers merging the monthly Dependabot PRs, a red weekly audit, and the two roles; repo tidy removes the parity script once nothing needs it.

- [ ] **Steps for each of Tasks 10 to 18:** rewrite the spec with the changes listed, keep every live URL, requirement and acceptance line that does not depend on Hugo, then run `grep -n -i 'hugo\|unittest\|\.Params\|partial "' <spec>` (expected: no matches, except history) and `grep -nP '\x{2014}' <spec>` (expected: none), then commit as `Rewrite spec NN for Eleventy`.

### Task 19: Push and hand-off

- [ ] **Step 1:** `npm ci && npm test && npm audit` on Node 26. Expected: all PASS, 0 vulnerabilities.
- [ ] **Step 2:** `git push -u origin ccr-468dc11c-uctizw`.
- [ ] **Step 3:** Hand-off lists what was not run locally: `az` commands and role creation, Bicep deployment, the workflow on GitHub (only actionlint and the unit tests ran), Pages CMS, and the deploy to the test URL. Also the maintainer's manual steps: create and assign the two roles, remove `Contributor`, turn on Dependabot security updates in the repo settings, merge when happy.

---

## Self-review

| Check | Result |
|---|---|
| Spec coverage | Spike (done), port of 00 to 03 (Tasks 1 to 8), Bicep in CI with scoped roles (6, 7), separate jobs (6), audit not blocking (6), Dependabot (6), `az` commands in the how-to (7), workflow tests (6), CLAUDE.md rows (9), conventions facts (9), specs 04 to 12 (10 to 18), feature doc (9) |
| Open for the maintainer | One root `package.json` (Decisions). Dependabot cadence monthly. Weekly audit cron `41 4 * * 1` |
| Not runnable here | Azure, `az`, Pages CMS, GitHub Actions. Task 19 says so |
