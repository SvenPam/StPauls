---
date: 2026-10-18
tags: [reference, stpauls, specs]
status: stable
---

# Spec conventions

_The rules and names every spec in this folder relies on. Read this file alongside the [design](page-cms-feature.md) and the spec you are building. A spec that changes a name here updates this file in the same commit._

---

## Before you start a spec

1. Read the [design](page-cms-feature.md), this file, then the spec.
2. Check every **Consumes** line in the spec against `main`. If an earlier spec shipped a different name, update the spec and this file first, and say so in the hand-off.
3. Work on the session branch. Never push to `main`: it is the deploy branch and Pages CMS commits to it. No pull request unless the maintainer asks.
4. Manual steps (Azure portal, Entra ID, GitHub settings, Cloudflare, registrar, Pages CMS, Web3Forms) belong to the maintainer. Write them in the spec's how-to, and say plainly when you are blocked on one.

---

## Global constraints

Every task in every spec includes these.

### Build

- Eleventy `3.1.6` on Node `26`. `.nvmrc` holds `26`, `package.json` has `"engines": { "node": ">=26" }`, the workflow reads `node-version-file: .nvmrc`.
- One root `package.json` and `package-lock.json` for the build, the tests and the hand-run scripts. Exact versions only (no `^` or `~`), `.npmrc` has `save-exact=true`. A new dependency is exact-pinned, and `npm audit` reports 0 vulnerabilities after any change to `package.json`.

| Package | Pin | Use |
|---|---|---|
| `@11ty/eleventy` | `3.1.6` | Generator |
| `sharp` | `0.35.5` | Resized images |
| `clean-css` | `5.3.3` | Stylesheet minify |
| `terser` | `5.51.2` | Script minify |
| `yaml` | `2.9.1` | `site/data/*.yaml` |
| `entities` | `6.0.1` | Entity decoding in feed text |
| `cheerio` | `1.2.0` | HTML parsing in `scripts/migrate.mjs` only. Added by spec 07 |
| `@playwright/test` | `1.56.1` | Browser tests. Matches the sandbox Chromium |
| `playwright-bdd` | `9.2.1` | Gherkin scenarios. The 8.x line had audit findings with no fix |
| `overrides` | `chokidar` `4.0.3`, `argparse` `2.0.1` | Without them `npm audit` reports 1 high, 1 moderate |

| Path | What |
|---|---|
| `eleventy.config.js` | Input is the content folder (`CONTENT`, default `site/content`), includes `site/_includes/`, output `_site/`. Loads every `config/*.js` in name order |
| `config/*.js` | One module per concern, each a default export that takes `eleventyConfig`. Pure functions are also named exports, so `tests/unit/` can import them |
| `site/content/` | Paul's content, `.md` files only |
| `site/_includes/` | Nunjucks layouts and includes |
| `site/pages/*.njk` | Site-owned pages (home stub, 404, topic pages, feeds). `config/pages.js` registers each with `addTemplate`. Each sets its own `permalink` and `layout` |
| `site/data/*.yaml` | Global data. `config/data.js` makes one global per file, named after it |
| `site/assets/` | Stylesheets, the script and layout images, processed by `config/assets.js` and `config/images.js` |
| `site/static/` | Copied as is to the site root |

- Every `.md` file is front matter plus an HTML body. `config/content.js` registers the `md` extension raw: no Markdown and no Nunjucks runs on it, so a body is published byte for byte, `{{ }}` and `{% %}` included. Templates print it with `{{ content | safe }}`.
- A content file gets a URL only from `itemPermalink` in `config/content.js`. Today that covers `blog`, `calendar` and `notices`. Anything else in the content folder gets `permalink: false` and renders nothing (`content.njk` includes a section template only for those three) until a spec adds it (spec 04 adds `page/` and the home page).
- Internal links are written without a trailing slash, except `/`, through the `href` filter. Eleventy's `page.url` and `item.url` end with `/`. Static Web Apps runs with `trailingSlash: "never"` from spec 05, so `/blog/article/x` is served directly and `/blog/article/x/` gets a 301.
- No inline `<script>`, `<style>` or event handlers in templates. Script lives in `site/assets/js/site.js`, minified, hashed into the file name and loaded with `defer` and `integrity`. Nothing needs script to read or navigate.
- Templates use no inline `style` attributes. Content bodies may contain them (legacy HTML and the rich text editor).
- One stylesheet under 25000 bytes, one script under 2048 bytes.
- Templates make no requests to other domains, except the two embeds (spec 06) and the contact form post (spec 08).
- `staticwebapp.config.json` is written by `config/swa.js` after every build. There is no static copy. Spec 05 adds routes there, spec 09 headers.

### Tests

