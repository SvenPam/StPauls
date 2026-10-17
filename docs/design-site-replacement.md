---
date: 2026-10-17
tags: [design, stpauls, plan]
status: agreed
---

# Design: replace the live site

_The overall plan for replacing `stpaulswarton.co.uk` with the Hugo site and Pages CMS, now that the editor trial has passed. The per-session specs in [specs](specs/) are written from this document. Background: [current state](discovery-current-state.md), [way forward](discovery-way-forward.md)._

---

## Intent

The live site runs on a legacy ASP.NET MVC CMS on a paid App Service with a database. It is HTTP only, ships old jQuery and Bootstrap 3 scripts, and reads poorly on a phone. The maintainer is a volunteer who wants as little ongoing work as possible. Paul, the church contact, must be able to keep the site up to date on his own.

The editor trial (spec 00) proved that Pages CMS works: a notice was created, published and deleted through it on the test URL. The decision is **go** for the static site.

The work comes in two phases:

| Phase | What | Planned here |
|---|---|---|
| 1. Replace the live site | Every live feature and URL on the static site, readability fixes, optimised images, a modern secure foundation, Paul editing in Pages CMS, DNS cutover, legacy decommissioned | Yes |
| 2. Design options | A formal look at visual design with Paul, once he is settled in Pages CMS | No. Not planned until phase 1 is done |

---

## Goals

1. **Parity.** Every live section and feature that is kept works on the static site, and every live URL still resolves.
2. **Paul edits on his own.** Every section, plus site settings, is editable in Pages CMS. Paul is trained on the test URL before cutover.
3. **Same look, better reading.** Same colours and general layout. Better text spacing, a bigger labelled menu button, images and embeds that never break out of the column.
4. **Fast delivery.** Resized WebP images served with `<picture>` and `srcset`, small fingerprinted CSS, no script needed to read or navigate.
5. **Secure by default.** HTTPS everywhere, security headers, no third-party scripts beyond the two embeds, a hardened build pipeline.
6. **Low upkeep.** No server, database, npm or runtime to patch. The legacy Azure resources are removed at the end.

## Non-goals

- Visual redesign (phase 2).
- Site logins of any kind. Removed.
- Publish emails to subscribers. Dropped.
- Comments (Disqus) and analytics. Already removed.
- Fetching hot-linked images at build time.
- Preview or scheduled publishing in the editor. Pages CMS does not have them.

## Anti-goals

The project has failed, even if it technically works, if any of these happen:

| Anti-goal | Why it matters |
|---|---|
| Paul needs Git, Markdown, a terminal or the maintainer for a routine edit | The whole point of the static route |
| A live URL returns 404 after cutover | Facebook posts, search results and A Church Near You link into the site |
| The congregation would not recognise it as their site | Look changes wait for phase 2 |
| One of Paul's saves fails to publish because of a test | Tests must never assert on `site/content/` |
| The maintainer gains a recurring chore (dependency bumps, server patches, renewals) | Volunteer time |
| The maintainer's name, LinkedIn or personal site appears anywhere | Standing decision |
| Visitors see stale or missing content during cutover | The freeze is hours, not weeks |

---

## Decisions

Made by the maintainer in the design conversation on 2026-10-17, unless marked _builder's call_. These are in addition to the decisions in [CLAUDE.md](../CLAUDE.md) and the [way forward](discovery-way-forward.md).

