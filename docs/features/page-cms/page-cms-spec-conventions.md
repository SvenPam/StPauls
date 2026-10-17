---
date: 2026-10-17
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

- Hugo extended `0.167.0`, the same string everywhere. No npm, no `package.json`, no remote Hugo modules, no theme. Local `[[module.mounts]]` are fine.
- Hugo config has no `languageCode` (deprecated since 0.158, it trips `--panicOnWarning`).
- Templates use the 0.146+ layout: `site/layouts/baseof.html`, `site/layouts/_partials/`, `site/layouts/{section}/section.html`, `site/layouts/{section}/page.html`.
- Content bodies are HTML. Templates render them through `_partials/body.html` (spec 03), never `.Content`. `.Content` runs Goldmark, which turns indented HTML after a blank line into a code block.
- Internal links are written without a trailing slash, except `/`, through `_partials/href.html` (spec 02). Static Web Apps runs with `trailingSlash: "never"` from spec 05, so `/blog/article/x` is served directly and `/blog/article/x/` gets a 301.
- No inline `<script>` and no inline event handlers. Script lives in `site/assets/js/site.js`, fingerprinted and loaded with `defer`. Nothing needs script to read or navigate.
- Templates use no inline `style` attributes. Content bodies may contain them (legacy HTML and the rich text editor).
- Templates make no requests to other domains, except the two embeds (spec 06) and the contact form post (spec 08).

### Tests

- Python 3 standard library only, compatible with Python 3.12 (the CI runner). Run all with `python3 -m unittest discover -s tests -v` from the repo root.
- Tests never assert on `site/content/` or `site/data/settings.yaml`. Paul edits and deletes those, and a failing test would block his publish. Tests build `tests/fixtures/` instead. Two exceptions: `RealContentTests` builds the real content and asserts only that the build succeeds, and spec 04's `test_real_page_types_exist` checks the structural `page/{type}/_index.md` files, which are hidden from Pages CMS.
- Every spec adds or updates fixtures for what it builds, and keeps `test_no_personal_details_or_trackers` passing on every build it makes.
- `.pages.yml` is checked with plain text and regex, as in `tests/test_cms_config.py`. There is no guaranteed YAML library on the runner.

### Content and editor

- Any task that adds or renames a front matter key updates `.pages.yml` in the same task. From spec 03 Pages CMS keeps unknown keys (`settings.content.merge: true`), but every key is still declared, with `hidden: true` when Paul should not see it.
- Rich text fields use `format: html`. The trial notice was stored as Markdown because that is the default.
- Existing live URLs never change. A migrated item that cannot get its live URL from the permalink pattern carries a hidden `url` field.

### Privacy and security

- None of these anywhere in `site/`: the maintainer's name, `ste-pam.com`, LinkedIn, analytics, Disqus, social share links. `tests/helpers.py` `BANNED` enforces the list.
- No secrets in the repo. The Web3Forms access key is public by design and is not a secret.

### Azure and GitHub

- Static Web App `Microsoft.Web/staticSites@2025-03-01`, SKU `Free`, `location` default `westeurope`, name `swa-stpauls-web`.
- Azure sign in by OIDC only. Secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, variable `AZURE_RESOURCE_GROUP`. No client secret, no stored SWA token, no `environment:` on the job (it changes the OIDC subject away from `repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main`).
- The deploy workflow runs only on `main`. Changes reach the test URL only after the maintainer merges.

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
| Hugo and actionlint | `python3 -m venv <dir> && <dir>/bin/pip install hugo==0.167.0 actionlint-py`, then put `<dir>/bin` on `PATH` |
| Bicep 0.48.1 | Download `https://api.nuget.org/v3-flatcontainer/azure.bicep.commandline.linux-x64/0.48.1/azure.bicep.commandline.linux-x64.0.48.1.nupkg`, extract with `python3 -m zipfile -e <nupkg> <dir>`, `chmod +x <dir>/tools/bicep`, put `<dir>/tools` on `PATH` |
| Screenshots and browser checks | `<dir>/bin/pip install playwright` in the same venv. It finds Chromium in `/opt/pw-browsers`. Never run `playwright install`. Sandbox only, never in CI |

| Reachable from the sandbox (checked 2026-10-17) | Not reachable |
|---|---|
| Live site `http://stpaulswarton.co.uk` (bare domain, not `www`) | `az`, Azure portal, `learn.microsoft.com` |
| Test site `https://brave-coast-006318103.5.azurestaticapps.net` | `pagescms.org`, `app.pagescms.org` |
| GitHub release downloads, `git ls-remote` on public repos | `web3forms.com`, DNS-over-HTTPS resolvers (both work on full network access) |
| With full network access: `dns.google` (DNS over HTTPS), `rdap.nominet.uk` | Raw DNS (port 53, only `A` answers come back) and `whois` (port 43), whatever the network setting |
| `raw.githubusercontent.com`: docs sources in `MicrosoftDocs/azure-docs`, `pages-cms/website` (`docs/`), `gohugoio/hugo` (`docs/`), `surjithctly/web3forms-docs` | The GitHub web UI and API |

