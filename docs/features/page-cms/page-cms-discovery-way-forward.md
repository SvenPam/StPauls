---
date: 2026-10-17
tags: [discovery, stpauls, decision]
status: agreed
---

# Discovery: way forward for stpaulswarton.co.uk

_Compares finishing the move to Umbraco with replacing the site with a static site, and recommends one. Facts about the current state are in [current state](page-cms-discovery-current-state.md)._

---

## Recommendation

**Go static.** Hugo site in this repo, content as Markdown with front matter, edited by Paul through Pages CMS, built by GitHub Actions and deployed to Azure Static Web Apps (Free). DNS on Cloudflare.

Prove the editor with Paul first (step 0 below). If he can't get on with it, fall back to a fresh Umbraco 17 build using the live site as the source of truth.

The rest of this doc explains why. Decisions needed from you are at the end.

---

## How an editor publishes (static)

Editors never see Git, Markdown, Hugo or npm.

1. Paul receives an email invite to Pages CMS. No GitHub account needed.
2. He signs in at `app.pagescms.org` in any browser.
3. He picks Notices, Events, Blog or Pages, then fills in a form: title, date, location, rich-text body, image upload.
4. He clicks Save. Pages CMS commits the change to GitHub on his behalf.
5. GitHub Actions builds the site with Hugo (a single binary, no npm) and deploys it. The change is live in a minute or two.

| | Umbraco back office | Pages CMS |
|---|---|---|
| Sign in | Username and password on the site | Email invite to a hosted web app |
| Editing | Rich text, media picker, tree of pages | Rich text, media upload, list per section |
| Preview before publish | Yes | No. Save is publish |
| Scheduled publish | Yes | No. Events still drop off automatically |
| Time to go live | Instant | 1 to 2 minutes |
| Installable app | No | No, browser only |
| Who runs it | You (App Service, DB) | Pages CMS project (free hosted service) |

---

## What has to be replaced

Every live feature, and how each option covers it.

| Live feature | Umbraco 17 | Static |
|---|---|---|
| Pages, blog, events, notices | Document types + templates | Markdown files per section |
| Topic listings | Custom code or tags | Hugo taxonomy (built in) |
| "Upcoming" events | Query at request time | Filter at build time + nightly scheduled rebuild |
| Editing by Paul | Umbraco back office | Pages CMS (web UI, commits to GitHub) |
| Contributor accounts | Umbraco users | GitHub accounts |
| Subscriber accounts + publish emails | Members + custom notification code + email provider | RSS feeds + RSS-to-email service (subscribers sign up there) |
| Contact form | Custom form + SMTP provider | Form service (e.g. Web3Forms) or SWA managed function |
| Comments (Disqus) | Removed | Removed |
| Embeds, uploads (PDFs, gallery) | Media library | Files in repo |
| HTTPS | Paid App Service tier or Cloudflare proxy | Free certificate included |
| Existing URLs | Custom URL provider or redirects | Set per item in front matter, kept identical |

---

## Option A: finish on Umbraco

The 2019 port is Umbraco 8.1 on .NET Framework. Current LTS is **Umbraco 17** (.NET 10, supported to 27 Nov 2028). Between 8 and 17 the back office was rewritten, the Grid editor and macros were removed, and the runtime moved to modern .NET. No content exists in the 2019 database, so there is nothing to upgrade. In practice this is a fresh Umbraco 17 build that reuses the CSS and some markup.

| | |
|---|---|
| Build effort | High. New project, document types, Block Grid, templates, member registration, notification emails, contact form, URL mapping |
| Hosting | App Service (paid tier for custom domain), database (Azure SQL, or SQLite with mixed reports on Azure), storage for media |
| Ongoing | Security patches, major upgrade before Nov 2028, database and backups |
| Editor experience | Best of the two. Familiar WYSIWYG back office, previews, scheduling |
| Fits your constraints | No. Keeps the service plan and database you want to drop, and keeps you on the hook for upgrades |

## Option B: static site

| | |
|---|---|
| Build effort | Medium. Templates from the existing Bootstrap 3 markup, content moved by hand, CI pipeline, CMS config |
| Hosting | Azure Static Web Apps Free: custom domain, free SSL, 250 MB app size limit, no SLA |
| Ongoing | Close to none. No server, no database, no runtime to patch. Hugo pinned to one version in CI |
| Editor experience | Good enough. Form-based editor with rich text, image upload. A publish takes a minute or two to appear |
| Fits your constraints | Yes. Removes App Service, database and storage account |

### Proposed stack