| Topic | Decision |
|---|---|
| Trial | Go for the static site |
| Phasing | Migrate first and get Paul running in Pages CMS. Formal design options come later (phase 2) |
| Look | Keep the colours and the general layout: header, hero, cards, footer |
| Readability | Better text spacing (line height, line length, heading spacing). A bigger menu button with a label. Images never wider than the column |
| Styles and scripts | jQuery and the Bootstrap 3 scripts are removed. Bootstrap 3 CSS is replaced by one small stylesheet that reproduces the current look |
| Images | Hugo makes resized WebP copies and serves them with `<picture>`, `srcset`, lazy loading and fixed dimensions. Covers Paul's uploads |
| Images hot-linked today | Copied into the repo during migration (29 from `media.acny.uk`, 3 from `achurchnearyou.com`) and optimised like uploads |
| Images hot-linked in future | Always fit the column whatever their size. Fixed `width` and `height` attributes are overridden by CSS. Lazy loaded. _Builder's call:_ not fetched at build time, so a publish never depends on another site being up |
| Logins | Removed. Paul is added as a Pages CMS collaborator by the maintainer |
| Account URLs | _Builder's call:_ `/account/login`, `/account/register`, `/account/manage` redirect to the home page |
| Topic listings | Hugo taxonomy, same URLs as live (`/blog/topic/{topic}` and so on) |
| Publish emails | Dropped. The export found three or four old subscribers who may not be receiving anything. Hugo RSS feeds for blog, events and notices are added at no cost. A one-off note goes to those subscribers, then the export is deleted |
| Contact form | Kept, using Web3Forms (free, no server). One inbox for all enquiry types, with the type in the subject. The destination is a placeholder for now and is configurable without a code change |
| Cutover | DNS moves to Cloudflare early, still pointing at the old site. Paul practises on the test URL while the old site stays the real one. On cutover day: a short freeze, re-run the extraction, the maintainer reviews the diff, flip DNS in Cloudflare |
| Social share links | _Builder's call:_ not carried over, as in spec 00. Google+ is gone and the links add clutter. Easy to add back |
| Colour contrast | _Builder's call:_ keep the palette. Where a text and background pair fails WCAG AA contrast, darken that shade as little as needed and list each change in the spec |
| Look sign-off | _Builder's call:_ the maintainer compares side-by-side screenshots of live and new at phone and desktop widths before spec 02 is merged |
| Main domain | The bare domain `stpaulswarton.co.uk` is primary. A Cloudflare redirect rule sends `www.stpaulswarton.co.uk` to it with a 301, keeping the path and query. Only the bare domain is attached to the Static Web App |
| Cookie policy | Dropped if the site sets no cookies. The site itself sets none. Spec 09 has the maintainer check in a browser (the sandbox cannot reach the embed hosts) whether the Google Calendar or EmbedSocial embeds set any. If none, the page goes and `/page/about/cookie-policy` redirects to the privacy policy. If they do, spec 09 lists them and the maintainer decides between a short cookie note and loading those embeds only when clicked |
| Trial URLs | `/notices/{slug}/` from spec 00 is not kept. Nothing outside the trial links to it |
| Decommission | _Builder's call:_ legacy Azure resources are removed four weeks after cutover if nothing has needed them |
| Blog list | _Builder's call:_ shows summaries with a link rather than every full article, since pages now carry real images |
| Author names | _Builder's call:_ "by Paul Barfoot" lines are not migrated. There are no accounts, and it keeps personal details to a minimum |
| Notices menu | _Builder's call:_ not in the top menu, as on live. Reached from the home page and the footer |
| Spam protection | _Builder's call:_ honeypot only at first. hCaptcha needs a third-party script, so it is switched on only if spam arrives |
| HSTS | _Builder's call:_ five minutes from cutover so a rollback to the old HTTP-only site stays possible, then one year when the old site is removed |
| Event and notice dates | _Builder's call:_ the live site shows no year for events and no date for notices, so spec 07 asks the maintainer for a date export from the legacy database and flags anything inferred |

---

## What exists now

### On `main` (spec 00)

| | |
|---|---|
| Site | Hugo 0.167.0 extended, Notices section only at `/notices/{slug}/`, legacy `bootstrap.css` (134 KB) and `Site.css` copied as is |
| Editor | `.pages.yml` with a Notices collection, media at `site/static/uploads/` |
| Hosting | Azure Static Web App Free, `swa-stpauls-web`, deployed by `.github/workflows/deploy.yml` with OIDC |
| Tests | Python standard library, build `tests/fixtures/` only |