Say plainly in the hand-off what could not be run locally.

---

## Checked facts

Behaviour the specs rely on, checked on 2026-10-17. Re-check if a version changes.

### Azure Static Web Apps

| Fact | Consequence |
|---|---|
| File paths are case-sensitive (`/NOTICES/` is 404) | Mixed-case legacy links (`/Calendar`, `/Notices`, `/Contact`, `/Account/Login`) need explicit routes |
| Route matching case sensitivity is undocumented | Case variants use `rewrite`, never `redirect`, so a rule can never loop. A `redirect` is only used when its target cannot match its own route |
| Redirect targets cannot use wildcard captures. Wildcards only at the end of a route | Legacy upload paths get one generated route per file |
| `trailingSlash: "never"`: `/about` serves `/about/index.html` with 200, `/about/` gets a 301 to `/about` | Live URLs stay identical |
| `staticwebapp.config.json` is limited to 20 KB | Generated routes stay small. A test checks the size |
| `azurestaticapps.net` already sends `strict-transport-security: max-age=10886400; includeSubDomains; preload` and `cache-control: public, must-revalidate, max-age=30` on HTML | Spec 08 sets both explicitly |

### Hugo 0.167.0

| Fact |
|---|
| A front matter `url` without a trailing slash still publishes `{url}/index.html`. `.RelPermalink` ends with `/`, hence `href.html` |
| A `slug` containing `/` is kept as is, so `slug: 456/x` under `/calendar/event/:slugorcontentbasename/` gives `/calendar/event/456/x/` |
| `:sections[1:]` only sees a folder as a section when it has an `_index.md` |
| A taxonomy value may be a single string. Term permalinks can be set per taxonomy (`[permalinks.term]`) |
| A `markup = 'html'` cascade does not stop Goldmark parsing `.md` files. `.RawContent` passes the body through untouched |
| Mounting `static/uploads` to `assets/uploads` lets `resources.Get "uploads/x.jpg"` process files that are also published as is. Processed files are published next to them as `/uploads/x_hu_<hash>.webp` |
| `hugo --config <site.toml>,<extra.toml>` merges both. `[[module.mounts]]` entries targeting `data` in the extra file replace the default data mount. Mounting a fixture folder first and `site/data` second layers them: fixture files win, the rest come from `site/data` |

### Pages CMS (docs at `pages-cms/website`, `docs/configuration/`)

| Fact |
|---|
| By default (`settings.content.merge: false`) saving rewrites the file from the schema and removes unknown keys |
| Fields support `hidden`, `readonly`, `required`, `description`, `default` and `pattern` (string and text only) |
| `rich-text` takes `format: html` or `markdown` |
| `type: file` edits one data file. `type: group` with `items` groups entries in the sidebar |
| `select` takes `values` as strings or `{ name, label }`, optionally with `multiple` |
| `date` takes `time: true` and a date-fns `format`, for example `yyyy-MM-dd'T'HH:mm` |
| `operations` can turn off `create`, `rename` or `delete` per entry |
| `filename` tokens include `{year}`, `{month}`, `{day}`, `{primary}` and `{fields.<name>}` |

### Web3Forms (docs mirror `surjithctly/web3forms-docs`)

| Fact |
|---|
| `POST https://api.web3forms.com/submit`, `access_key` required, other field names are passed through to the email |
| `email` sets reply-to. `subject` and `from_name` set the email subject and sender name |
| `redirect` must be an absolute URL on the same domain on the free plan, and works only for a plain HTML form without script |
| `botcheck` is a hidden checkbox honeypot. Marked as less effective than a captcha |
| hCaptcha needs the `web3forms.com` client script. Not used, see spec 07 |

---

## Site contract

Names later specs rely on. **Spec** is where each name is introduced.

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
| `page/about/contact-us.md` | Contact page, `url: /contact`, `layout: contact` | `/contact` | 04, 08 |
| `contact-thanks.md` | Thanks page after the form, `url: /contact/thanks` | `/contact/thanks` | 08 |
| `sitemap.md` | HTML site map, `layout: sitemap` | `/sitemap` | 04 |

Page types: `about`, `services`, `groups`, `gallery`, `forms`, `links`, `community`, `safeguarding`.

New items from Pages CMS are named `{year}-{month}-{day}-{primary}.md` for blog, events and notices, and `{primary}.md` for pages.

### Front matter