- Run everything with `npm ci && npm test` at the repo root. `npm test` runs `npm run test:unit`, then `npm run test:bdd`. Committed, and run by the `build` job on every pull request, every push to `main` and the nightly schedule, so before every deploy.
- Behaviour: Playwright Test with `playwright-bdd`. Scenarios are Gherkin in `tests/features/*.feature`, steps are JavaScript in `tests/steps/*.js`, config in `tests/playwright.config.js`.
- Pure functions and generated files: `node:test` in `tests/unit/*.test.mjs` (dates, filters, images, topics, `staticwebapp.config.json`, the workflow, the Azure roles). Anything a visitor or Paul would see is a scenario instead.
- Tests assert behaviour a visitor or Paul would notice: what a page shows, where links go, what the script does in a real browser, what the feeds and the Pages CMS config produce. Never assert on docs, Markdown, or the wording of a file when its effect can be checked instead.
- Steps are reusable and written in plain words ("When I open \"/calendar\"", "Then the cards are, in order:"). Add a step only when no existing one fits.
- Time-dependent behaviour uses fixture dates far in the past (`2015-...`) or far in the future (`2099-...`), and Playwright's clock (`Given it is "..."`) for what the script does between builds. A summer date (`2099-06-...`) covers the London offset.
- Tests never assert on `site/content/` or `site/data/settings.yaml`. Paul edits and deletes those, and a failing test would block his publish. `tests/serve.js` builds a fixture folder (`tests/fixtures/content/`, `tests/fixtures/empty/`) and serves it as Static Web Apps does. Two exceptions: "Whatever Paul has saved builds" builds the real content and asserts only that it builds, and spec 04 may check the structural `page/{type}/_index.md` files, which are hidden from Pages CMS.
- Every spec adds or updates fixtures and scenarios for what it builds, and keeps "No personal details or trackers" passing.
- Specs 04 to 12 name the behaviours to cover. Write each as a scenario in the matching feature file, or as a `node:test` case when it checks a function or a generated file. Drop any test that only checks docs or Markdown.
- The `audit` job can show a red check on pull requests and pushes without failing the run (`continue-on-error`). Never make it a required check. Only the weekly scheduled audit fails the run.

### Content and editor

- Any task that adds or renames a front matter key updates `.pages.yml` in the same task. From spec 03 Pages CMS keeps unknown keys (`settings.content.merge: true`), but every key is still declared, with `hidden: true` when Paul should not see it.
- Rich text fields use `format: html`. The trial notice was stored as Markdown because that is the default.
- Date fields with a time keep seconds in their `format` (`yyyy-MM-dd'T'HH:mm:ss`). See Eleventy facts.
- Existing live URLs never change. A migrated item that cannot get its live URL from the permalink pattern carries a hidden `url` field.

### Privacy and security

- None of these anywhere in `site/`: the maintainer's name, `ste-pam.com`, LinkedIn, analytics, Disqus, social share links. `BANNED` in `tests/steps/site.js` enforces the list.
- No secrets in the repo. The Web3Forms access key is public by design and is not a secret.

### Azure and GitHub

- Static Web App `Microsoft.Web/staticSites@2025-03-01`, SKU `Free`, `location` default `westeurope`, name `swa-stpauls-web`. Bicep in `infra/main.bicep` and `infra/main.bicepparam`, run by the `deploy` job.
- Azure sign in by OIDC only. Secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, variable `AZURE_RESOURCE_GROUP`. No client secret, no stored SWA token, no `environment:` on the job (it changes the OIDC subject away from `repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main`).
- The identity holds the two custom roles in `infra/roles/`, never `Contributor`. Set up in the [Azure how-to](page-cms-how-to-set-up-azure-and-pages-cms.md). `tests/unit/roles.test.mjs` pins their actions.

| Role | File in `infra/roles/` | Actions | Assigned at |
|---|---|---|---|
| `StPauls Static Web App deployer` | `stpauls-static-web-app-deployer.json` | `Microsoft.Web/staticSites/read`, `write`, `customDomains/*`, `listSecrets/action` | The Static Web App |
| `StPauls template deployer` | `stpauls-template-deployer.json` | `Microsoft.Resources/deployments/*` | The resource group |

