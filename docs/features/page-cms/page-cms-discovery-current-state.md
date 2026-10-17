---
date: 2026-10-17
tags: [reference, stpauls, discovery]
status: stable
---

# Discovery: current state

_The current state of `stpaulswarton.co.uk` and of the 2019 Umbraco port, as of 2026-10-17._

> [!note]
> The Umbraco port described here is archived on the `archive/umbraco-2019` branch. Paths such as `StPauls.Web/...` refer to that branch.

---

## Summary

| | |
|---|---|
| Live site | `http://stpaulswarton.co.uk` (HTTP only) |
| Live platform | Legacy custom ASP.NET MVC 5.2 CMS, multi-tenant (`/Areas/St_Pauls/`). Source in ADO/TFS, not in this repo |
| Live editing | Church contact edits content through the legacy CMS back office |
| Live hosting | Azure App Service (IIS 10, `ARRAffinity` cookie), with a database |
| This repo | Unfinished port to Umbraco 8.1.0 on .NET Framework 4.7.2 |
| Port deployed | No. `/umbraco` returns 404 on the live site |
| Port history | 32 commits, all 13 to 14 July 2019, single author |
| Content in repo | None. Document types, data types and grid layouts lived in a 2019 local test database that is not committed |
| DNS | Controlled by the church. Finding someone with access takes time |

---

## Live site

Facts gathered from the public site and its `/sitemap.xml` (116 URLs).

### Sections and URL scheme

| Section | URL pattern | Count in sitemap |
|---|---|---|
| Home | `/` | 1 |
| Blog | `/blog`, `/blog/article/{slug}`, `/blog/topic/{topic}` | 1 index, 7 articles, 4 topics |
| Calendar | `/calendar`, `/calendar/event/{id}/{slug}`, `/calendar/topic/{topic}` | 1 index, 69 events, 4 topics |
| Notices | `/notices`, `/notices/notice/{id}/{slug}`, `/notices/topic/{topic}` | 1 index, 5 notices, 4 topics |
| Pages | `/page/{type}/{slug}` | 13 |
| Contact | `/contact` | 1 |
| Accounts | `/account/login`, `/account/register`, `/account/manage` | 3 |
| Site map | `/sitemap` (HTML), `/sitemap.xml` | |

Topics shared across blog, calendar and notices: `website`, `church-services`, `church-events`, `other-events`.

### Pages (`/page/{type}/{slug}`)

| Type | Pages |
|---|---|
| about | about-us, contact-list, church-diary, privacy-policy, cookie-policy |
| services | regular-church-services, easter-services-2026 |
| groups | church-groups |
| gallery | church-gallery, website-pictures |
| forms | st-pauls-forms |
| links | useful-links |
| community | community-news |
| safeguarding | safeguarding |

### Content observations

- Newest blog article published 02-Mar-22. Oldest 08-Nov-15.
- `/calendar` currently shows "Could not find any events."
- Easter Services 2026 page exists, so content is still being edited.
- Home page shows hero, Church Notices list and Latest Blog Articles (3).

### Features on the live site

Usage as reported by the site maintainer. The contact form is believed not to be connected to an email service (unverified). All other features are reported in use.

| Feature | Detail |
|---|---|
| Contact form | Posts to `/Contact/Contact`. Fields: Name, Enquiry Type, Message, Email, Phone. Enquiry types: General Enquiry, Website Enquiry, Weddings and Baptisms, MU, WI. Likely not delivering email |
| User accounts | Login, register, manage. Used for contributors and email subscriptions |
| Email notifications | Emails sent when content is published (see legacy `Views/Email`) |
| Comments | Disqus, shortname `stpaulswarton` |
| Social share | Facebook, Twitter, Google+, LinkedIn links |
| Embeds | Google Calendar iframe (`church-diary`), EmbedSocial Facebook album (`church-gallery`) |
| Uploaded files | `/Areas/st_pauls/Uploads/` (e.g. `baptism-form.pdf`, `latest-news-sheet.pdf`, `Gallery/*`) |
| External images | `media.acny.uk` (A Church Near You) |
| Analytics | Google Analytics `UA-68397826-1` (Universal Analytics) |
| Footer | Map image, address, Facebook link, "Site by Stephen Pammenter" with LinkedIn badge |

---

## Repository layout

