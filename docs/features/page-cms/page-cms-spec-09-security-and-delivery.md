---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 09: security and delivery hardening

_One session. Adds security headers and a Content Security Policy built from what the site really loads, long caching for fingerprinted files, a hardened build pipeline, delivery budget tests, and settles the cookie policy. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

The site sends a strict set of headers that still lets the two embeds and the contact form work, repeat visits load almost nothing, the pipeline only runs code it has pinned, and the cookie policy question is answered.

## Starting point

- Specs 02 to 08 on `main`. `staticwebapp.config.json` is generated from `site/layouts/home.swaconfig.json` (spec 05) with routes from `legacy.yaml`.
- Third parties the site uses: `calendar.google.com` and `embedsocial.com` iframes (`embeds.yaml`, spec 06), form posts to `api.web3forms.com` (spec 08), hot-linked images from any `https:` host.
- Content bodies may carry inline `style` attributes (legacy HTML, the rich text editor). Templates have none and no inline script.
- `azurestaticapps.net` already sends HSTS with `includeSubDomains; preload` and `cache-control: public, must-revalidate, max-age=30` on HTML.
- `.github/workflows/deploy.yml` uses actions by tag (`actions/checkout@v6`, `actions/cache@v4`, `azure/login@v3`, `Azure/static-web-apps-deploy@v1`) and downloads Hugo without a checksum.
- Hugo 0.167.0 extended linux-amd64 tarball SHA-256, from the release's `hugo_0.167.0_checksums.txt` (checked 2026-10-17): `0163f5c3deddac1f494a1629ddc40c65d18de9d5794facd98f7f96ac2c7d8957`.
- The sandbox cannot reach `calendar.google.com` or `embedsocial.com` (proxy 403), so the cookie check is a maintainer step.

## In scope

- `globalHeaders` and cache routes in the generated config.
- `rel="noopener"` on links that open a new tab, in templates and bodies.
- Actions pinned to commit SHAs, Hugo checksum check, Dependabot for actions.
- Delivery budget tests over a fixture build.
- Cookie check how-to and the cookie policy outcome.

## Out of scope

HSTS preload submission. Cloudflare settings (spec 11). Click-to-load embeds, unless the cookie check calls for them and the maintainer chooses it.

---

## Requirements