- A spec whose Bicep needs another action (spec 11's custom domain may) adds that one action to the role file and its unit test, and lists `az role definition update` in its manual steps.

Jobs in `.github/workflows/deploy.yml`:

| Job | Runs | Does | Rights |
|---|---|---|---|
| `build` | Pull requests, pushes to `main`, nightly (`17 3 * * *`), manual. Not the weekly audit | `npm ci`, `npm run build`, `npm test`, uploads `_site` as the `site` artifact | `contents: read` |
| `audit` | Every run. Fails the run only on the weekly schedule (`41 4 * * 1`) | `npm ci --ignore-scripts`, `npm audit` | `contents: read` |
| `deploy` | `main` only. Not pull requests, not the weekly audit. Needs `build`, never `audit` | Downloads `site` (`actions/download-artifact@v8`), runs Bicep, reads the token with `az staticwebapp secrets list`, uploads with `Azure/static-web-apps-deploy@v1` (`action: upload`, `skip_app_build: true`) | The only job with `id-token: write`. Runs no `node`, `npm` or `npx` |

- Concurrency group `${{ github.event.schedule == '41 4 * * 1' && 'audit' || 'deploy' }}-${{ github.ref }}`, `cancel-in-progress: false`. A second Pages CMS save waits for the running deploy and then ships, and the weekly audit never cancels a pending deploy.
- Pushes to `main` run only when a path in `on.push.paths` changes: `site/**`, `config/**`, `eleventy.config.js`, `package.json`, `package-lock.json`, `.nvmrc`, `infra/**`, `.pages.yml`, `tests/**`, the workflow. A spec that adds a new top-level build input adds it there and to `tests/unit/workflow.test.mjs`.
- Dependabot (`.github/dependabot.yml`) opens one grouped pull request a month for npm and one for GitHub Actions, at most 5 open each. Merging them is the one accepted recurring chore (2026-10-18).
- Actions are pinned to major tags until spec 09 pins them to full commit SHAs.
- Changes reach the test URL only after the maintainer merges.

### Docs and commits

- Everything for this migration lives in `docs/features/page-cms/`, named `page-cms-<type>-<topic>.md`: `page-cms-feature.md` is the plan, `page-cms-spec-NN-<topic>.md` the specs, and how-tos, runbooks, guides and reports follow the same prefix (`page-cms-how-to-...`, `page-cms-runbook-...`).
- Docs follow `docs/features/page-cms/page-cms-discovery-*.md`: YAML front matter (`date`, `tags`, `status`), one H1, italic one-line summary, tables over prose, no em dashes.
- Markdown file names never contain `:`, `/`, `#` or `^`.
- Anything written for someone else to send (email, message) is humanised and has no em dash.
- Commit messages are a short imperative sentence, as in `git log` (no `feat:` prefix), ending with the session's attribution lines.

---

## Local tools

Install outside the repo, for example in the scratchpad.

| Tool | How |
|---|---|
| Node 26 | `npm i --prefix <dir> node@26`, then put `<dir>/node_modules/.bin` first on `PATH`. The sandbox's own Node is 22 and is too old. Then `npm ci` at the repo root |
| Playwright and screenshots | Come with `npm ci`. Chromium is in `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`). Never run `playwright install` in the sandbox |
| Bicep 0.48.1 | Download `https://api.nuget.org/v3-flatcontainer/azure.bicep.commandline.linux-x64/0.48.1/azure.bicep.commandline.linux-x64.0.48.1.nupkg`, extract with `python3 -m zipfile -e <nupkg> <dir>`, `chmod +x <dir>/tools/bicep`, put `<dir>/tools` on `PATH` |
| actionlint | `python3 -m venv <dir> && <dir>/bin/pip install actionlint-py` |
| Hugo 0.167.0 | Only for `scripts/compare-hugo.mjs`, the one-off parity check. `<dir>/bin/pip install hugo==0.167.0` in the same venv. Nothing else needs it |

| Reachable from the sandbox (checked 2026-10-17) | Not reachable |
|---|---|
| Live site `http://stpaulswarton.co.uk` (bare domain, not `www`) | `az`, Azure portal, `learn.microsoft.com` |
| Test site `https://brave-coast-006318103.5.azurestaticapps.net` | `pagescms.org`, `app.pagescms.org` |
| GitHub release downloads, `git ls-remote` on public repos, the npm registry | `web3forms.com`, DNS-over-HTTPS resolvers (both work on full network access) |
| With full network access: `dns.google` (DNS over HTTPS), `rdap.nominet.uk` | Raw DNS (port 53, only `A` answers come back) and `whois` (port 43), whatever the network setting |
| `raw.githubusercontent.com`: docs sources in `MicrosoftDocs/azure-docs`, `pages-cms/website` (`docs/`), `11ty/11ty-website` (`src/docs/`, checked 2026-10-18), `surjithctly/web3forms-docs` | The GitHub web UI and API |

Say plainly in the hand-off what could not be run locally.

---

## Checked facts

Behaviour the specs rely on, checked on 2026-10-17 (Eleventy and the Static Web Apps routing rows on 2026-10-18). Re-check if a version changes.

### Azure Static Web Apps

| Fact | Consequence |
|---|---|
| File paths are case-sensitive (`/NOTICES/` is 404) | Mixed-case legacy links (`/Calendar`, `/Notices`, `/Contact`, `/Account/Login`) need explicit routes |
| Route matching is case-sensitive: the exact-case legacy path 301s, the lower-cased one 404s (checked against tranquility and ste-pam.com) | Each legacy case variant needs its own route. A redirect cannot loop on a target that differs in case. `tests/unit/swa-config.test.mjs` checks routes are unique exactly as written |
| Routes match the decoded path | Legacy routes with spaces are written with spaces, not `%20`. Redirect targets are encoded. A unit test checks no route is percent-encoded |
| Redirect targets cannot use wildcard captures. Wildcards only at the end of a route | Legacy upload paths get one generated route per file |
| `trailingSlash: "never"`: `/about` serves `/about/index.html` with 200, `/about/` gets a 301 to `/about` | Live URLs stay identical |
| `staticwebapp.config.json` is limited to 20 KB | Generated routes stay small. A unit test checks the size |
| `azurestaticapps.net` already sends `strict-transport-security: max-age=10886400; includeSubDomains; preload` and `cache-control: public, must-revalidate, max-age=30` on HTML | Spec 09 sets both explicitly |
| On a custom domain SWA adds `strict-transport-security: max-age=10886400; includeSubDomains; preload` itself | A 5-minute HSTS only helps a rollback if our header replaces it. Spec 09 tests this on the `azurestaticapps.net` URL first |

