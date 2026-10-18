---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 05: URL parity

_One session. Makes every live URL resolve exactly as it does today, without trailing slashes, adds the XML and HTML site maps, handles old mixed-case, account and upload links, and adds a URL check script for migration and cutover. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

Every URL in the live sitemap, and every old link variant seen in live markup, either serves the same page with 200 or is redirected on purpose, and a script can prove it against a build or a deployed site.

## Starting point

- Specs 00 to 04 on `main`, on Eleventy. Internal links have no trailing slash (the `href` filter), but Static Web Apps serves both `/x` and `/x/` with 200, so search engines see duplicates.
- `config/swa.js` `buildSwaConfig(outDir)` writes `staticwebapp.config.json` after every build with `routes: []` and the 404 `responseOverrides` (spec 04 removed the `/` redirect). There is no static copy.
- `site/data/site.yaml` holds only `title`. Feeds write absolute links on a hard-coded `https://stpaulswarton.co.uk`.
- `config/menus.js` has `menuItems` and `footerGroups` (spec 04). The footer already links to `/sitemap`, which does not exist yet.
- `tests/unit/swa-config.test.mjs` builds the fixtures and already checks size, unique routes, no percent-encoded route, the 404 override and that local redirect targets exist.
- Live: 116 URLs in `http://stpaulswarton.co.uk/sitemap.xml`, an HTML site map at `/sitemap`, and links in live markup to `/Calendar`, `/Notices`, `/Contact`, `/Account/Login`, `/Account/Register`.
- [Checked facts](page-cms-spec-conventions.md#azure-static-web-apps): file paths and route matching are case-sensitive, routes match the decoded path, redirects cannot use captures, `trailingSlash: "never"` 301s `/x/` to `/x`, the config is limited to 20 KB.

## In scope

- `url` in `site/data/site.yaml`. Canonical link on every page.
- `buildSwaConfig` with `trailingSlash: "never"` and routes from `site/data/legacy.yaml`, plus one generated route per legacy upload file.
- `sitemap.xml` with no trailing slashes, `robots.txt`, and an HTML `/sitemap` page.
- `tests/fixtures/live-urls.txt`, a snapshot of the live sitemap paths plus the variants above.
- `scripts/check-urls.mjs`, run by hand against a build or a deployed host.

## Out of scope

Copying the legacy upload files (spec 07 puts them in `site/static/uploads/legacy/`, and this spec's generator then routes them). Security and cache headers (09). The custom domain (11).

---

## Requirements

### `site/data/legacy.yaml`

```yaml
# Static Web Apps matches routes case-sensitively, so each spelling seen on live has its own route.
# Paths are written decoded (spaces as spaces). Targets are encoded.
rewrites: []
redirects:
  - { from: /Calendar, to: /calendar }
  - { from: /Notices, to: /notices }
  - { from: /Contact, to: /contact }
  - { from: /Blog, to: /blog }
  - { from: "/account*", to: "/" }
  - { from: "/Account*", to: "/" }
# Each file under uploads/legacy/ in the build gets a 301 from every prefix below.
upload_prefixes:
  - /Areas/st_pauls/Uploads
  - /Areas/St_Pauls/Uploads
```

| Key | What | Route written |
|---|---|---|
| `rewrites` | Serve `to` with 200 at `from`. Kept for a case a redirect cannot do; empty today | `{ route, rewrite }` |
| `redirects` | 301 from `from` to `to`. Allowed only where `to` can never match `from` exactly as written: routes are case-sensitive, so `/Calendar` to `/calendar` cannot loop | `{ route, redirect, statusCode: 301 }` |
| `upload_prefixes` | Legacy upload folders, in every spelling seen on live | See below |

### Generated `staticwebapp.config.json`

| | |
|---|---|
| How | `buildSwaConfig(outDir = '_site', data = readData())` in `config/swa.js`, called from `eleventy.after` as today. `readData()` is a new named export of `config/data.js` that returns every `site/data/*.yaml` as `{ name: parsed }` (spec 08 layers the `DATA` folder over it, spec 09 reads `site` and `embeds` from it) |
| `trailingSlash` | `"never"` |
| `routes` | Each rewrite, then each redirect, then the upload routes |
| Upload routes | For each file under `<outDir>/uploads/legacy/`, sorted, and each prefix: `{ route: '{prefix}/{path}', redirect: '/uploads/legacy/{path, each segment encodeURIComponent}', statusCode: 301 }`. `{path}` is the file's path under `uploads/legacy/`, decoded, with `/` separators. Nothing else under `uploads/` gets a route |
| `responseOverrides` | `404`: `{ rewrite: '/404.html', statusCode: 404 }` |
| Guards (unit tests) | Valid JSON, under 20,480 bytes, routes unique exactly as written, no route percent-encoded, no redirect whose target matches its own route (exactly, or by the prefix before a trailing `*`, case-sensitive), every local rewrite and redirect target exists in the build |

### Site maps

| | |
|---|---|
| `sitemap.xml` | `site/pages/sitemap-xml.njk` (`permalink: /sitemap.xml`, `layout: false`, `eleventyExcludeFromCollections: true`). Every page in `collections.all` whose URL ends with `/` (HTML pages, not feeds or `404.html`) and whose data does not set `sitemap: false`, as `{{ site.url }}{{ url \| href }}`, so no trailing slash (home stays `https://stpaulswarton.co.uk/`). Sorted by address. `lastmod` (`YYYY-MM-DD`) from `date` on blog, calendar and notice items, left out elsewhere, because a file's own times change on every checkout |
| `sitemap: false` | Set on `site/pages/topic-index.njk` (the `/blog/topic` lists), `site/content/sitemap.md`, and later `contact-thanks.md` (spec 08). Page types and the pages root have no URL, so they never appear |
| `robots.txt` | `site/pages/robots-txt.njk` (`permalink: /robots.txt`, `layout: false`, `eleventyExcludeFromCollections: true`): allow all, `Sitemap: https://stpaulswarton.co.uk/sitemap.xml` |
| `/sitemap` | `site/content/sitemap.md` (`title: Site Map`, `url: /sitemap`, `layout: sitemap.njk`, `sitemap: false`), published by spec 04's root `url` rule. `site/_includes/sitemap.njk` lists Home, Blog with its articles (newest first), Calendar with upcoming events, Notices with its notices (newest first), then each page type with all its pages, from `pagesByType(collections)`. Not in Pages CMS |

`pagesByType(collections)` is added to `config/menus.js` (named export and filter): `[{ title, pages: [{ name, url }] }]`, every page type in weight order with every page in it in weight then title order, ignoring `header` and `footer`. `menuItems` and `footerGroups` are rewritten on top of it, with their unit tests unchanged.

### Canonical and site address

`site/data/site.yaml` gains `url: https://stpaulswarton.co.uk`. `partials/head.njk` adds `<link rel="canonical" href="{{ site.url }}{{ page.url | href }}">` on every page except the 404 page. On the test URL this points at the real domain, which is intended. `site/pages/feeds.njk` reads its base from `site.url` instead of its own constant.

### `tests/fixtures/live-urls.txt`

One path per line, sorted, no host, no trailing slash: every `<loc>` in the live sitemap (fetched in Task 3), then the variants `/Calendar`, `/Notices`, `/Contact`, `/Account/Login`, `/Account/Register`, `/account/manage`. A comment line at the top with the fetch date. It is a fixture: it does not change when Paul edits content.

### `scripts/check-urls.mjs`

| | |
|---|---|
| Usage | `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site`, or `--base https://<host> [--config _site/staticwebapp.config.json]` |
| `--built` | For each path, pass when a file exists at `<built>/<path>/index.html` or `<built>/<path>` (path decoded), or a route in `<built>/staticwebapp.config.json` matches it exactly or by its trailing `*` prefix, case-sensitive |
| `--base` | For each path, `GET` with `redirect: 'manual'`. Pass on 200, or on 301 or 302 when a redirect route in `--config` matches the path and `Location` is that route's target (or the path without its trailing slash). Anything else fails. Routes come from a local build, so the check never depends on the host publishing its config. Run `npm run build` first |
| Output | One line per failure (`/nope: not built`, `/blog: 301 to /elsewhere`), then a summary `N checked, M failed`. Exit code 1 when any failed |
| Dependencies | Node only (`fetch`, `node:fs`, `node:util` `parseArgs`). Behind the sandbox proxy, run with `NODE_USE_ENV_PROXY=1` |
| Not in CI | Never called from the workflow or `npm test`. `tests/unit/check-urls.test.mjs` tests its functions against a temporary folder and a fake `fetch` |

---

## Manual steps (maintainer)

1. After merge, run `npm ci && npm run build && node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --base https://brave-coast-006318103.5.azurestaticapps.net` (or ask Claude to). Before spec 07 most content URLs fail because the content is not migrated yet; the variants and section URLs should pass. Also `curl -sI https://brave-coast-006318103.5.azurestaticapps.net/notices/` should show a 301 to `/notices`.

---

## Acceptance

- [ ] `npm test` passes.
- [ ] Built `staticwebapp.config.json` has `trailingSlash: "never"`, the legacy routes, a route per legacy upload file and prefix, and passes the guards.
- [ ] `sitemap.xml` lists fixture URLs on the real domain with no trailing slashes. `robots.txt` points at it.
- [ ] `/sitemap` lists sections and pages.
- [ ] `check-urls.mjs --built` against a fixture build passes for fixture URLs and fails for a missing one.
- [ ] After merge, the variants and section URLs pass `check-urls.mjs --base` on the test URL, and `/notices/` returns 301 to `/notices`.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every live URL and known variant resolves, proven by a script.

**Architecture:** `buildSwaConfig` already writes the Static Web Apps config after each build. It now reads its routes from a data file next to the other site data and generates upload routes from the files actually in the build, so Static Web Apps' lack of wildcard captures costs one short route per file. Routes are case-sensitive, so each legacy spelling is its own redirect and cannot loop. A standalone script compares a list of live paths with a build or a host.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Azure Static Web Apps routing, Node 26 (`fetch`, `parseArgs`), `node:test`, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- `legacy.yaml` keys exactly `rewrites`, `redirects` and `upload_prefixes`, entries exactly `{ from, to }`. Spec 07 appends to `redirects`, spec 09 may add the cookie policy redirect.
- No `redirect` route whose target could match its own `route`.
- Routes written decoded, targets encoded.
- The URL check never runs in the deploy workflow or `npm test`.

### Review Focus

1. A redirect that loops on Static Web Apps. Expected: impossible by construction. Pinned by the unit test "no redirect can match its own target".
2. Old links with a trailing slash (`/blog/article/x/`), as Facebook and search engines hold them. Expected: one 301 to the slash-less URL, never a 404. Pinned by "trailing slashes are never kept" and the post-merge check.
3. A generated config over 20 KB once spec 07 adds the legacy uploads, which Static Web Apps would reject at deploy. Pinned by "staticwebapp.config.json is built, parses and is under 20 KB" and, in spec 09, the same check with 40 upload files.
4. The sitemap listing the 404 page, `/sitemap`, a topic index or a page type. Pinned by the scenario "The XML site map lists every page once, on the real domain".
5. `check-urls.mjs --base` treating a redirect to the wrong place as a pass. Pinned by the unit test "an unexpected redirect fails".
6. A legacy upload path with a space (`My Poster.pdf`). Expected: route written with the space, target `%20`. Pinned by "a new legacy upload gets a route from every prefix".

---

### Task 1: Legacy routes in the generated config

**Files:**
- Create: `site/data/legacy.yaml`
- Modify: `config/data.js` (`readData` export), `config/swa.js`
- Modify: `site/data/site.yaml` (`url`), `site/_includes/partials/head.njk` (canonical), `site/pages/feeds.njk` (base from `site.url`)
- Modify: `tests/unit/swa-config.test.mjs`, `tests/features/layout.feature`, `tests/steps/pages.js`

**Interfaces:**
- Consumes: `buildSwaConfig` (spec 00, ported), the build output folder.
- Produces: `readData(): Record<string, unknown>`, `buildSwaConfig(outDir, data)` with `trailingSlash`, legacy and upload routes. `site.url`. Spec 09 adds `globalHeaders` and cache routes to the same function.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/swa-config.test.mjs`, keep the size, uniqueness, percent-encoding, 404 and redirect-target tests, and add:

```js
const matches = (route, path) => (route.endsWith('*') ? path.startsWith(route.slice(0, -1)) : route === path);

test('trailing slashes are never kept', () => {
  assert.equal(config.trailingSlash, 'never');
});

test('mixed-case legacy links redirect to the lower-case page', () => {
  const rd = Object.fromEntries(config.routes.filter((r) => r.redirect).map((r) => [r.route, [r.redirect, r.statusCode]]));
  assert.deepEqual(rd['/Calendar'], ['/calendar', 301]);
  assert.deepEqual(rd['/Contact'], ['/contact', 301]);
  assert.deepEqual(rd['/account*'], ['/', 301]);
  assert.deepEqual(rd['/Account*'], ['/', 301]);
});

test('no redirect can match its own target', () => {
  assert.deepEqual(config.routes.filter((r) => r.redirect && matches(r.route, r.redirect)), []);
});

test('every local rewrite target exists in the build', () => {
  assert.deepEqual(config.routes.filter((r) => r.rewrite && !existsSync(path.join(out, r.rewrite))).map((r) => r.route), []);
});

test('a new legacy upload gets a route from every prefix', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'swa-up-'));
  try {
    await mkdir(path.join(dir, 'uploads/legacy/Gallery'), { recursive: true });
    await writeFile(path.join(dir, 'uploads/legacy/Gallery/My Poster.pdf'), '');
    await writeFile(path.join(dir, 'uploads/not-legacy.pdf'), '');
    const legacy = { rewrites: [], redirects: [], upload_prefixes: ['/Areas/st_pauls/Uploads', '/Areas/St_Pauls/Uploads'] };
    const { routes } = await buildSwaConfig(dir, { legacy });
    assert.deepEqual(routes, [
      { route: '/Areas/st_pauls/Uploads/Gallery/My Poster.pdf', redirect: '/uploads/legacy/Gallery/My%20Poster.pdf', statusCode: 301 },
      { route: '/Areas/St_Pauls/Uploads/Gallery/My Poster.pdf', redirect: '/uploads/legacy/Gallery/My%20Poster.pdf', statusCode: 301 },
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

"buildSwaConfig writes the file into the folder it is given" passes `readData()` explicitly. "every local redirect target exists" already handles `/calendar` (a folder with `index.html`) and `/`.

In `tests/features/layout.feature`:

```gherkin
  Scenario: Every page names its address on the real domain
    When I open "/notices/notice/newer"
    Then the canonical address is "https://stpaulswarton.co.uk/notices/notice/newer"
    When I open "/"
    Then the canonical address is "https://stpaulswarton.co.uk/"
```

New step in `tests/steps/pages.js`: "the canonical address is {string}" (`link[rel=canonical]` `href`).

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "canonical"`
Expected: FAIL. No `trailingSlash`, no legacy routes, no canonical link.

- [ ] **Step 3: Write `legacy.yaml`, `readData`, the routes in `buildSwaConfig`, `site.url`, the canonical link and the feed base**

Walk `uploads/legacy/` with `readdir(dir, { recursive: true, withFileTypes: true })`, keep files, sort the posix paths. A missing folder gives no routes.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass. `feeds.feature` still sees absolute `https://stpaulswarton.co.uk/...` links.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Generate Static Web Apps routes with no trailing slashes and legacy variants"
```

---

### Task 2: Site maps and robots.txt

**Files:**
- Create: `site/pages/sitemap-xml.njk`, `site/pages/robots-txt.njk`, `site/_includes/sitemap.njk`
- Create: `site/content/sitemap.md`, `tests/fixtures/content/sitemap.md` (same content)
- Modify: `site/pages/topic-index.njk` (`sitemap: false`), `config/menus.js` (`pagesByType`)
- Create: `tests/features/sitemap.feature`
- Modify: `tests/steps/feeds.js` (site map reader), `tests/steps/pages.js`, `tests/unit/menus.test.mjs`

**Interfaces:**
- Consumes: `pageTypes` and `pages` (spec 04), section collections and `upcoming` (spec 03), `href`, `site.url` (Task 1), spec 04's root `url` rule.
- Produces: `sitemap: false`, `pagesByType(collections)`, `/sitemap.xml`, `/robots.txt`, `/sitemap`. Spec 08 sets `sitemap: false` on the thanks page.

- [ ] **Step 1: Write the failing tests**

`tests/unit/menus.test.mjs`, with the spec 04 fixtures:

```js
test('pagesByType lists every page of every type, menu flags ignored', () => {
  const groups = pagesByType(collections);
  assert.deepEqual(groups.map((g) => g.title), ['About', 'Services', 'Groups', 'Forms']);
  assert.deepEqual(groups.at(-1).pages, [{ name: 'Hidden', url: '/page/forms/hidden' }]);
});
```

`tests/features/sitemap.feature`:

```gherkin
Feature: Site maps
  Search engines get every page once, on the real domain. People get a page of links.

  Scenario: The XML site map lists every page once, on the real domain
    When I read the site map "/sitemap.xml"
    Then it lists:
      | https://stpaulswarton.co.uk/                                             |
      | https://stpaulswarton.co.uk/page/about/about-us                          |
      | https://stpaulswarton.co.uk/contact                                      |
      | https://stpaulswarton.co.uk/calendar/event/16/mu-advent-carol-service    |
      | https://stpaulswarton.co.uk/blog/topic/website                           |
      | https://stpaulswarton.co.uk/notices/notice/2026-01-05-dated              |
    And it does not list:
      | https://stpaulswarton.co.uk/404.html  |
      | https://stpaulswarton.co.uk/sitemap   |
      | https://stpaulswarton.co.uk/page/about |
      | https://stpaulswarton.co.uk/blog/topic |
    And no address in it ends with a slash, except the home page
    And every address in it is listed once

  Scenario: robots.txt points at the site map
    Then "/robots.txt" says "Sitemap: https://stpaulswarton.co.uk/sitemap.xml"

  Scenario: The HTML site map
    When I open "/sitemap"
    Then the page heading is "Site Map"
    And the "Blog" link goes to "/blog"
    And the "Fixture article 8" link goes to "/blog/article/a8"
    And the "Calendar" link goes to "/calendar"
    And the "Notices" link goes to "/notices"
    And the "About Us" link goes to "/page/about/about-us"
    And the "Contact Us" link goes to "/contact"
    And I do not see "Fixture past"
```

New steps: "I read the site map {string}" in `tests/steps/feeds.js` (parsed in the browser with `DOMParser`, as the feeds are, into `ui.sitemap` locations), "it lists:", "it does not list:", "no address in it ends with a slash, except the home page", "every address in it is listed once", and "{string} says {string}" in `tests/steps/pages.js` (response text contains it).

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "site map|Site map|robots"`
Expected: FAIL. `/sitemap.xml`, `/robots.txt` and `/sitemap` are 404.

- [ ] **Step 3: Write `pagesByType`, the templates and the content file**

`sitemap-xml.njk` escapes nothing by hand: Nunjucks autoescape covers `&` in addresses.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Add XML and HTML site maps and robots.txt"
```

---

### Task 3: Live URL snapshot and check script

**Files:**
- Create: `tests/fixtures/live-urls.txt`
- Create: `scripts/check-urls.mjs`
- Modify: `scripts/README.md`
- Create: `tests/unit/check-urls.test.mjs`

**Interfaces:**
- Produces: `scripts/check-urls.mjs` with named exports `loadList(file: string): string[]`, `matchRoute(route: string, path: string): boolean`, `checkBuilt(paths: string[], built: string): Promise<string[]>` (failures), `checkHost(paths: string[], base: string, { config, fetch }): Promise<string[]>` (failures; `fetch` defaults to the global one, so tests inject a fake), and `main(argv: string[]): Promise<number>`. It runs `main` only when started directly. Used in specs 07 and 11.

- [ ] **Step 1: Take the snapshot**

```bash
curl -sS http://stpaulswarton.co.uk/sitemap.xml | grep -o '<loc>[^<]*</loc>' \
  | sed -E 's#</?loc>##g; s#^https?://[^/]+##; s#/$##; s#^$#/#' | sort -u > <scratchpad>/live.txt
```

Write `tests/fixtures/live-urls.txt` as a `# fetched 20YY-MM-DD from http://stpaulswarton.co.uk/sitemap.xml` line, the sorted paths, then the six variants. Expected: about 116 paths plus 6.

- [ ] **Step 2: Write the failing tests in `tests/unit/check-urls.test.mjs`**

`before` writes a temporary built folder: `index.html`, `notices/notice/newer/index.html`, and a `staticwebapp.config.json` with the `/Calendar` and `/account*` redirects.

```js
import { checkBuilt, checkHost, loadList, matchRoute } from '../../scripts/check-urls.mjs';

const fakeFetch = (answers) => async (url) => {
  const [status, location] = answers[new URL(url).pathname] ?? [404];
  return { status, headers: new Headers(location ? { location } : {}) };
};

test('a build passes for its pages and its routes', async () => {
  assert.deepEqual(await checkBuilt(['/', '/notices/notice/newer', '/Calendar', '/account/login'], built), []);
});

test('a missing page is reported', async () => {
  assert.deepEqual(await checkBuilt(['/nope'], built), ['/nope: not built']);
});

test('routes match case-sensitively', () => {
  assert.equal(matchRoute('/Calendar', '/calendar'), false);
  assert.equal(matchRoute('/account*', '/account/manage'), true);
});

test('an unexpected redirect fails', async () => {
  const fetch = fakeFetch({ '/blog': [301, '/elsewhere'] });
  assert.deepEqual(await checkHost(['/blog'], 'https://h', { config, fetch }), ['/blog: 301 to /elsewhere']);
});

test('a configured redirect to its target passes', async () => {
  const fetch = fakeFetch({ '/account/login': [301, '/'], '/Calendar': [301, 'https://h/calendar'] });
  assert.deepEqual(await checkHost(['/account/login', '/Calendar'], 'https://h', { config, fetch }), []);
});

test('the list ignores comments and blank lines', () => { /* temp file with "# x", "", "/a" gives ["/a"] */ });

test('the live list is sorted, unique and has no trailing slashes', () => {
  const paths = loadList('tests/fixtures/live-urls.txt');
  assert.ok(paths.length > 100);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((p) => p === '/' || !p.endsWith('/')));
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `npm run test:unit`
Expected: FAIL, `scripts/check-urls.mjs` not found.

- [ ] **Step 4: Write `scripts/check-urls.mjs` and its README row** (`Never` in the CI column)

- [ ] **Step 5: Run the full suite, then the script against a local build of the real content**

Run: `npm test`, then `npm run build && node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site`
Expected: the suite passes. The script lists the content URLs not yet migrated and passes the variants and sections. Paste the summary line into the hand-off.

- [ ] **Step 6: Commit**

```bash
git add scripts tests
git commit -m "Add live URL snapshot and URL check script"
```