| Concern | Choice | Fallback |
|---|---|---|
| Generator | **Hugo**: single binary, no `node_modules` to rot, built-in taxonomies, RSS, sections | Eleventy |
| Editor | **Pages CMS** (hosted, free, editors invited by email with no GitHub account, rich-text field stores HTML, which matches the existing HTML blocks) | Sveltia CMS at `/admin` (needs a GitHub account), TinaCMS Cloud (free for 2 users) |
| Build and deploy | GitHub Actions on push to `main`, plus a nightly scheduled build so past events drop off | |
| Infrastructure | Bicep, deployed by GitHub Actions with OIDC sign in to Azure (no stored deployment token) | |
| Hosting | **Azure Static Web Apps Free** | |
| Editor hosting | Hosted Pages CMS (`app.pagescms.org`). Nothing to run in Azure. Its PostgreSQL database is only needed when self-hosting | Self-host Pages CMS (needs PostgreSQL) |
| DNS | Cloudflare, zone moved ahead of cutover | |
| Contact form | **Web3Forms** (free, about 250 submissions a month, email only) | SWA managed function + email provider |
| Publish emails | **RSS-to-email** from the blog, events and notices feeds (Buttondown free to 100 subscribers), only if the export finds subscribers | Drop |
| Comments | Removed | |
| Analytics | Google Analytics (Universal Analytics) removed. Cloudflare Web Analytics optional later | None |

### What changes for people

| Who | Before | After |
|---|---|---|
| Paul | Legacy back office | Pages CMS in a browser, invited by email |
| Subscribers | Site account, emails on publish | Email signup with the RSS-to-email service. Existing list exported and imported |
| Visitors | HTTP, same URLs | HTTPS, same URLs |
| You | Host App Service, DB, storage, legacy code | Own the repo and the free SWA resource |

### Risks

| Risk | Mitigation |
|---|---|
| Paul finds Pages CMS confusing | Step 0 trial before building anything else. User guide with screenshots |
| Pages CMS hosted service goes away | Content is plain files in Git. Swap editor with no content change. Email collaborators are stored in Pages CMS, so re-invite |
| Event listings go stale between builds | Nightly scheduled build |
| Subscriber migration and consent | Export list from legacy DB, import to email service with a note in the first email |

---

## Work outline (static)

Sized for single sessions. Specs live in [this folder](./).

> [!note]
> Superseded after the trial by the work outline in [design: replace the live site](page-cms-feature.md). Kept here as the original pencil sketch.

- **Repo reset (done).** Umbraco code archived on `archive/umbraco-2019`. `main` started from nothing.
0. **Editor trial.** Hugo scaffold, Bicep for the Static Web App, GitHub Actions build and deploy, Notices only, Pages CMS. Invite Paul by email, ask him to add a notice. Go or no-go for static.
2. **Layout and theme.** Port master layout, header, footer, Bootstrap 3 CSS. Remove personal details.
3. **Content types.** Pages, blog, events, notices, topics, home page. Templates and front matter schema.
4. **URL parity.** Keep every live URL from the sitemap. `sitemap.xml`, 404 page.
5. **Content migration.** Scripted extraction from the live site into Markdown, reviewed by you. Uploads and images.
6. **Style modernisation.** Replace Bootstrap 3 and the legacy LESS with modern, lightweight CSS. Same look and feel, refreshed.
7. **Editor.** Pages CMS config for all sections, editor invites.
8. **Contact form and publish emails.** Form service, RSS feeds, email service, subscriber import.
9. **DNS and cutover.** Cloudflare zone, SWA custom domain in Bicep, HTTPS, switch.
10. **Handover.** User guide for Paul, church-side DNS steps, decommission legacy Azure resources.

---

## Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Static trial or straight to Umbraco 17 | Trial static first (step 0) |
| 2 | Who judges the trial | Site maintainer |
| 3 | Email subscribers | Maintainer exports from legacy DB. Likely none. If none, publish emails are dropped |
| 4 | Disqus comments | Remove |
| 5 | Hosting | Azure Static Web Apps (Free). Cloudflare Free for DNS and caching only |
| 6 | Editor trial result | **Go** (2026-10-17). A notice was created, published and deleted through Pages CMS on the test URL. Phase 1 plan in [design: replace the live site](page-cms-feature.md) |
| 7 | DNS move to Cloudflare | **In progress** (2026-10-17). DNS only, still pointing at the old site. Steps and records in [how to move DNS to Cloudflare](page-cms-how-to-move-dns-to-cloudflare.md) |

---

## Sources

- [Umbraco long term support and end of life](https://umbraco.com/products/knowledge-center/long-term-support-and-end-of-life)
- [Umbraco 17](https://umbraco.com/products/umbraco-cms/umbraco-17/)
- [Umbraco forum: Grid Layout and Nested Content removed by v17](https://forum.umbraco.com/t/umbraco-upgrade-from-u13-to-u17/8166)
- [Umbraco forum: SQLite on Azure App Service](https://our.umbraco.com/forum/using-umbraco-and-getting-started/110695-deploying-umbraco-10-to-azure-web-app)
- [Azure Static Web Apps plans](https://learn.microsoft.com/en-us/azure/static-web-apps/plans)
- [Azure Static Web Apps pricing](https://azure.microsoft.com/en-gb/pricing/details/app-service/static/)
- [Pages CMS docs](https://pagescms.org/docs/)
- [Pages CMS collaborators](https://pagescms.org/docs/configuration/collaborators/)
- [Sveltia CMS](https://github.com/sveltia/sveltia-cms)
- [TinaCMS review (third party)](https://bejamas.io/hub/headless-cms/tina)
- [Web3Forms vs Formspree (third party)](https://splitforms.com/blog/formspree-vs-web3forms)
- [RSS to email services 2026 (third party)](https://www.readless.app/blog/rss-to-email-services-2026)