### Headers (`globalHeaders`)

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-src {https://host for each embeds.yaml entry, space separated}; form-action 'self' https://api.web3forms.com; upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age={site.Params.hsts_max_age}`, with `hsts_max_age = 300` in `hugo.toml`. No `includeSubDomains`, no `preload`: the church may have other names on the domain. Five minutes keeps a rollback to the old HTTP-only site possible after cutover; spec 12 raises it to `31536000` once the old site is gone |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

`frame-src` is built in the template from `site.Data.embeds`, so a new embed type updates the policy with it.

### Cache routes

Added before the legacy routes in `routes`:

| Route | `Cache-Control` |
|---|---|
| `/css/*` | `public, max-age=31536000, immutable` |
| `/js/*` | `public, max-age=31536000, immutable` |
| `/images/*` | `public, max-age=31536000, immutable` (layout images are only published as processed, hashed files) |
| `/fonts/*` | `public, max-age=31536000` |
| `/uploads/*` | `public, max-age=86400` (Paul may replace a file under the same name) |

HTML keeps the platform default, so a publish shows within a minute.

### Links

`body.html` adds `rel="noopener"` to any `<a>` with `target="_blank"` that has no `rel`. Templates do the same for their own links.

### Pipeline

| | |
|---|---|
| Actions | Every `uses:` pinned to a full 40-character commit SHA with the tag in a trailing comment, for example `uses: actions/checkout@<sha> # v6.1.0`. Resolve with `git ls-remote --tags https://github.com/<owner>/<repo>`, taking the `^{}` line for annotated tags |
| Hugo | `HUGO_SHA256` in `env`, checked with `echo "$HUGO_SHA256  $RUNNER_TEMP/hugo.tar.gz" \| sha256sum -c -` before extracting |
| Dependabot | `.github/dependabot.yml`: `version: 2`, one `github-actions` entry, `directory: /`, `schedule: { interval: monthly }`, one group `actions` with `patterns: ["*"]` |
| Permissions | Unchanged: `id-token: write`, `contents: read` |

### Delivery budgets (tests over a minified fixture build with fixture uploads)

| Check | Limit |
|---|---|
| CSS bundle | under 25,000 bytes (spec 02, kept) |
| `site.js` | under 2,048 bytes (spec 02, kept) |
| Home page first load | HTML + CSS + JS + the hero's fallback image under 400,000 bytes |
| Scripts | Only `/js/site.min.*.js`, on every page |
| Images | Every `<img>` has `alt`. Every `<img>` whose `src` starts with `/uploads/` or `/images/` has `width` and `height`. At most one `<img>` per page without `loading="lazy"` |
| Fonts | Only from `/fonts/` |

### Cookies

A how-to `docs/features/page-cms/page-cms-how-to-check-cookies.md` for the maintainer: open the test URL's home page, `/page/about/church-diary` and `/page/gallery/church-gallery` in a private window, open developer tools, Application (Chrome) or Storage (Firefox), Cookies, and list every cookie and its domain for each page. Record the result in the how-to.

| Result | What happens |
|---|---|
| No cookies on any page | Delete the cookie policy page. Add a `legacy.yaml` redirect `/page/about/cookie-policy` to `/page/about/privacy-policy`. Remove it from menus by deleting the file (menus follow content) |
| Cookies from the embeds | Keep the page. Stop and ask the maintainer to choose: a short cookie note that names the embeds and their cookies, or click-to-load embeds (no third-party request until the visitor clicks "Show calendar" or "Show photos") |

The site itself sets no cookies; a test checks that no template or script calls `document.cookie` or `localStorage`.

---

## Manual steps (maintainer)

1. After merge, run `curl -sI https://brave-coast-006318103.5.azurestaticapps.net/` (or ask Claude) and check the headers, including that exactly one `Strict-Transport-Security` header comes back with `max-age=300` (the platform sends its own on `azurestaticapps.net`; record which one wins in [checked facts](page-cms-spec-conventions.md#azure-static-web-apps)). Open the church diary and gallery pages and check the embeds still load with the CSP in place.
2. Do the cookie check in the how-to and tell Claude the result.
3. In GitHub settings, turn on Dependabot alerts and secret scanning for the repository if they are off, and check the Pages CMS GitHub App has access to this repository only.

---

## Acceptance

- [ ] `npm test` in `tests/` passes.
- [ ] The generated config carries every header in the table, and `frame-src` lists exactly the `embeds.yaml` hosts.
- [ ] Cache routes are present and come before the legacy routes.
- [ ] Every `uses:` in the workflow is a 40-character SHA with a version comment. Hugo's checksum is checked. `actionlint` passes.
- [ ] Budget tests pass.
- [ ] After merge, the test URL sends the headers, the embeds and the contact form still work (maintainer).
- [ ] The cookie result is recorded and the cookie policy outcome applied or the maintainer's choice recorded.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strict headers, long caching, a pinned pipeline, budgets as tests, and a settled cookie policy.

**Architecture:** Headers live in the same generated config as the routes, with the CSP built from the embed list. Budgets are checks over a fixture build, so they hold without depending on Paul's content. Pinning is enforced by a workflow test.

**Tech Stack:** Azure Static Web Apps config, Hugo templates, GitHub Actions, Dependabot, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Header values exactly as in the Headers table.
- No `'unsafe-inline'` for scripts, no `'unsafe-eval'`, no wildcard in `frame-src`.
- The generated config stays under 20,480 bytes.

### Review Focus

1. The CSP blocks something real: the calendar iframe, the form post, an inline `style` in a migrated body, a hot-linked `https:` image. Pinned by `test_csp_allows_what_the_site_uses` and the maintainer's post-merge check.
2. A cache route matching HTML, so a publish takes a year to show. Pinned by `test_html_is_never_long_cached`.
3. An action left on a tag, or a SHA without its version comment, so Dependabot cannot update it. Pinned by `test_actions_are_pinned`.
4. A migrated body link with `target="_blank"` and an existing `rel="nofollow"`. Expected: `rel` kept, `noopener` added once. Pinned by `test_noopener_added_once`.
5. Config size creeping over the limit once headers are added on top of the upload routes. Pinned by spec 05's `test_config_size`, run against a fixture with 40 upload routes in `test_config_size_with_many_uploads`.

---

### Task 1: Headers and cache routes

**Files:**
- Modify: `site/layouts/home.swaconfig.json`
- Create: `tests/test_headers.py`

**Interfaces:**
- Consumes: `site.Data.embeds` (spec 06), `site.Data.legacy` (spec 05).
- Produces: `globalHeaders` and cache routes in the generated config.

- [ ] **Step 1: Write the failing tests**

```python
def csp(self) -> dict[str, list[str]]:
    """Directive name to its sources, from globalHeaders."""

def test_headers_present(self):
    h = self.cfg["globalHeaders"]
    self.assertEqual(h["Strict-Transport-Security"], "max-age=300")
    self.assertEqual(h["X-Content-Type-Options"], "nosniff")
    self.assertEqual(h["Referrer-Policy"], "strict-origin-when-cross-origin")
    self.assertEqual(h["X-Frame-Options"], "DENY")
    self.assertIn("browsing-topics=()", h["Permissions-Policy"])

def test_csp_allows_what_the_site_uses(self):
    c = self.csp()
    self.assertEqual(sorted(c["frame-src"]), ["https://calendar.google.com", "https://embedsocial.com"])
    self.assertIn("https://api.web3forms.com", c["form-action"])
    self.assertIn("https:", c["img-src"])
    self.assertEqual(c["style-src-attr"], ["'unsafe-inline'"])
    self.assertEqual(c["script-src"], ["'self'"])
    self.assertEqual(c["frame-ancestors"], ["'none'"])

def test_cache_routes_first(self):
    routes = [r["route"] for r in self.cfg["routes"]]
    self.assertEqual(routes[:5], ["/css/*", "/js/*", "/images/*", "/fonts/*", "/uploads/*"])
    first = self.cfg["routes"][0]["headers"]["Cache-Control"]
    self.assertEqual(first, "public, max-age=31536000, immutable")

def test_html_is_never_long_cached(self):
    for r in self.cfg["routes"]:
        cc = r.get("headers", {}).get("Cache-Control", "")
        if "max-age=31536000" in cc:
            self.assertRegex(r["route"], r"^/(css|js|images|fonts)/\*$")

def test_config_size_with_many_uploads(self):
    # build with a data_dir whose legacy.yaml adds 40 upload rewrites of realistic length
    self.assertLess(size, 20_480)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npm test -- headers.feature` in `tests/`

- [ ] **Step 3: Extend the template**

- [ ] **Step 4: Run the full suite**

Run: `npm test` in `tests/`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add security headers, CSP and long caching for fingerprinted files"
```

---

### Task 2: Safe new-tab links and budgets

**Files:**
- Modify: `site/layouts/_partials/body.html`, any template with `target="_blank"`
- Create: `tests/fixtures/content/notices/links.md` (`title: Fixture links`, `date: 2015-07-01`, body with `<a href="https://example.org/a" target="_blank">a</a>`, `<a href="https://example.org/b" target="_blank" rel="nofollow">b</a>`, `<a href="https://example.org/c" target="_blank" rel="noopener">c</a>`)
- Create: `tests/test_budgets.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_noopener_added_once(self):
    page = read("notices/notice/links/index.html")
    self.assertIn('href="https://example.org/a" target="_blank" rel="noopener"', page)
    self.assertRegex(page, r'href="https://example\.org/b" target="_blank" rel="nofollow noopener"')
    self.assertEqual(page.count('rel="noopener"'), 2)

def test_home_first_load(self):
    total = sum(size(p) for p in [home_html, css, js, hero_fallback_src])
    self.assertLess(total, 400_000)

def test_only_our_script(self):
    for page in all_html():
        srcs = re.findall(r'<script[^>]*src="([^"]+)"', page.text)
        self.assertTrue(all(re.match(r"^/js/site\.min\.[0-9a-f]{64}\.js$", s) for s in srcs), page.name)

def test_images_are_described_and_sized(self):
    for page in all_html():
        for img in re.findall(r"<img\b[^>]*>", page.text):
            self.assertRegex(img, r'\balt="', img)
            if re.search(r'src="/(uploads|images)/', img) and not re.search(r'\.(gif|svg)"', img):
                self.assertRegex(img, r'\bwidth="\d+"', img)
                self.assertRegex(img, r'\bheight="\d+"', img)
        eager = [i for i in re.findall(r"<img\b[^>]*>", page.text) if 'loading="lazy"' not in i]
        self.assertLessEqual(len(eager), 1, page.name)

def test_no_client_storage(self):
    js = read_glob("js/site.min.*.js")
    self.assertNotIn("document.cookie", js)
    self.assertNotIn("localStorage", js)
```

Build `FIXTURES / "content"` minified with fixture uploads (`helpers.make_png`, as spec 06).

- [ ] **Step 2: Run them and watch them fail**

Run: `npm test -- budgets.feature` in `tests/`

- [ ] **Step 3: Add `noopener` handling in `body.html` and templates, and fix anything the budget tests find**

- [ ] **Step 4: Run the full suite**

Run: `npm test` in `tests/`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add noopener to new-tab links and delivery budget tests"
```

---

### Task 3: Pinned pipeline

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Create: `.github/dependabot.yml`
- Modify: `tests/test_workflow.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_actions_are_pinned(self):
    uses = re.findall(r"(?m)^\s+(?:- )?uses: (\S+)(.*)$", WF)
    self.assertTrue(uses)
    for ref, rest in uses:
        self.assertRegex(ref, r"^[\w.-]+/[\w.-]+@[0-9a-f]{40}$", ref)
        self.assertRegex(rest, r"^\s+# v\d+(\.\d+)*$", ref)

def test_hugo_checksum(self):
    self.assertIn("HUGO_SHA256: 0163f5c3deddac1f494a1629ddc40c65d18de9d5794facd98f7f96ac2c7d8957", WF)
    self.assertLess(WF.index("sha256sum -c -"), WF.index("tar -xzf"))

def test_dependabot(self):
    dep = (REPO / ".github/dependabot.yml").read_text()
    self.assertIn("package-ecosystem: github-actions", dep)
    self.assertIn("interval: monthly", dep)
```

Update `test_oidc_only` and `test_tests_and_build_run_before_deploy`, which look for `uses: azure/login@v3` and `uses: Azure/static-web-apps-deploy@v1`: match `uses: azure/login@` and `uses: Azure/static-web-apps-deploy@` instead.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm test -- workflow.feature` in `tests/`

- [ ] **Step 3: Resolve SHAs with `git ls-remote --tags`, pin each action, add the checksum step and `dependabot.yml`**

- [ ] **Step 4: Run the suite and `actionlint .github/workflows/deploy.yml`**

- [ ] **Step 5: Commit**

```bash
git add .github tests
git commit -m "Pin actions to commits, check the Hugo download and add Dependabot"
```

---

### Task 4: Cookie check and policy outcome

**Files:**
- Create: `docs/features/page-cms/page-cms-how-to-check-cookies.md`
- Modify (only if no cookies): delete `site/content/page/about/cookie-policy.md`, add the redirect to `site/data/legacy.yaml`, add `/page/about/cookie-policy` handling to `tests/fixtures/live-urls.txt` expectations (it becomes a configured redirect)
- Modify: `tests/test_docs.py`

- [ ] **Step 1: Write the how-to and its doc test** (exists, front matter, no em dash, names the three pages and both browsers), run the suite, commit.

```bash
git add docs tests
git commit -m "Add a how-to for checking cookies"
git push -u origin <session branch>
```

- [ ] **Step 2: Ask the maintainer to do the check** after merge and report back. Stop here until they do.

- [ ] **Step 3: Apply the outcome** from the Cookies table. No cookies: delete the page, add the redirect, run the suite and `check_urls.py --built` (the cookie policy path now passes as a redirect), commit `Drop the cookie policy, the site sets no cookies`. Cookies found: record them in the how-to and ask the maintainer to choose; the chosen option is a follow-up task in this spec.