### Eleventy 3.1.6

| Fact | Consequence |
|---|---|
| `fileSlug` drops a date prefix: `2026-01-05-dated.md` gives `dated` | Not used. `itemPermalink` keeps the whole file name, so the URL is `/notices/notice/2026-01-05-dated`, as Hugo built it |
| Front matter times are read as UTC. A `Date` from `2026-10-17T19:30:00` is 19:30 UTC | Times are London wall-clock times. Display uses UTC getters (`config/dates.js`), anything compared with "now" goes through `londonInstant` |
| A time without seconds (`2026-10-17T19:30`) is not a YAML timestamp and stays a string | `wall()` in `config/dates.js` reads such a string, and a quoted `date: "2099-07-03T10:00:00"`, as a wall time (`YYYY-MM-DD`, optional `THH:MM`, optional `:SS`). Every date filter, `eventEnd`, `eventStatus` and `upcoming` use it. Anything else is left to the caller's fallback |
| `layout` front matter names a file in `site/_includes/` (`layout: base.njk`) | Content gets `layout: content.njk` as global data, which picks `sections/{section}-list.njk` or `-item.njk`. A content file that sets its own `layout` skips that dispatch |
| A computed `layout` did not work in the spike | `layout` is plain global data, never in `eleventyComputed` |
| Global `eleventyComputed` also applies to virtual templates (`addTemplate`) | The computed `section`, `isIndex`, `topic` and `permalink` act only on `.md` inputs. Site pages set their own `permalink` and `layout` |
| A front matter `url` without a trailing slash is published at `{url}/index.html`, and `item.url` ends with `/` | Hence the `href` filter. A `url` with several segments (`/calendar/event/456/x`) is kept whole |
| Collections are sorted by `date`, oldest first | Lists use `newestFirst`. Nunjucks' own `reverse` reverses in place, so it is not used on a collection |
| Inside `asyncEach`, a plain `{% if %}` around the async `picture` shortcode drops its output | Use `{% ifAsync %}` around any `picture` call that can run inside a list |
| `item.templateContent` of a content item is the raw body | Feeds take their fallback description from it with `excerpt` |
| A template error fails the whole build | No `--panicOnWarning` equivalent is needed |
| Topic pages come from `site/data/topics.yaml`, not from the values found in content | A topic not in the list gets no page and no link. Hugo built a page for any value |

Accepted differences from the Hugo build (checked with `scripts/compare-hugo.mjs`, 2026-10-18):

| Difference | Why |
|---|---|
| Feed `<link>` and `<guid>` are absolute (`https://stpaulswarton.co.uk/...`) | RSS readers need them. Hugo wrote site-relative links |
| Feed descriptions put a space where a tag was | Words in neighbouring blocks stay apart. Hugo joined them |
| Topic index title `Topics`, term titles from `topics.yaml` (`Church Events`), 404 title `Page Not Found` | Readable titles. Hugo used `Blogtopics`, `Church-Events`, `404 Page not found` |
| No generator meta tag | Tool marker, not content |
| Every section and topic in `topics.yaml` has a page, "Nothing here yet." when empty | Fixed set of topic URLs |

### Pages CMS (docs at `pages-cms/website`, `docs/configuration/`)

| Fact |
|---|
| By default (`settings.content.merge: false`) saving rewrites the file from the schema and removes unknown keys |
| Fields support `hidden`, `readonly`, `required`, `description`, `default` and `pattern` (string and text only) |
| `rich-text` takes `format: html` or `markdown` |
| `type: file` edits one data file. `type: group` with `items` groups entries in the sidebar |
| `select` takes `values` as strings or `{ name, label }`, optionally with `multiple` |
| `date` takes `time: true` and a date-fns `format`, for example `yyyy-MM-dd'T'HH:mm:ss`. Without seconds the value reaches Eleventy as a string |
| `operations` can turn off `create`, `rename` or `delete` per entry |
| `filename` tokens include `{year}`, `{month}`, `{day}`, `{primary}` and `{fields.<name>}` |

### Web3Forms (docs mirror `surjithctly/web3forms-docs`)

| Fact |
|---|
| `POST https://api.web3forms.com/submit`, `access_key` required, other field names are passed through to the email |
| `email` sets reply-to. `subject` and `from_name` set the email subject and sender name |
| `redirect` must be an absolute URL on the same domain on the free plan, and works only for a plain HTML form without script |
| `botcheck` is a hidden checkbox honeypot. Marked as less effective than a captcha |
| hCaptcha needs the `web3forms.com` client script. Not used, see spec 08 |