```
StPauls.sln
StPauls.Web/
├── App_Plugins/ModelsBuilder/   Umbraco ModelsBuilder dashboard
├── Content/                     Bootstrap 3 LESS/CSS, Site.less, images
├── Controllers/                 SiteMapController.cs (only custom controller)
├── Media/                       Web.config only, no media committed
├── Models/                      ModelsBuilder generated models + 2 partials
├── Umbraco/                     Umbraco 8 back office files (committed, ~1,800 files)
├── Views/                       Razor templates, partials, macro partials
├── config/                      Umbraco config (grid editors, settings, etc.)
├── fonts/                       Glyphicons, Muli
├── Web.config                   Umbraco 8.1.0 web.config
└── packages.config              NuGet packages (packages folder not committed)
```

Not committed (`.gitignore`): `App_Data/`, `config/connectionString.config`, `*.sdf`, `bin/`, `obj/`. `connectionString.config` is referenced by the `.csproj` and `Web.config` but absent.

No CI pipeline, deployment config, tests or uSync files exist.

---

## Platform and dependencies

| | |
|---|---|
| Umbraco | `UmbracoCms` 8.1.0 |
| ModelsBuilder | 8.1.0, `ModelsMode` = `Nothing`, models committed to `Models/` |
| Framework | .NET Framework 4.7.2, ASP.NET MVC 5.2.7 |
| Database driver | `Umbraco.SqlServerCE` 4.0.0.1 referenced. Actual DB provider unknown (connection string not committed) |
| Sitemap | `xsitemap` 2.0.6 |
| Image processing | ImageProcessor.Web 4.10 |
| Front end | Bootstrap 3 (LESS), no JavaScript bundled in the Umbraco layout |
| `UseHttps` | `false` |
| Umbraco 8 support | Ended 24 February 2025 |

---

## Document types

Derived from `Models/*.generated.cs`. Document type definitions themselves are only in the database.

| Alias | Inherits | Properties | Template |
|---|---|---|---|
| `base` (composition) | | `description` (string), `image` (image cropper) | |
| `home` | base | `pageLead` (string), `homePageHeroImage` (image cropper), `content` (grid) | `home.cshtml` |
| `page` | base | `titleOverrides`, `content` (grid), `includeComments`, `includeSocial`, `showInHeader`, `showInFooter` | `page.cshtml` |
| `blogArticle` | page | `topic` (string) | `article.cshtml` |
| `event` | page | `startDate`, `endDate`, `location`, `topic` | `event.cshtml` |
| `notice` | base | `bulletinBody`, `location`, `includeComments`, `includeSocial` | `notice.cshtml` |
| `hub` | base (composition) | | |
| `blog` | hub | | `blog.cshtml` |
| `calendar` | hub | | `calendar.cshtml` |
| `notices` | hub | | `notices.cshtml` |

Media and member types are Umbraco defaults (`Image`, `File`, `Folder`, `Member`).

Custom model logic:

- `Models/Page.cs`: `Title` (override or name), `FormattedDate` ("Today at", day name within 6 days, else `dd-MMM-yy`).
- `Models/Event.cs`: `Status` (`Expired`, `Active`, `Soon` within 7 days, `Future`) and a Bootstrap colour class per status.

---

## Views

### Wired to Umbraco

| View | Purpose |
|---|---|
| `masterLayout.cshtml` | Shell: navbar from home's children, footer, GA script |
| `layout.cshtml` | Boxed container layout |
| `layoutWide.cshtml` | Full-width layout |
| `home.cshtml` | Hero jumbotron + grid |
| `page.cshtml` | Title + grid + optional Disqus |
| `blog.cshtml` | Lists child `blogArticle`s with full grid body, aside |
| `article.cshtml` | Article with schema.org markup, share, Disqus, aside |
| `calendar.cshtml` | Cards for non-expired child `event`s |
| `event.cshtml` | Event detail with countdown/status, dates, grid, Disqus |
| `notices.cshtml` | Cards for published `notice`s |
| `notice.cshtml` | Notice detail, share, Disqus |
| `siteMap.cshtml` | HTML site map, used by `SitemapController` |
| `Partials/_Aside.cshtml` | "Latest" 7 blog articles |
| `Partials/_Links.cshtml` | Footer: map, address, Facebook |
| `Partials/_SocialSharer.cshtml` | Share links |
| `Partials/Grid/*` | Umbraco Bootstrap 3 grid renderer |
| `MacroPartials/_LatestArticles.cshtml` | 3 newest articles with "Hero - S" crop |
| `MacroPartials/_LatestEvents.cshtml` | Up to 20 non-expired events grouped by month |
| `MacroPartials/_LatestNotices.cshtml` | All notices, newest first |

Grid editors (`config/grid.editors.config.js`): rich text, image, macro, embed, headline, quote.

### Carried over from the legacy CMS, not wired