| Key | Types | Pages CMS field | Notes |
|---|---|---|---|
| `title` | all | `string`, required | |
| `date` | article, notice | `date` | Publish date |
| `date` | event | `date`, `time: true` | Start, Europe/London |
| `end` | event | `date`, `time: true` | End |
| `summary` | all | `string` | Lists and meta description. Nothing shown when empty |
| `location` | event, notice | `string` | |
| `image`, `image_alt` | article, event, page | `image`, `string` | `/uploads/...` path |
| `blogtopics`, `eventtopics`, `noticetopics` | article, event, notice | `select`, single value | One of the four topic slugs |
| `header`, `footer` | page | `boolean` | Show in header menu, footer |
| `weight` | page, page type | `number` | Order within the menu group |
| `embed`, `embed_src` | page | `select`, `string` | Spec 06. `google-calendar` or `facebook-album` |
| `url` | article, event, notice, page | `string`, `hidden` | Migrated items only |
| `lead`, `hero_image`, `hero_alt` | home | `string`, `image`, `string` | |
| `layout` | contact, sitemap | `string`, `hidden` on page collections | |

### Taxonomies

| Front matter key | Term URL | Spec |
|---|---|---|
| `blogtopics` | `/blog/topic/{slug}` | 03 |
| `eventtopics` | `/calendar/topic/{slug}` | 03 |
| `noticetopics` | `/notices/topic/{slug}` | 03 |

Slugs and labels are in `site/data/topics.yaml`: `website` (Website), `church-services` (Church Services), `church-events` (Church Events), `other-events` (Other Events).

### Data files in `site/data/`

| File | Owner | Contents | Spec |
|---|---|---|---|
| `topics.yaml` | Maintainer | Topic slug to label | 03 |
| `embeds.yaml` | Maintainer | Embed type to allowed host, title and aspect ratio | 06 |
| `legacy.yaml` | Maintainer | `rewrites` and `redirects` lists of `{ from, to }` for `staticwebapp.config.json` | 05, 07 |
| `settings.yaml` | Paul, through Pages CMS | Contact form key and footer details | 08 |

### Partials in `site/layouts/_partials/`

| Partial | Takes | Returns | Spec |
|---|---|---|---|
| `href.html` | URL string | The URL without a trailing slash, except `/` | 02 |
| `menu-items.html` | site | Slice of `{ name, url, children }`, `children` a slice of `{ name, url }` | 02, rewritten 04 |
| `footer-groups.html` | site | Slice of `{ title, links }`, `links` a slice of `{ name, url }` | 02, rewritten 04 |
| `body.html` | page | Body HTML from `.RawContent`, images rewritten (06), `noopener` added (09), marked safe | 03 |
| `date.html` | `time.Time` | `02-Jan-06` | 03 |
| `event-status.html` | page | `Expired`, `Active`, `Soon` or `Future` | 03 |
| `picture.html` | dict `{ src, alt, sizes, eager, fill }` | `<picture>` for asset and `/uploads/` raster images, plain `<img>` otherwise | 02, `fill` 04, uploads 06 |
| `card.html` | page | `<article class="card">` for lists and term pages | 03 |
| `blog-aside.html` | site | Blog topics and the 7 latest articles | 03 |
| `embed.html` | page | Sandboxed responsive iframe, or nothing | 06 |

### Assets

| Path | What | Spec |
|---|---|---|
| `site/assets/css/*.css` | Concatenated in file name order into `css/site.css`, minified, fingerprinted | 02 |
| `site/assets/js/site.js` | The only script. Menu toggle (02), hiding expired events (03), contact subject (08) | 02 |
| `site/assets/images/` | Layout images: map (02), hero (04) | 02 |
| `site/static/uploads/` | Pages CMS media folder, also mounted as `assets/uploads` | 00, 05 |

### Tests

| Name | What | Spec |
|---|---|---|
| `helpers.build_site(dest, content_dir=None, *, data_dir=None, uploads_dir=None, minify=False, strict=True)` | Builds the site. `uploads_dir` is mounted as the uploads folder, `data_dir` is layered over `site/data` | 00, `uploads_dir` 06, `data_dir` 08 |
| `helpers.make_png(path, width, height)` | Writes a valid PNG with the standard library, so no binary fixtures are committed | 06 |
| `helpers.find_banned(out)` | Banned terms in a built site | 00 |
| `tests/fixtures/content/` | One fixture tree for every section | 00 onwards |
| `tests/fixtures/live/` | Trimmed snapshots of live pages for the migration tests | 07 |
| `scripts/check_urls.py` | Compares a built or deployed site with `tests/fixtures/live-urls.txt`. Run by hand, never in the workflow | 05 |
| `scripts/screenshots.py` | Side-by-side screenshots with Playwright. Sandbox only | 02 |
| `scripts/migrate.py` | Re-runnable migration from the live site | 07 |

### Hugo params

| Param | What | Spec |
|---|---|---|
| `hsts_max_age` | Seconds for `Strict-Transport-Security`. `300` until the old site is gone, then `31536000` | 09, 12 |