---

## Site contract

Names later specs rely on. **Spec** is where each name is introduced. Specs 00 to 03 were built in Hugo and ported to Eleventy on 2026-10-18.

### Content

| Path in `site/content/` | What | URL | Spec |
|---|---|---|---|
| `_index.md` | Home | `/` | 04 |
| `blog/_index.md`, `blog/{name}.md` | Blog index and articles | `/blog`, `/blog/article/{name}` | 03 |
| `calendar/_index.md`, `calendar/{name}.md` | Calendar and events | `/calendar`, `/calendar/event/{name}`. Migrated: `url: /calendar/event/{id}/{slug}` | 03, 07 |
| `notices/_index.md`, `notices/{name}.md` | Notices | `/notices`, `/notices/notice/{name}`. Migrated: `url: /notices/notice/{id}/{slug}` | 00, 03, 07 |
| `page/_index.md` | Pages root, not rendered | | 04 |
| `page/{type}/_index.md` | Page type: menu label and order, not rendered | | 04 |
| `page/{type}/{name}.md` | Page | `/page/{type}/{name}` | 04 |
| `page/about/contact-us.md` | Contact page, `url: /contact`, `layout: contact.njk` | `/contact` | 04, 08 |
| `contact-thanks.md` | Thanks page after the form, `url: /contact/thanks` | `/contact/thanks` | 08 |
| `sitemap.md` | HTML site map, `url: /sitemap`, `layout: sitemap.njk` | `/sitemap` | 05 |

`{name}` is the whole file name without `.md`, date prefix included. Until spec 04, only `blog/`, `calendar/` and `notices/` are published, and `/` is `site/pages/home.njk`, a stub that `staticwebapp.config.json` redirects to `/notices/`. From spec 04 a file at the content root other than `_index.md` is published only at its `url`, and a page in a folder with no `_index.md` still gets `/page/{type}/{name}` but no menu entry.

Page types: `about`, `services`, `groups`, `gallery`, `forms`, `links`, `community`, `safeguarding`.

New items from Pages CMS are named `{year}-{month}-{day}-{primary}.md` for blog, events and notices, and `{primary}.md` for pages.

### Front matter

| Key | Types | Pages CMS field | Notes |
|---|---|---|---|
| `title` | all | `string`, required | |
| `date` | article, notice | `date` | Publish date |
| `date` | event | `date`, `time: true` | Start, Europe/London wall time |
| `end` | event | `date`, `time: true` | End. Read with `eventEnd`, falls back to the start |
| `summary` | all | `string` | Lists and meta description. Nothing shown when empty |
| `location` | event, notice | `string` | |
| `image`, `image_alt` | article, event, page | `image`, `string` | `/uploads/...` path |
| `blogtopics`, `eventtopics`, `noticetopics` | article, event, notice | `select`, single value | One of the four topic slugs |
| `header`, `footer` | page | `boolean` | Show in header menu, footer |
| `weight` | page, page type | `number` | Order within the menu group |
| `embed`, `embed_src` | page | `select`, `string` | Spec 06. `google-calendar` or `facebook-album` |
| `url` | article, event, notice, page | `string`, `hidden` | Migrated items only |
| `lead`, `hero_image`, `hero_alt` | home | `string`, `image`, `string` | |
| `layout` | contact, sitemap | `string`, `hidden` on page collections | A file in `site/_includes/` |
| `sitemap` | sitemap, thanks page, topic indexes | not in Pages CMS | `false` leaves the page out of `sitemap.xml` (05) |

Computed by `config/content.js` for every `.md` input, never written in front matter:

| Key | Value |
|---|---|
| `section` | The folder under the content folder (`blog`, `notices`, later `page/about`), `''` at its root |
| `isIndex` | `true` for `_index.md` |
| `topic` | The section's topic field, first value, trimmed and lower-cased, or `''` |
| `permalink` | From `itemPermalink`, or `false` |

### Pages CMS entries

| Entry | Type | Edits | Spec |
|---|---|---|---|
| `blog`, `events`, `notices` | `collection` | `site/content/blog`, `calendar`, `notices` | 03 |
| `home` | `file` | `site/content/_index.md`, `operations.delete: false` | 04 |
| `pages` | `group` of `page-about` to `page-safeguarding` | `site/content/page/{type}`, `filename: "{primary}.md"` | 04 |
| `settings` | `file` | `site/data/settings.yaml` | 08 |

Steps in `tests/steps/editor.js` look through a group's `items` as well as the top level.

### Topics

| Front matter key | Term URL | Index URL | Spec |
|---|---|---|---|
| `blogtopics` | `/blog/topic/{slug}` | `/blog/topic` | 03 |
| `eventtopics` | `/calendar/topic/{slug}` | `/calendar/topic` | 03 |
| `noticetopics` | `/notices/topic/{slug}` | `/notices/topic` | 03 |