These reference types and helpers that do not exist in this repo (`sites.*`, `Sites.CurrentSite`, `Url.ActionDomain`, `ContactForm`, `~/Areas/St_Pauls/...`). No controllers exist for them.

- `Views/Contact/Index.cshtml`, `Enquiries.cshtml`, `ReportProblem.cshtml`, `Thanks.cshtml`
- `Views/Email/Index.cshtml`, `Views/Shared/_EmailLayout.cshtml`
- `Views/Error/Index.cshtml`, `Views/Error/NotFound.cshtml`, `Views/Shared/Error.cshtml`
- `Views/Shared/_LayoutWide.cshtml`

### Controller

`Controllers/SiteMapController.cs` (namespace `Tranquility.Controllers`). Route hijack for a `sitemap` document type. With an `xml` query value it returns an XML sitemap of all visible content; otherwise renders `siteMap.cshtml`.

---

## Gap between live and port

| Live feature | State in port |
|---|---|
| Blog, calendar, notices, pages | Document types and templates exist |
| Topic listings (`/*/topic/{topic}`) | Not present. `topic` is a free-text string |
| Contact form + enquiry routing | Not present (legacy views only) |
| User accounts and email notifications | Not present |
| Report a problem form | Not present (legacy view only) |
| Error and 404 pages | `error404` set to node id `1` in `umbracoSettings.config`. No Umbraco template |
| Uploaded PDFs and gallery images | Not migrated. `Media/` is empty |
| Content (articles, events, notices, pages) | Not migrated. Source of truth is the live site; content is mostly HTML blocks |
| URL scheme | Port URLs come from the content tree, so differ from live (`/page/{type}/{slug}`, `/{section}/{kind}/{id}/{slug}`) |
| HTTPS | Neither |

---

## Known defects in the port

| Location | Defect |
|---|---|
| `masterLayout.cshtml` | Navbar brand reads "Site Name" |
| `masterLayout.cshtml` | `og:image` points at legacy `/Areas/St_Pauls/...` path |
| `masterLayout.cshtml` | No jQuery/Bootstrap JS loaded, so the mobile navbar toggle does nothing |
| `page.cshtml` | `IncludeSocial` block is empty; stray `;` after `GetGridHtml` renders on page |
| `event.cshtml` | Partial path typo `~/Views/Parials/_SocialSharer.cshtml` |
| `_LatestNotices.cshtml` | Link `href="/notices)"` |
| `_Aside.cshtml` | "Latest" sorted oldest first |
| `Page.cs` | `FormattedDate` uses `HH:MM` (month, not minutes) |
| `SiteMapController.cs` | Adds nested descendants repeatedly, producing duplicate entries |

---

## Personal and third-party details in source

| Item | Location |
|---|---|
| "Site by Stephen Pammenter", `ste-pam.com`, LinkedIn profile | `masterLayout.cshtml` (also on live site) |
| reCAPTCHA public and private keys (commented out) | `Views/Contact/Index.cshtml` |
| Google Analytics `UA-68397826-1` | `masterLayout.cshtml` |
| Disqus shortname `stpaulswarton` | `page`, `article`, `event`, `notice` views |
| Old hosting URL `smarterasp.net` | `Views/Contact/ReportProblem.cshtml` (comment) |

---

## Assets

| Path | Notes |
|---|---|
| `Content/Image/PAGE-BACK.JPG` | Home hero background |
| `Content/Image/map.png` | Footer map |
| `Content/Image/social-sprites.png`, `ico-share.png` | Social icons |
| `Content/Image/site-beta.png` | Unreferenced |
| `Content/Image/generic/1.jpg` to `9.jpg` | ~26 MB, unreferenced by port views. `7.jpg` and `9.jpg` are identical. Live home uses `generic/2.jpg` |
| `fonts/muli.woff2` | Site font |

---

## Content migration source

| | |
|---|---|
| Source | Live site pages (HTML), extracted manually |
| Volume | Small: 7 articles, 69 events, 5 notices, 13 pages, plus uploads under `/Areas/st_pauls/Uploads/` |
| Shape | Mostly HTML blocks per item |
| Content types | Pages, events, notices, news (blog articles) |
| 2019 Umbraco database | Local test only. Not available as a source |

---

## Constraints and preferences

Stated by the site maintainer, for discovery.

| | |
|---|---|
| Maintainer time | Volunteer, minimal ongoing involvement wanted |
| Editor | Church contact must be able to edit content without the maintainer |
| Hosting cost | Removing the App Service plan, database and storage account is preferred |
| Contact form | Working email delivery is a nice to have |
| DNS | Preference to move the zone to Cloudflare ahead of cutover. Church-side changes go in a handover user guide |