### On the live site (crawled 2026-10-17)

| | |
|---|---|
| URLs | 116 in `/sitemap.xml`: home, 7 articles, 69 events (none upcoming), 5 notices, 14 pages, 12 topic listings, section indexes, contact |
| Navigation | Top menu with dropdowns (About, Services, Groups, Community, Links, Gallery and so on). Bootstrap dropdowns need script today |
| Content images | 33 unique. 29 on `media.acny.uk`, 3 on `achurchnearyou.com`, the rest local. Article images carry fixed `width="1024"` |
| Uploads | Under `/Areas/st_pauls/Uploads/`: 2 PDFs and about 12 gallery images. Linked from content with absolute `http://` and `http://www.` URLs, mixed case, and one with a backslash |
| Embeds | Google Calendar iframe on `church-diary` (fixed 800 wide), EmbedSocial Facebook album iframe on `church-gallery` (fixed 900 wide) |
| Forms page | Links out to A Church Near You form pages |
| Contact form | Posts to `/Contact/Contact`. Believed not to deliver |
| Feeds | None |
| Policies | The cookie policy mentions Google Analytics, Disqus and accounts, none of which will exist. The privacy policy mentions registering, and stays because the contact form collects personal data |
| `www` | `www.stpaulswarton.co.uk` is used in links and by the maintainer, but did not resolve from the sandbox. Spec 01 records its current DNS |

---

## How it works (decided)

### Content model

| Type | Live URL | Fields beyond title, date and body |
|---|---|---|
| Page | `/page/{type}/{slug}` | type (one of the 8 live types), summary, image, show in header menu, show in footer, menu order |
| Blog article | `/blog/article/{slug}` | summary, image, topic |
| Event | `/calendar/event/{id}/{slug}` | start, end, location, topic, summary, image |
| Notice | `/notices/notice/{id}/{slug}` | summary, location, topic |
| Home | `/` | lead text, hero image |
| Site settings | (none) | contact form key, address, Facebook URL, and other footer details |

- Body is rich text stored as HTML, as in the trial.
- Topics are one shared taxonomy (`website`, `church-services`, `church-events`, `other-events`) with a listing per section.
- Existing items keep their live URL exactly. New items get a stable URL under the same section prefix without needing a hand-picked ID. The builder chooses the scheme.
- Events drop off listings once they end, and a nightly scheduled build keeps that current. Past events keep their pages and URLs.
- Event status (Expired, Active, Soon, Future) and the live date formats carry over. The 2019 port's `HH:MM` bug does not.
- Embeds (Google Calendar, EmbedSocial) are rendered by the template from a page field, not kept as raw iframe HTML in the body. This stops the rich text editor dropping them on save. They resize to fit the column.

### Images

| | |
|---|---|
| Source | One media folder, `/uploads/`, shared by migrated images and Paul's uploads, so he can reuse them from the media picker |
| Processing | Hugo image processing (extended, no npm). WebP at several widths capped at the original width, with the original format as fallback inside `<picture>` |
| Markup | `srcset` and `sizes`, `width` and `height` from the source image, `loading="lazy"` except the first image on the page |
| Body images | `<img src="/uploads/...">` inside the HTML body is rewritten to `<picture>` at build time |
| Other images | Anything not under `/uploads/` is left as is and made to fit by CSS |
| Alt text | An alt text field wherever Paul picks an image in a front matter field. Migrated images keep their live alt text |
| Legacy paths | `/Areas/st_pauls/Uploads/...` keeps working through redirects, whatever its case or slashes |

### Look and front end

- One stylesheet, built with Hugo Pipes (minified and fingerprinted). Bootstrap 3 CSS, glyphicons and the LESS sources are not carried over.
- The same palette (`#F3B200` gold, `#252525` charcoal, `#FDFDF7` page background and the rest of `Site.css`), the Century Gothic and Muli font stack, the hero, cards and footer layout.
- Readability: body text at least 16 px, line height around 1.6, line length capped for reading, consistent spacing around headings and paragraphs.
- Navigation works with no script. Any script is a few lines of plain JavaScript, written in the repo, never a library.
- Menu button: at least 44 by 44 px, with the word "Menu" next to the icon, `aria-expanded` kept in step.
- Accessibility target: WCAG 2.2 AA for the templates (contrast, visible focus, skip link, heading order, labelled form fields).