Slugs and labels are in `site/data/topics.yaml`: `website` (Website), `church-services` (Church Services), `church-events` (Church Events), `other-events` (Other Events). `config/topics.js` builds one page per section and slug (`site/pages/topics.njk`) and one index per section (`site/pages/topic-index.njk`).

### Data files in `site/data/`

Each file is a global named after it (`topics.yaml` is `topics`). From spec 08, `DATA=<folder>` layers a fixture folder over `site/data`: a file there wins over the one of the same name, the rest still come from `site/data`. `config/topics.js` always reads `site/data/topics.yaml`.

| File | Owner | Contents | Spec |
|---|---|---|---|
| `site.yaml` | Maintainer | `title`. Later site-wide values, see Site data | 02 |
| `topics.yaml` | Maintainer | Topic slug to label | 03 |
| `menus.yaml` | Maintainer | `main` (`{ name, url }` or `{ name, children }`) and `footer` (`{ title, links }`). Replaced by menus computed from content | 02, removed 04 |
| `embeds.yaml` | Maintainer | Embed type to allowed host, title and aspect ratio | 06 |
| `legacy.yaml` | Maintainer | `rewrites` and `redirects` lists of `{ from, to }` for `staticwebapp.config.json`, and `upload_prefixes`, the legacy upload folders in every spelling seen on live. Each file under `uploads/legacy/` in the build gets a 301 from every prefix | 05, 07 |
| `settings.yaml` | Paul, through Pages CMS | `contact_access_key`, `contact_subject`, `enquiry_types`, `address`, `facebook_url`, `map_url`, `directions_url` | 08 |

### Includes in `site/_includes/`

| Include | Takes | Renders | Spec |
|---|---|---|---|
| `base.njk` | `content` | Page shell: head, skip link, header, `<main>`, footer | 02 |
| `content.njk` | `section`, `isIndex` | Layout for content. Includes `sections/{section}-list.njk` or `sections/{section}-item.njk` for the dated sections, `sections/home.njk` for the root `_index.md` (04), `sections/page.njk` for anything else (04) | 03, 04 |
| `sections/home.njk` | Home data | Hero, Church Notices, Latest Blog Articles | 04 |
| `sections/page.njk` | Page data | Title, lead, image, body in `.prose`. Spec 06 adds the embed after the body | 04, 06 |
| `contact.njk` | Page data | Contact page (`layout: contact.njk`): the page, then the address and contact list link, or the form from spec 08 | 04, 08 |
| `sitemap.njk` | `collections` | HTML site map (`layout: sitemap.njk`) | 05 |
| `sections/{blog,calendar,notices}-{list,item}.njk` | Page data | Section index and item pages | 03 |
| `partials/head.njk` | `title`, `summary`, `assets` | `<title>`, meta description, stylesheet and script with `integrity` | 02 |
| `partials/header.njk` | `collections \| menuItems` (`menus.main` until 04), `page.url` | Brand, menu button, `<details>` dropdowns, `aria-current` | 02, rewritten 04 |
| `partials/footer.njk` | `collections \| footerGroups` (`menus.footer` until 04), `site`, `build.year` | Footer groups, Find Us map and address, copyright | 02, rewritten 04, 08 |
| `partials/card.njk` | `item`, optional `cardFill` (04) | `<article class="card">` for lists, topic pages and the home page. Render inside `asyncEach`. With `cardFill` the image is cropped with `picture` `fill` | 03, 04 |
| `partials/blog-aside.njk` | `topics`, `collections.blog` | Blog topics and the 7 latest articles | 03 |
| `partials/image.njk` | `imageSrc`, `imageAlt` | `picture` for a file under `site/assets/`, plain `<img>` otherwise. From 06 every image goes to `picture` | 03, uploads 06 |
| `partials/topic-link.njk` | `topicSlug`, `topicSection` | Topic link, or nothing for a topic not in `topics.yaml` | 03 |
| `partials/embed.njk` | Page data, `embedFor` | Sandboxed responsive iframe, or nothing. Included by `sections/page.njk` after the body | 06 |

### Functions in `config/`

Filters unless marked. Named exports are importable by `tests/unit/`.

