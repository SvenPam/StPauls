---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 09: security and delivery hardening

_One session. Finds out first whether our own HSTS header can replace the one Static Web Apps sends, then adds security headers and a Content Security Policy built from what the site really loads, long caching for fingerprinted files, actions pinned to commits, delivery budget tests, and settles the cookie policy. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18. The HSTS check is new in this version._

---

## Goal

The site sends a strict set of headers that still lets the two embeds and the contact form work, repeat visits load almost nothing, the pipeline only runs code it has pinned, the HSTS plan for cutover is known to work or replaced, and the cookie policy question is answered.

## Starting point

- Specs 00 to 08 on `main`, on Eleventy.
- `buildSwaConfig(outDir, data = readData())` in `config/swa.js` writes `staticwebapp.config.json` with `trailingSlash`, routes from `site/data/legacy.yaml` and the generated legacy upload routes (spec 05). No `globalHeaders`.
- Third parties the site uses: `calendar.google.com` and `embedsocial.com` iframes (`site/data/embeds.yaml`, spec 06), form posts to `api.web3forms.com` (spec 08), hot-linked images from any `https:` host.
- Transforms: `images` (`optimiseImages`, spec 06). Bodies are otherwise published untouched.
- Content bodies may carry inline `style` attributes (legacy HTML, the rich text editor). Templates have none and no inline script.
- `azurestaticapps.net` already sends `strict-transport-security: max-age=10886400; includeSubDomains; preload` and `cache-control: public, must-revalidate, max-age=30` on HTML. On a custom domain Static Web Apps adds the same HSTS header itself ([checked facts](page-cms-spec-conventions.md#azure-static-web-apps)). Whether a `globalHeaders` HSTS value replaces it is not known.
- `.github/workflows/deploy.yml` has `build`, `audit` and `deploy` jobs. Actions are on major tags (`actions/checkout@v6`, `actions/setup-node@v7`, `actions/cache` (spec 06), `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `azure/login@v3`, `Azure/static-web-apps-deploy@v1`). Node comes from `.nvmrc` through `setup-node`, packages from `npm ci` and the lockfile, so there is no tool download to checksum.
- `.github/dependabot.yml` already opens one grouped pull request a month for npm and one for GitHub Actions. Dependabot updates SHA-pinned actions and their version comments too.
- The `audit` job is `continue-on-error` except on the weekly schedule, so it can show a red check on a pull request without failing the run.
- The sandbox cannot reach `calendar.google.com` or `embedsocial.com` (proxy 403), and it cannot deploy. The HSTS check and the cookie check are maintainer steps.

## In scope

- An HSTS check on the test URL, before the rest of the headers.
- `globalHeaders` and cache routes in `buildSwaConfig`.
- `rel="noopener"` on links that open a new tab, in templates and bodies.
- Actions pinned to commit SHAs, kept current by the existing Dependabot entry.
- Delivery budget scenarios over the fixture build.
- Cookie check how-to and the cookie policy outcome.

## Out of scope

HSTS preload submission. Cloudflare settings (spec 11). Click-to-load embeds, unless the cookie check calls for them and the maintainer chooses it.

---

## Requirements

### HSTS check (first)

| | |
|---|---|
| Change | `site/data/site.yaml` gains `hsts_max_age: 300`. `buildSwaConfig` writes `globalHeaders: { 'Strict-Transport-Security': 'max-age=300' }` and nothing else new |
| Deploy | The maintainer merges that one change. `main` deploys only to the test URL until cutover, so nothing live is affected. The sandbox cannot deploy |
| Check | `curl -sI https://brave-coast-006318103.5.azurestaticapps.net/` and `curl -sI https://brave-coast-006318103.5.azurestaticapps.net/notices` |
| Only ours (`max-age=300`, one header) | Keep the plan: five minutes from cutover, one year in spec 12 |
| Static Web Apps' alongside ours, or instead of it | The five-minute HSTS cannot work. Remove `hsts_max_age` and the header, and record it. The platform's header carries `includeSubDomains`, so once visitors reach the new site their browsers insist on HTTPS for every name under `stpaulswarton.co.uk` for about four months: check each record in the spec 01 records table and list any name that serves only HTTP (it needs HTTPS, for example through Cloudflare's proxy, before cutover). Spec 11's rollback then relies on Cloudflare serving the old site over HTTPS (record proxied, SSL/TLS mode **Flexible**) instead of plain HTTP, and spec 12 leaves Static Web Apps' default in place |

Either way the result is a new row in [checked facts](page-cms-spec-conventions.md#azure-static-web-apps), with the date and the headers seen, in the same commit as any change it causes.

### Headers (`globalHeaders`)

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-src {https://host for each embeds.yaml entry, space separated}; form-action 'self' https://api.web3forms.com; upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age={site.hsts_max_age}`, only when `hsts_max_age` is set (it is not after a failed HSTS check). Ours has no `includeSubDomains` and no `preload`, because the church may have other names on the domain. That reasoning only holds when the check finds ours replaces the platform's header; otherwise the platform's `includeSubDomains` applies anyway (see the HSTS check). Five minutes keeps a rollback to the old HTTP-only site possible after cutover; spec 12 raises it to `31536000` once the old site is gone |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

`contentSecurityPolicy(embeds)` is a named export of `config/swa.js`, so a new embed type in `embeds.yaml` updates `frame-src` with it. `buildSwaConfig` reads `site` and `embeds` from its `data` argument.

### Cache routes

Added before the legacy routes in `routes`:

| Route | `Cache-Control` |
|---|---|
| `/css/*` | `public, max-age=31536000, immutable` |
| `/js/*` | `public, max-age=31536000, immutable` |
| `/images/*` | `public, max-age=31536000, immutable` (layout images and uploads are only published there as processed, hashed files) |
| `/fonts/*` | `public, max-age=31536000` |
| `/uploads/*` | `public, max-age=86400` (Paul may replace a file under the same name) |

HTML keeps the platform default, so a publish shows within a minute.

### Links

`addNoopener(html)` in `config/links.js`, registered as a `noopener` transform after `images` for `.html` output: adds `noopener` to the `rel` of any `<a>` with `target="_blank"`, creating `rel="noopener"` when there is none and appending to an existing `rel` that lacks it. Templates write `rel="noopener"` on their own new-tab links.

### Pipeline

| | |
|---|---|
| Actions | Every `uses:` pinned to a full 40-character commit SHA with the tag in a trailing comment, for example `uses: actions/checkout@<sha> # v6.1.0`. Resolve with `git ls-remote --tags https://github.com/<owner>/<repo>`, taking the `^{}` line for annotated tags |
| Dependabot | Unchanged: the existing monthly grouped `github-actions` entry bumps the SHA and its comment together, so pinning adds no chore |
| Tool downloads | None to check: Node comes from `setup-node` with `.nvmrc`, everything else from `npm ci` and `package-lock.json` |
| Permissions | Unchanged: `contents: read` at the top, `id-token: write` on `deploy` only |
| Audit | Unchanged. Its red check on a pull request is expected and must not be made a required check |

### Delivery budgets (scenarios over the fixture build with fixture uploads)

| Check | Limit |
|---|---|
| CSS bundle | under 25,000 bytes (spec 02, kept) |
| `site.js` | under 2,048 bytes (spec 02, kept) |
| Home page first load | HTML + CSS + JS + the hero's fallback image under 400,000 bytes |
| Scripts | Only `/js/site.<hash>.js`, on every page |
| Images | Every `<img>` has `alt`. Every `<img>` whose `src` starts with `/images/`, or with `/uploads/` for a file that exists in the build, has `width` and `height`. A missing upload is a plain `<img>` with no size by design (spec 06), so it is exempt. At most one `<img>` per page without `loading="lazy"` |
| Fonts | Only from `/fonts/` |
| Storage | No cookie and nothing in `localStorage` or `sessionStorage` after visiting the pages |

### Cookies

A how-to `docs/features/page-cms/page-cms-how-to-check-cookies.md` for the maintainer: open the test URL's home page, `/page/about/church-diary` and `/page/gallery/church-gallery` in a private window, open developer tools, Application (Chrome) or Storage (Firefox), Cookies, and list every cookie and its domain for each page. Record the result in the how-to.

| Result | What happens |
|---|---|
| No cookies on any page | Delete the cookie policy page. Add a `legacy.yaml` redirect `/page/about/cookie-policy` to `/page/about/privacy-policy`. It leaves the menus by itself, because menus follow content |
| Cookies from the embeds | Keep the page. Stop and ask the maintainer to choose: a short cookie note that names the embeds and their cookies, or click-to-load embeds (no third-party request until the visitor clicks "Show calendar" or "Show photos") |

The site itself sets no cookies; the "Storage" budget scenario checks it in a real browser.

---

## Manual steps (maintainer)

1. HSTS check: merge Task 1's branch, wait for the deploy, then run `curl -sI https://brave-coast-006318103.5.azurestaticapps.net/` and `.../notices` (or ask Claude to, if the sandbox can reach it). Tell Claude every `strict-transport-security` line you see. The rest of the spec waits for this.
2. After the full merge, run `curl -sI https://brave-coast-006318103.5.azurestaticapps.net/` and check the headers. Open the church diary and gallery pages and check the embeds still load with the CSP in place, and that the contact form (with a test key, if one exists) still posts.
3. Do the cookie check in the how-to and tell Claude the result.
4. In GitHub settings, turn on Dependabot alerts and secret scanning for the repository if they are off, and check the Pages CMS GitHub App has access to this repository only.
5. Do not make the `audit` job a required check in branch protection. Its red check on pull requests and pushes is expected (`continue-on-error`); only the weekly scheduled run fails.

---

## Acceptance

- [ ] `npm test` passes.
- [ ] The HSTS result is recorded in checked facts, and the plan follows it (header kept at `max-age=300`, or removed with spec 11's rollback switched to Cloudflare Flexible).
- [ ] The generated config carries every header in the table (HSTS only if the check allowed it), and `frame-src` lists exactly the `embeds.yaml` hosts.
- [ ] Cache routes are present and come before the legacy routes.
- [ ] Every `uses:` in the workflow is a 40-character SHA with a version comment. `actionlint` passes.
- [ ] Budget scenarios pass.
- [ ] After merge, the test URL sends the headers, the embeds and the contact form still work (maintainer).
- [ ] The cookie result is recorded and the cookie policy outcome applied or the maintainer's choice recorded.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A known HSTS outcome, strict headers, long caching, a pinned pipeline, budgets as tests, and a settled cookie policy.

**Architecture:** Headers live in the same generated config as the routes, with the CSP built from the embed list by a pure function. The one fact that cannot be tested locally, which HSTS header wins, is checked on the test URL before anything depends on it. Budgets are scenarios over the fixture build, so they hold without depending on Paul's content. Pinning is enforced by a workflow unit test.

**Tech Stack:** Azure Static Web Apps config, Eleventy transforms, GitHub Actions, Dependabot, `node:test`, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Header values exactly as in the Headers table.
- No `'unsafe-inline'` for scripts, no `'unsafe-eval'`, no wildcard in `frame-src`.
- The generated config stays under 20,480 bytes.
- Tasks 2 to 5 start only once the HSTS result is recorded.

### Review Focus

1. Two HSTS headers on the custom domain after cutover, so the five-minute rollback silently does not work. Pinned by Task 1's check on the test URL and its recorded outcome.
2. The CSP blocks something real: the calendar iframe, the form post, an inline `style` in a migrated body, a hot-linked `https:` image. Pinned by "the CSP allows what the site uses" and the maintainer's post-merge check.
3. A cache route matching HTML, so a publish takes a year to show. Pinned by "HTML is never cached for long".
4. An action left on a tag, or a SHA without its version comment, so Dependabot cannot update it. Pinned by "every action is pinned to a commit with its version".
5. A migrated body link with `target="_blank"` and an existing `rel="nofollow"`. Expected: `rel` kept, `noopener` added once. Pinned by the `addNoopener` tests.
6. Config size creeping over the limit once headers are added on top of the upload routes. Pinned by "the config stays under 20 KB with 40 legacy uploads".

---

### Task 1: Check which HSTS header wins

**Files:**
- Modify: `site/data/site.yaml` (`hsts_max_age: 300`), `config/swa.js`
- Modify: `tests/unit/swa-config.test.mjs`
- Modify (after the check): `docs/features/page-cms/page-cms-spec-conventions.md` (checked facts), and on a failed check also `site/data/site.yaml`, `config/swa.js`, `docs/features/page-cms/page-cms-spec-11-cutover.md`, `docs/features/page-cms/page-cms-spec-12-handover-and-decommission.md`

**Interfaces:**
- Consumes: `buildSwaConfig(outDir, data)`, `readData()` (spec 05).
- Produces: `site.hsts_max_age` and the HSTS header, or the recorded fact that they cannot work.

- [ ] **Step 1: Write the failing tests**

```js
test('HSTS follows hsts_max_age, with no subdomains or preload', () => {
  assert.equal(config.globalHeaders['Strict-Transport-Security'], 'max-age=300');
});

test('no HSTS header when hsts_max_age is not set', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'swa-hsts-'));
  try {
    const { globalHeaders } = await buildSwaConfig(dir, { ...readData(), site: { title: 'x' } });
    assert.equal(globalHeaders?.['Strict-Transport-Security'], undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit`
Expected: FAIL, no `globalHeaders`.

- [ ] **Step 3: Add `hsts_max_age` and the header, run `npm test`, commit**

```bash
git add config site tests
git commit -m "Send a five-minute HSTS header to check it replaces the platform's"
git push -u origin <session branch>
```

- [ ] **Step 4: Ask the maintainer to merge the pushed branch and run manual step 1.** Stop here until they report the headers.

- [ ] **Step 5: Record the outcome**

Only ours: add the fact row (date, `strict-transport-security: max-age=300` alone), commit `Record that our HSTS header replaces the platform's`, push.

Static Web Apps' seen: add the fact row, remove `hsts_max_age` and the header, change the first unit test to expect no HSTS header, rewrite spec 11's Rollback for Cloudflare Flexible and spec 12's HSTS task to "leave Static Web Apps' default", update the design's HSTS row and the conventions' Site data row, run `npm test`, commit `Drop the five-minute HSTS, the platform's header wins`, push. Spec 11's rollback text must also say that the platform's `includeSubDomains` makes browsers insist on HTTPS for every name under `stpaulswarton.co.uk` for about four months, so any HTTP-only name in the spec 01 records table needs checking before cutover.

---

### Task 2: Headers and cache routes

**Files:**
- Modify: `config/swa.js` (`contentSecurityPolicy`, the other headers, cache routes)
- Modify: `tests/unit/swa-config.test.mjs`

**Interfaces:**
- Consumes: `embeds` (spec 06), `legacy` (spec 05), `site.hsts_max_age` (Task 1).
- Produces: `contentSecurityPolicy(embeds): string`, `globalHeaders` and cache routes in the generated config.

- [ ] **Step 1: Write the failing tests**

```js
const csp = () => Object.fromEntries(config.globalHeaders['Content-Security-Policy'].split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));

test('headers are present', () => {
  const h = config.globalHeaders;
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.equal(h['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(h['X-Frame-Options'], 'DENY');
  assert.equal(h['Cross-Origin-Opener-Policy'], 'same-origin');
  assert.match(h['Permissions-Policy'], /browsing-topics=\(\)/);
});

test('the CSP allows what the site uses', () => {
  const c = csp();
  assert.deepEqual(c['frame-src'].sort(), ['https://calendar.google.com', 'https://embedsocial.com']);
  assert.ok(c['form-action'].includes('https://api.web3forms.com'));
  assert.ok(c['img-src'].includes('https:'));
  assert.deepEqual(c['style-src-attr'], ["'unsafe-inline'"]);
  assert.deepEqual(c['script-src'], ["'self'"]);
  assert.deepEqual(c['frame-ancestors'], ["'none'"]);
});

test('frame-src follows embeds.yaml', () => {
  assert.match(contentSecurityPolicy({ x: { host: 'example.org' } }), /frame-src https:\/\/example\.org;/);
});

test('cache routes come first', () => {
  assert.deepEqual(config.routes.slice(0, 5).map((r) => r.route), ['/css/*', '/js/*', '/images/*', '/fonts/*', '/uploads/*']);
  assert.equal(config.routes[0].headers['Cache-Control'], 'public, max-age=31536000, immutable');
});

test('HTML is never cached for long', () => {
  for (const r of config.routes.filter((r) => /max-age=31536000/.test(r.headers?.['Cache-Control'] ?? '')))
    assert.match(r.route, /^\/(css|js|images|fonts)\/\*$/);
});

test('the config stays under 20 KB with 40 legacy uploads', async () => {
  /* temp folder with 40 files under uploads/legacy/Gallery/ named like "St Pauls Church Easter 2019 photo NN.jpg",
     buildSwaConfig(dir, readData()), then the written file is under 20,480 bytes */
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit`
Expected: FAIL.

- [ ] **Step 3: Extend `buildSwaConfig`**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass, the config still under 20 KB.

- [ ] **Step 5: Commit**

```bash
git add config tests
git commit -m "Add security headers, CSP and long caching for fingerprinted files"
```

---

### Task 3: Safe new-tab links and budgets

**Files:**
- Create: `config/links.js`
- Modify: any template with `target="_blank"`
- Create: `tests/fixtures/content/notices/links.md` (`title: Fixture links`, `date: 2015-02-01`, body with `<a href="https://example.org/a" target="_blank">a</a>`, `<a href="https://example.org/b" target="_blank" rel="nofollow">b</a>`, `<a href="https://example.org/c" target="_blank" rel="noopener">c</a>`)
- Modify: `tests/features/notices.feature` (card order: `Fixture links` between `Fixture images` and `Fixture dated`), `tests/features/feeds.feature` (notices feed count up by one)
- Create: `tests/unit/links.test.mjs`, `tests/features/budgets.feature`
- Modify: `tests/steps/site.js`

- [ ] **Step 1: Write the failing tests**

`tests/unit/links.test.mjs`:

```js
import { addNoopener } from '../../config/links.js';

test('noopener is added once to new-tab links', () => {
  assert.equal(addNoopener('<a href="/a" target="_blank">a</a>'), '<a href="/a" target="_blank" rel="noopener">a</a>');
  assert.equal(addNoopener('<a href="/b" target="_blank" rel="nofollow">b</a>'), '<a href="/b" target="_blank" rel="nofollow noopener">b</a>');
  assert.equal(addNoopener('<a href="/c" target="_blank" rel="noopener">c</a>'), '<a href="/c" target="_blank" rel="noopener">c</a>');
  assert.equal(addNoopener('<a href="/d">d</a>'), '<a href="/d">d</a>');
});
```

`tests/features/budgets.feature`:

```gherkin
Feature: Delivery budgets
  Small pages, our own script only, images that never jump, nothing stored.

  Scenario: New-tab links cannot reach back into the site
    When I open "/notices/notice/links"
    Then every link that opens a new tab has "noopener"

  Scenario: The home page is light on first load
    When I open "/"
    Then the page, its stylesheet, script and hero image add up to under 400000 bytes

  Scenario Outline: Every page loads only our script, sized and described images, and our fonts
    When I open "<page>"
    Then the only script is our own
    And every image on the page has an alt attribute
    And every local image has a width and height
    And at most one image loads straight away
    And every font comes from "/fonts/"

    Examples:
      | page                    |
      | /                       |
      | /blog/article/a8        |
      | /notices/notice/images  |
      | /page/about/church-diary |
      | /calendar               |

  Scenario: The site stores nothing in the browser
    When I open "/"
    And I open "/contact"
    And I open "/blog/article/a8"
    Then the site has set no cookies and stored nothing
```

"every image on the page has an alt attribute" comes from spec 04. New steps in `tests/steps/site.js`: "every link that opens a new tab has {string}", "the page, its stylesheet, script and hero image add up to under {int} bytes" (response sizes from `request`), "the only script is our own" (every `script[src]` matches `^/js/site\.[0-9a-f]{10}\.js$`), "every local image has a width and height" (`img` with `src` under `/images/`, or under `/uploads/` when a `request` for that `src` returns 200; a missing upload such as `/uploads/deleted.jpg` is skipped), "at most one image loads straight away" (count of `img` without `loading="lazy"`), "every font comes from {string}" (the `url()`s in the stylesheet's `@font-face` rules), "the site has set no cookies and stored nothing" (`context.cookies()` is empty, `localStorage.length` and `sessionStorage.length` are 0).

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "budgets|Delivery|new tab"`
Expected: FAIL on `noopener` at least.

- [ ] **Step 3: Write `addNoopener` and its transform, fix templates and anything the budgets find**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass, budgets included.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Add noopener to new-tab links and delivery budget tests"
```

---

### Task 4: Pinned actions

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `tests/unit/workflow.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('every action is pinned to a commit with its version', () => {
  const text = readFileSync('.github/workflows/deploy.yml', 'utf8');
  const uses = [...text.matchAll(/^\s+(?:- )?uses: (\S+)(.*)$/gm)];
  assert.ok(uses.length > 0);
  for (const [, ref, rest] of uses) {
    assert.match(ref, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, ref);
    assert.match(rest, /^\s+# v\d+(\.\d+)*$/, ref);
  }
});
```

Tests that look for an action by name (`/static-web-apps-deploy/`, `/setup-node/`, `/^actions\/cache@/`) already match on the name, so they keep working.

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test:unit`
Expected: FAIL on the first tag.

- [ ] **Step 3: Resolve SHAs with `git ls-remote --tags`, pin each action with its tag comment**

- [ ] **Step 4: Run the suite and `actionlint .github/workflows/deploy.yml`**

Expected: all pass, no actionlint output.

- [ ] **Step 5: Commit**

```bash
git add .github tests
git commit -m "Pin actions to commits"
```

---

### Task 5: Cookie check and policy outcome

**Files:**
- Create: `docs/features/page-cms/page-cms-how-to-check-cookies.md`
- Modify (only if no cookies): delete `site/content/page/about/cookie-policy.md`, add the redirect to `site/data/legacy.yaml`

- [ ] **Step 1: Write the how-to and commit.** It gets no test: it is a document.

```bash
git add docs
git commit -m "Add a how-to for checking cookies"
git push -u origin <session branch>
```

- [ ] **Step 2: Ask the maintainer to do the check** after merge and report back. Stop here until they do.

- [ ] **Step 3: Apply the outcome** from the Cookies table. No cookies: delete the page, add the redirect, run `npm test` (the unit test "every local redirect target exists" covers the new target), then `npm run build && node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site` (the cookie policy path now passes as a redirect), commit `Drop the cookie policy, the site sets no cookies`, push. Cookies found: record them in the how-to and ask the maintainer to choose; the chosen option is a follow-up task in this spec.