### Security

| Area | Baseline |
|---|---|
| Transport | HTTPS only once on the custom domain. HSTS at five minutes from cutover, so a rollback stays possible, raised to one year (no preload) when the old site is removed |
| Headers | Set in `staticwebapp.config.json`: Content Security Policy, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'` |
| CSP | Self by default. Frames limited to Google Calendar and EmbedSocial. Form posts limited to self and Web3Forms. Images allow any `https:` source so hot-linked images still show. No inline script |
| Third parties | Only the two embeds and Web3Forms. No analytics, fonts or scripts from other domains |
| Links | External links opened in a new tab get `rel="noopener"` |
| Pipeline | Actions pinned to full commit SHAs. Hugo download checked against its published checksum. Least-privilege workflow permissions as today. _Builder's call:_ Dependabot for GitHub Actions only, grouped, monthly |
| Editor | Pages CMS GitHub App installed on this repo only. Collaborators by email invite |
| Personal data | Subscriber export deleted once the one-off note is sent. No personal data in the repo |
| Legacy | Version-leaking headers, HTTP only and the old scripts go away when the old site is decommissioned |

### Delivery

| | Target |
|---|---|
| CSS | One file, minified, under about 25 KB |
| JavaScript | None needed to read or navigate. Our own script under about 2 KB if any |
| Images | WebP, sized to the layout, lazy loaded, dimensions set so nothing jumps |
| Caching | Fingerprinted assets cached for a year (`immutable`). HTML revalidated on each visit so a publish shows within minutes. Cloudflare respects these |
| Fonts | Self-hosted `woff2`, `font-display: swap` |

### Contact form

- Fields as live: Name, Enquiry type, Message, Email, Phone.
- Posts to Web3Forms with the access key from Site settings. Web3Forms sends to the inbox the key was created for, so changing the inbox means making a new key and pasting it into Settings in Pages CMS.
- Spam protection with a honeypot field, plus whatever Web3Forms offers on its free plan.
- _Builder's call:_ while the key is still the placeholder, the contact page shows the address and a link to the contact list in place of the form, so no message is ever lost.

### Testing

- Python standard library only, as today. Tests build `tests/fixtures/` and never assert on `site/content/`.
- A separate URL check script compares a built site, or the deployed site, with a snapshot of the live sitemap. It is run by hand during migration and cutover, not in the deploy workflow, so Paul deleting an old event never blocks a publish.

---

## Work outline

One spec per session, written with `writing-plans`, each built on a branch and merged to `main` when the maintainer says so. `main` deploys to the test URL until cutover. Shared rules and the names specs pass between each other are in [spec conventions](specs/conventions.md). The original item 03 (content types) was split in two (03 and 04) to keep each session a sensible size, so there are 12 specs. Each content spec adds its own Pages CMS fields, so the editor never strips a field the site relies on; spec 10 polishes them.