| Name | Module | Takes | Returns | Spec |
|---|---|---|---|---|
| `href` | `filters.js` | URL string | The URL without a trailing slash, except `/` and absolute URLs | 02 |
| `newestFirst` | `filters.js` | Collection | A reversed copy | 03 |
| `plainText` | `filters.js` | HTML | Visible text, entities decoded once, whitespace collapsed | 03 |
| `excerpt` | `filters.js` | HTML, max (300) | `plainText` cut at max code points, with `…` when cut | 03 |
| `date` | `dates.js` | Date | Day-Mon-YY, as `01-Aug-15` | 03 |
| `time`, `month`, `day` | `dates.js` | Date | `7:30 PM`, `January`, `5` | 03 |
| `isoLondon` | `dates.js` | Date | RFC 3339 with London's offset, `Z` in winter | 03 |
| `rfc822London` | `dates.js` | Date | RSS `pubDate` with London's offset | 03 |
| `eventEnd` | `dates.js` | Item data | End as a Date, or the start when missing, empty, unreadable or not after it | 03 |
| `eventStatus` | `dates.js` | Item data, now | `Expired`, `Active`, `Soon` (within 168 hours) or `Future` | 03 |
| `upcoming` | `dates.js` | Collection, now | Items whose end has not passed, soonest first | 03 |
| `londonInstant` | `dates.js`, export only | Wall-time Date | The real instant | 03 |
| `withTopic` | `topics.js` | Collection, slug | Items with that `topic` | 03 |
| `topicOf` | `content.js`, export only | Section, data | Topic slug or `''` | 03 |
| `itemPermalink` | `content.js`, export only | Input path, data | Output path or `false` | 03, extended 04 |
| `assetPath` | `images.js` | Front matter image path | Path under `site/assets/`, or `''` | 03 |
| `UPLOADS_DIR` | `images.js`, export only | | `process.env.UPLOADS ?? 'site/static/uploads'` | 06 |
| `optimiseImages` | `images.js`, export and the `images` transform | HTML, `{ assets, uploads, out }` | Body `<img>` of uploads (also on `http(s)://stpaulswarton.co.uk/uploads/`) as `<picture>`, eager only for the first image in `<main>`; other images not under `/images/` gain `loading="lazy" decoding="async"` | 06 |
| `embedFor` | `embeds.js` | Page data, `embeds` | `{ key, src, title }` when `embed` is known and `embed_src` (a leading `//` made `https://`) is `https:` on exactly that host, else `null` | 06 |
| `picture` (async shortcode) | `images.js` | `{ src, alt, sizes, eager, fill }`, `src` under `site/assets/`, or `/uploads/...` from `UPLOADS_DIR` (06). Core `pictureHtml(opts, { assets, uploads, out })`. A missing upload or another site gives a plain lazy `<img>`; GIF and SVG uploads stay plain with their size | `<picture>` with WebP and the original format at 480, 800, 1200, 1600 (up to the source width), `width`, `height`, lazy unless `eager` | 02, `fill` 04, uploads 06 |
| `menuItems` | `menus.js` | `collections` | `menus.main` shape: Home, Blog, Calendar, then per page type in weight order its `header: true` pages, a plain `{ name, url }` for one, `{ name, children }` for several, none skipped | 04 |
| `footerGroups` | `menus.js` | `collections` | `menus.footer` shape: `Links` (blog, calendar, notices, site map, `about` pages with `footer: true`), then a group per other type with `footer: true` pages | 04 |
| `buildSwaConfig` | `swa.js`, export only | Output folder, data (`readData()` by default: `legacy` from 05, `site` and `embeds` from 09) | Writes and returns `staticwebapp.config.json` | 00, routes 05, headers 09 |
| `contactKey` | `contact.js` | `settings` | The key when it matches the Web3Forms UUID pattern exactly, else `''` (form hidden) | 08 |
| `enquiryTypes` | `contact.js` | `settings` | `enquiry_types` without empty entries, or `['General Enquiry']` | 08 |
| `contentSecurityPolicy` | `swa.js`, export only | `embeds` | The CSP string, `frame-src` from the embed hosts | 09 |
| `addNoopener` | `links.js`, export and the `noopener` transform (after `images`) | HTML | `noopener` added once to the `rel` of every `target="_blank"` link | 09 |
| `readData` | `data.js`, export only | | Every `site/data/*.yaml` as `{ name: parsed }`, with the `DATA` folder layered over it from spec 08 | 05, 08 |
| `pagesByType` | `menus.js` | `collections` | `[{ title, pages: [{ name, url }] }]`: every page type in weight order with all its pages, menu flags ignored. `menuItems` and `footerGroups` build on it | 05 |
| `buildAssets` | `assets.js`, export only | Output folder | `{ css, js }`, each `{ url, integrity }` | 02 |

Globals: `site`, `topics` and every other data file (`menus` until spec 04); `assets` (`assets.css.url`, `assets.css.integrity`, same for `js`); `build.year`; `topicPages`, `topicSections`. Collections: `blog`, `calendar`, `notices`, items only, oldest first. From spec 04: `pageTypes` (`page/*/_index.md`) and `pages` (`page/*/*.md`, no `_index.md`), in Eleventy's default order; `config/menus.js` sorts them.

The body is printed as `{{ content | safe }}`. Spec 06 (body images) and spec 09 (`noopener`) add their rewrites as filters or a transform in `config/`.

### Assets

| Path | What | Spec |
|---|---|---|
| `site/assets/css/*.css` | Concatenated in file name order, minified with clean-css, written to `/css/site.<hash>.css` with `integrity` | 02 |
| `site/assets/js/site.js` | The only script. Menu toggle (02), hiding expired events (03), contact subject (08). Minified with terser to `/js/site.<hash>.js` | 02 |
| `site/assets/images/` | Layout images through `picture`: map (02), hero (04). Written to `/images/{name}-{width}.<hash>.{ext}` | 02 |
| `.cache/images/` | Resized image cache, keyed on source bytes, width, format, quality and `fill`. Not committed. The `build` job restores it with `actions/cache`, key `images-<hash of package-lock.json and config/images.js>-<hash of uploads and layout images>` | 02, CI cache 06 |
| `site/static/` | Copied to the root: `favicon.ico`, `fonts/` | 02 |
| `site/static/uploads/` | Pages CMS media folder, published at `/uploads/`. Resized copies go to `/images/{slug}-{width}.<hash8>.{ext}`. `uploads/legacy/` holds the migrated legacy uploads (07) | 00, 06, 07 |

Asset names change only when the bytes do, so spec 09 can cache them `immutable`.

### Tests

| Name | What | Spec |
|---|---|---|
| `tests/serve.js <content dir> <port> [--uploads] [--data <dir>]` | Builds the site with `npx @11ty/eleventy` and `CONTENT=<content dir>` into a temp folder and serves it like Static Web Apps. `--uploads` (06) writes the fixture uploads to a temp folder and sets `UPLOADS`. `--data` (08) sets `DATA` | 03, 06, 08 |
| `tests/playwright.config.js` | One server per content set: `fixtures/content` on 1313 (with `--uploads` from 06, `--data fixtures/data/no-key` from 08), `fixtures/empty` on 1314, `fixtures/content` with `--data fixtures/data/with-key` on 1315 (08) | 03 |
| `tests/features/*.feature` | One feature per area: `menu`, `layout`, `notices`, `blog`, `calendar`, `feeds`, `editor` (Pages CMS config and the real content build). Later: `pages` (pages, contact, home, 04), `sitemap` (05), `images` (06), `contact` (08), `budgets` (09) | 03 |
| `tests/steps/*.js` | Shared steps. `fixtures.js` holds the `ui` world (current page, feed, config) | 03 |
| `tests/unit/*.test.mjs` | `node:test`: `dates`, `filters`, `images`, `topics`, `swa-config`, `workflow`, `roles`. Later: `content`, `menus` (04), `check-urls` (05), `embeds` (06), `migrate` (07), `contact` (08), `links` (09), `infra` (11) | 03 |
| Image fixtures | `tests/fixtures/uploads.mjs` `writeFixtureUploads(dir)` writes `fixture-wide.png` (1600 by 900), `fixture-huge.png` (6000 by 4000), `Fixture Space.PNG` (900 by 600), `fixture.gif`, `fixture.svg` with sharp. Nothing binary committed | 06 |
| `tests/fixtures/content/` | One fixture tree for every section | 00 onwards |
| `tests/fixtures/empty/` | Every section with no items, and the home page (04) | 00 onwards |
| `tests/fixtures/data/{no-key,with-key}/` | Fixture `settings.yaml` for `--data`. `KEYED_SITE` (`tests/steps/fixtures.js`) is the 1315 server built with `with-key` | 08 |
| `tests/fixtures/live/` | Trimmed snapshots of live pages for the migration tests | 07 |
| `scripts/check-urls.mjs` | Compares a built (`--built _site`) or deployed (`--base https://<host>`, routes from `--config`, default `_site/staticwebapp.config.json`) site with `tests/fixtures/live-urls.txt`. `--redirects-to <host>` with `--base` expects every path to 301 to the same path on that host (spec 11, `www`). Exports `loadList`, `matchRoute`, `checkBuilt`, `checkHost`, `main`. Run by hand, never in the workflow | 05 |
| `tests/fixtures/live-urls.txt` | Live sitemap paths plus the known variants, with the fetch date | 05 |
| `scripts/screenshots.mjs` | Side-by-side screenshots with Playwright. Hand-run | 02 |
| `scripts/compare-hugo.mjs` | Hugo against Eleventy, page by page. Used once for the switch. Removed in spec 12's repo tidy | Switch, removed 12 |
| `scripts/migrate.mjs` | Re-runnable migration from the live site, `--check` for a dry run. Writes `/uploads/legacy/{live path}`, `/uploads/content/...` and `/uploads/acny/...`, topics as `topics.yaml` slugs. Hand-run, never in the workflow | 07 |

### Site data

Values in `site/data/site.yaml`, read as `site.<key>` in templates and by `config/` modules.

| Key | What | Spec |
|---|---|---|
| `title` | `St Paul's Warton`. Page titles, brand, feeds, copyright | 02 |
| `url` | `https://stpaulswarton.co.uk`. Canonical links, feed and site map addresses, the contact form `redirect` | 05 |
| `hsts_max_age` | Seconds for `Strict-Transport-Security`. `300` until the old site is gone, then `31536000`. Exists only if spec 09's check finds our header replaces the platform's; otherwise it is removed and Static Web Apps' own header stays | 09, 12 |