| # | Spec | Delivers | Maintainer and church steps |
|---|---|---|---|
| 01 | [DNS preparation](specs/01-dns-preparation.md) | How-to and message for the church to move the domain's DNS to Cloudflare, with records still pointing at the old site. Record of current DNS, including `www` | Find registrar access, create the Cloudflare zone, change nameservers |
| 02 | [Layout and stylesheet](specs/02-layout-and-stylesheet.md) | New shell: header with a labelled menu button and dropdowns that need no script, footer, cards, typography, contrast-checked tokens. Bootstrap 3 removed. Applied to Notices | Sign off side-by-side screenshots |
| 03 | [Blog, events and notices](specs/03-blog-events-notices.md) | The three dated sections at live URL patterns, topics, aside, event status, RSS, nightly build with a browser-side safeguard, Pages CMS collections | Check the collections in Pages CMS |
| 04 | [Pages, home and menus](specs/04-pages-home-and-menus.md) | Standing pages under `/page/{type}/{slug}`, home page with hero, contact placeholder, menus built from page settings, Pages CMS entries | Check the Pages group in Pages CMS |
| 05 | [URL parity](specs/05-url-parity.md) | No trailing slashes, generated Static Web Apps routes, legacy variants, `sitemap.xml`, HTML `/sitemap`, live URL snapshot and check script | Run the URL check after merge |
| 06 | [Images and embeds](specs/06-images-and-embeds.md) | Uploads as WebP `<picture>` in fields and bodies, safe fallbacks, embeds as validated page fields, image cache in CI | Try a large upload on a phone |
| 07 | [Content migration](specs/07-content-migration.md) | Re-runnable extraction from live, images and uploads copied in, links rewritten, upload routes, migration report | Export event and notice dates from the legacy database. Review the migrated content |
| 08 | [Contact form and site settings](specs/08-contact-form-and-settings.md) | Site settings file, footer from settings, Web3Forms form behind a key, thanks page | Create a Web3Forms key when the inbox is known |
| 09 | [Security and delivery hardening](specs/09-security-and-delivery.md) | Headers and CSP, cache rules, pinned actions, Hugo checksum, Dependabot, budget tests, cookie policy outcome | Check headers and embeds after merge. Check cookies in a browser |
| 10 | [Editor rollout](specs/10-editor-rollout.md) | Pages CMS labels and help text, round-trip check on migrated content, guide for Paul, policy wording suggestions | Round-trip saves, screenshots for the guide, invite Paul, practice, church agrees policy wording |
| 11 | [Cutover](specs/11-cutover.md) | Bare domain on the Static Web App in Bicep, cutover runbook (freeze, re-extract, diff review, DNS flip, URL check, rollback), practice content clean-up | Validate the domain a week ahead, Cloudflare settings, run the day with Paul |
| 12 | [Handover and decommission](specs/12-handover-and-decommission.md) | HSTS to a year, maintainer runbook, church handover, subscriber note, CLAUDE.md updated | Send the note, delete the export, remove legacy resources |

Spec 01 is first because finding the registrar login is the slowest step and it changes nothing visitors see. The rest is in build order: layout before content, URLs before migration, images before migration so migrated images land in the right place, the form and settings before hardening, hardening once the embeds and form are known, and the editor rollout last so Paul practises on the finished site.

---

## Risks

| Risk | Mitigation |
|---|---|
| The rich text editor changes migrated HTML when Paul saves | Embeds moved out of the body. In spec 10, open and save one item of each type in Pages CMS and check the diff before Paul starts |
| Practice edits on the test URL are mistaken for real ones | The user guide says practice content is thrown away. Re-extraction on cutover day overwrites migrated items. The cutover runbook lists and removes anything else |
| GitHub pauses the nightly schedule after 60 days without repo activity (public repos) | Spec 03 also hides expired events in the browser, so the calendar stays right without a rebuild |
| The live site shows no year for events and no date for notices | Spec 07 takes dates from a legacy database export, and infers and flags any it cannot find |
| Church DNS access takes weeks | Spec 01 starts it before the build |
| Pages CMS hosted service goes away | Content is plain files in Git. Swap the editor without changing content |
| Web3Forms changes its free plan | The form is one template and one settings field. Swap provider without touching content |
| `www` links break at cutover | The Cloudflare redirect rule is in place before the DNS flip, and the URL check runs against both hosts |

---

## Left to the builder

- Exact CSS, breakpoints and spacing values within the targets above.
- Image widths and quality settings.
- The URL scheme for new items, as long as existing URLs are untouched and no manual ID is needed.
- File and folder layout in `site/`, shortcodes versus fields for embeds, how body images are rewritten.
- How redirects are expressed (SWA routes, generated files or both).
- The order of tasks within each spec.
