---
date: 2026-10-18
tags: [discovery, stpauls, parity]
status: draft
---

# Discovery: live source code against the Eleventy site

_What the code running on `stpaulswarton.co.uk` actually does, compared with what [the plan](../page-cms/page-cms-feature.md) and specs 00 to 08 built. Written from a one-off read of the live ASP.NET MVC source (ignored copy under `data/st-pauls/`) so the parity plan can be written without reading that source again. Facts here are the live rules, written out in full._

## How to read this

Every finding has an ID so the plan can refer to it. Each sits in one category:

| Category | Meaning | Plan action |
|---|---|---|
| **A. At parity** | New site matches live | Add a check if none exists |
| **B. Gap** | Live behaviour the new site lacks | Decide: build, or drop and record why |
| **C. Drift** | New site follows the 2019 Umbraco port or a guess, and live differs | Decide which rule wins, then fix or record |
| **D. URL gap** | A live URL that answers 200 but is not in `/sitemap.xml`, so the URL check never sees it | Redirect or build, add to the URL check |
| **E. Dropped on purpose** | Already decided not to carry | Confirm nothing else depended on it |
| **F. Not St Paul's** | The live app hosts other sites; their routes answer on this domain too | Let them 404. No action |
| **G. Editor** | Something a live admin could do that Paul cannot in Pages CMS | Decide whether Paul needs it |
| **H. Data** | Facts for the deferred content match (spec 07) | Feed into the SQL export |
| **S. Security** | Risks on the live site or in the local copy | Act before or at decommission |

Where a live rule has an obvious bug, it is marked _bug_ and is not a parity target unless the plan says so.

## Background facts about the live app

- One ASP.NET MVC 5 app (.NET 4.5.1, Entity Framework 6, SQL Server) serves several sites. The site is chosen per request from the host name, with `www.` stripped. St Paul's code is the `st_pauls` area. Shared controllers and models serve every site.
- All times use UK time (`GMT Standard Time`, so BST-aware) at request time. Statuses and countdowns are worked out on every page view, not at publish.
- Routing is case-insensitive and accepts a trailing slash. Conventional routes `/{controller}/{action}/{id}` also work, so `/Calendar/Index`, `/Home/Index` and similar answer.
- Slugs come from `FriendlyURL()`: lower case, keeps `a-z` and `0-9`, turns space `,` `.` `/` `\` `-` `_` `=` into a single `-`, drops everything else (so `St Paul's` becomes `st-pauls`), maps accented letters to ASCII, stops after about 80 characters, trims a trailing `-`.
- Article slugs are stored once at creation, with `-1`, `-2` added on a clash. Event, notice, page, topic and page type slugs are worked out from the current title on every request, so renaming one on live changed its URL.
- Events and notices are found by numeric ID. The slug in their URL is optional and ignored.

## A. At parity

| ID | Area | Live | New site |
|---|---|---|---|
| A-01 | Item URLs | `/blog/article/{slug}`, `/calendar/event/{id}/{slug}`, `/notices/notice/{id}/{slug}`, `/page/{type}/{slug}` | Same patterns |
| A-02 | Topic URLs | `/{blog,calendar,notices}/topic/{slug}` for the four topics | Same |
| A-03 | Account URLs | `/account/*` (login, register, manage, forgot and reset password, external login, unsub, delete) | Redirect home |
| A-04 | Upload paths | `/Areas/st_pauls/Uploads/...` | 301 to `/uploads/legacy/...` |
| A-05 | Footer find-us | Map image linked to the Google Maps place, address linked to directions, Facebook link | Same, from Site settings |
| A-06 | 404 text | "Page Not Found", "We're sorry but we couldn't find that page", the two reasons, "Try one of the links in the header or footer" | Same text, plus a home link. Live also loaded a dead Google "fix URL" script |
| A-07 | Contact fields | Name (required, max 100), Enquiry type, Message (required), Email (required), Phone (optional, validated as a phone number) | Same fields. Name has no max length |
| A-08 | Enquiry types | One per "group": the live list matches `enquiry_types` in settings | Same list |
| A-09 | Blog aside | "Blog Topics" (all topics) and "Latest" (7 newest) on blog index, topic and article pages, hidden on phones and in print | Same lists. Check phone and print behaviour |
| A-10 | Header base items | Site name links home. Home, Blog, Calendar. Notices not in the menu | Same |
| A-11 | Favicon, Muli | `favicon.ico`, Muli 400 `woff2` self-hosted | Same files |

## B. Gaps

### Home page

| ID | Live | New site |
|---|---|---|
| B-01 | "Upcoming Events" column beside notices: events not yet expired, soonest first, first 20, grouped under month name (no year). Each line: day of month in bold, title, a "Soon" or "Active" label when that applies. Heading links to `/calendar`. Only shown when there is at least one | No events on the home page. The crawl had no upcoming events, so this never showed |
| B-02 | Notices: only those that have started (`StartDate` before now) and not expired, newest created first, at most 5. Section only shown when there is at least one | Every notice, no limit, always shown |
| B-03 | Blog cards with no image in the body use a fallback picture: one of 6 stock images, picked by a random seeded with the article ID (`generic/1.jpg` to `6.jpg`; 7 to 9 exist but are never picked) | Card shows no image |
| B-04 | Blog card button reads "Read →" | "Read more" link. Wording only |

### Events

| ID | Live | New site |
|---|---|---|
| B-05 | Event page countdown, worked out per view: Expired, "In Progress", Soon as "{h} hours to go" or "{m} minutes to go" when under an hour, Future as "{d} days to go" | Status word only, fixed at build time |
| B-06 | Event page date blocks. Ends on the same day of the month as it starts: Start `{time}` `{full month}` `{day}`, End likewise. Otherwise: Start `{day}` `{short month}` `{time}`, and End the same if set. _Bug:_ "same day" compares the day number only, not the month | Always Start and End as time, full month, day. End repeats the start when there is none |
| B-07 | Event page shows topic name as plain text | Topic link. Improvement, keep |
| B-08 | Calendar card: day number, status label (Expired, "In Progress", Soon; none for Future), 24-hour `HH:mm` time, full month name, title, location, summary. The whole card heading is a link by script only | Title link, status, `dd-MMM-yy` date, 12-hour time, location, summary, topic |
| B-09 | Calendar page heading "Upcoming Events", `<title>` "Calendar" | Check heading text |

### Notices

| ID | Live | New site |
|---|---|---|
| B-10 | Notices have a start date and an optional expiry date. `/notices` shows those not expired (start date ignored there). Home shows only started and not expired | No start or expiry. Every notice shows forever |
| B-11 | An expired notice's page shows a warning box: "**Expired** This notice has now expired and should be ignored." | None |
| B-12 | Notice page body is the plain-text "bulletin body" (the description field, up to 1000 characters). The rich HTML field is never shown publicly | Shows the migrated body. Spec 07 took it from the live page, so it is the bulletin text. See H-03 |
| B-13 | No date shown on notice cards or pages | Shows a date, inferred for migrated notices |

### Pages, menus and footer

| ID | Live | New site |
|---|---|---|
| B-14 | Hidden pages: a page flagged hidden returns 404 and is left out of menus, footer and sitemaps | No hidden flag. A page with no menu flags is still public and in both sitemaps |
| B-15 | Wide layout flag per page: full-width container instead of the standard column. Event pages always use it | No wide layout |
| B-16 | About dropdown is fixed: About Us, Contact Us (`/contact`), a divider, Privacy Policy, Cookie Policy. The "About" page type is ID 1 and is skipped by the type loops, so its other pages (church diary, contact list) are in no menu or footer | Built from page flags. Check the built About menu matches, including the divider and that church diary and contact list stay out |
| B-17 | Other page types: one visible page gives a direct link named after the type, more gives a dropdown named after the type, pages in database order | Same rule, ordered by `weight` then title. Check order against live |
| B-18 | Active menu item: script highlights by first path segment, and by page type under `/page/`. An article highlights Blog, an event highlights Calendar | `aria-current` only on an exact URL match. Articles and events highlight nothing |
| B-19 | Footer "Links" group: Church Blog, Church Calendar, Church Notices, Register, Login, Contact Us, Site Map, Privacy Policy, Cookie Policy. Then one group per page type (not About) listing every visible page | Check Contact Us, Privacy and Cookie come through the About footer flags. Register and Login drop (E) |
| B-20 | Footer map image hidden on phones | Check |
| B-21 | Back-to-top button (jQuery `scrollUp`) on every page | None |

### Contact

| ID | Live | New site |
|---|---|---|
| B-22 | `/contact` shows the body of page ID 12 first: a table of church contacts (role, name, email, phone). Then a heading "Alternatively", then "Send an Enquiry" and the form | A placeholder sentence, the form, the address and a link to `/page/about/contact-list`. The page 12 body was skipped by `migrate.mjs`. Confirm page 12 is the same content as `contact-list` |
| B-23 | After sending, the visitor is sent to the home page with no message | Thanks page. Improvement, keep |
| B-24 | The enquirer is emailed a copy: "Thanks for your Enquiry", with type and message | None. Web3Forms free plan has no autoresponder. See E-02 |

### Metadata and sharing

| ID | Live | New site |
|---|---|---|
| B-25 | Open Graph tags. Home: `og:description`, `og:type website`, `og:image` hero. Article: `og:title`, `og:type article`, `og:url`, `og:description`, `og:image` (first body image, else the fallback in B-03) | No Open Graph tags. Facebook previews of links into the site lose title and picture |
| B-26 | Fixed meta descriptions. Home: "St. Pauls's Church, Warton. Serving Christ - Serving the Community." Blog: "Read the latest blog articles from St. Pauls Church, Warton." Calendar: "Read the latest events and going's on at St Pauls Church, Warton." Notices: "Latest bulletins and notices for St. Pauls Church, Warton." Items and pages: their description | Description only where an item has a summary. Section indexes have none unless their `_index.md` has one |
| B-27 | Article page has schema.org `BlogPosting` microdata (`headline`, `datePublished`, `articleBody`) | None |
| B-28 | `<title>` is the bare title: "Blog", "Blog - {topic slug}", "Calendar", "Notices", item title, site name on home. Contact page has no `<title>` (_bug_) | "{title} \| St Paul's Warton". Improvement, keep |

### Lists and topics

| ID | Live | New site |
|---|---|---|
| B-29 | Blog index and topic pages show up to 20 full articles (title, date, topic, share links, author, whole body) | Summaries, decided (builder's call). Only 7 articles exist |
| B-30 | Calendar topic pages list every event in the topic, expired included, soonest first | Upcoming only |
| B-31 | Notices topic pages list every notice in the topic, expired included. `<title>` "Calendar" (_bug_) | All notices (there is no expiry) |
| B-32 | Page and blog article pages do not show the description as a lead paragraph. Event pages do | Lead shown on pages, articles and events |

### Sitemaps and robots

| ID | Live | New site |
|---|---|---|
| B-33 | `/sitemap` groups, sorted by title: Account (Login, Register, Manage), Blog (topics, then articles under each), Calendar (topics; events never appear, _bug_ in node keys), Home, More (Contact), Notices (topics, then active notices), then each page type except About with its visible pages | Home, Blog, upcoming Calendar items, Notices, every page type. Fine as an improvement; record it |
| B-34 | `/sitemap.xml` uses `http://`, lists account pages and every event | `https://`, no account pages. Improvement |
| B-35 | `robots.txt`: `Disallow: /account/manage`, no `Sitemap:` line | `Allow: /` and a `Sitemap:` line. Improvement |

### Dates on blog articles

| ID | Live | New site |
|---|---|---|
| B-36 | Article date is relative, per view: "Today at {HH:MM}" (_bug_: the minutes show the month number), the weekday name within the last 6 days, otherwise `dd-MMM-yy` | Always `dd-MMM-yy` at build. Static equivalent; record it |
| B-37 | Articles dated in the future are hidden from blog lists and the home page, but the aside's "Latest" shows them | No future dating. The live editor never let you set the date, so nothing to carry |

## C. Drift from the 2019 port

The [current state](../page-cms/page-cms-discovery-current-state.md) took several rules from the 2019 Umbraco port. The live code says otherwise.

| ID | Rule | Live | New site (from 2019 port) |
|---|---|---|---|
| C-01 | "Soon" | Starts within the next **24 hours** | Within **168 hours** (`SOON_MS` in `config/dates.js`) |
| C-02 | Event with no end | Active for **24 hours** after it starts, then Expired | End falls back to the start, so it goes straight from Soon to Expired and is never Active, and drops off `/calendar` the moment it starts |
| C-03 | Event time format | Card `HH:mm` (24-hour). Event page uses the server's short time format, which depends on the server culture | 12-hour `7:30 PM` everywhere. Check the live crawl to settle which the event page really showed |
| C-04 | Notices on home | Started, not expired, newest 5 (B-02) | All, newest first |
| C-05 | Notice expiry | Exists (B-10, B-11) | Not modelled |
| C-06 | Topic listings | Calendar and notices topic pages include expired items (B-30, B-31) | Upcoming only for calendar |

## D. URL gaps

All answer 200 on live (checked with `curl` on 2026-10-18) and none is in the live `/sitemap.xml`, so `scripts/check-urls.mjs` does not test them.

| ID | Live URL | Live behaviour | Suggested |
|---|---|---|---|
| D-01 | `/calendar/event/{id}` | Event page, no slug needed | 301 to the canonical URL, one route per event |
| D-02 | `/calendar/event/{id}/{any-slug}` | Event page, slug ignored. Old links made before a title change still work | 301 `/calendar/event/{id}/*` to canonical |
| D-03 | `/notices/notice/{id}` and `/notices/notice/{id}/{any-slug}` | As D-01 and D-02 | As D-01 and D-02 |
| D-04 | Any case variant, for example `/Blog/Article/Church-Roof-Completed`, `/page/About/about-us` | Works, routing and article lookup ignore case | Spec 05 covers some section names. Decide how far to go; Static Web Apps matches case-sensitively |
| D-05 | Trailing slash on any URL | Works | `trailingSlash: never` redirects. Check |
| D-06 | `/calendar/expired` | Expired events, heading "Upcoming Events" (_bug_) | 301 to `/calendar`, or build a past events page |
| D-07 | `/notices/expired` | Expired notices, title "Past Notices" | 301 to `/notices`, or build it if B-10 is built |
| D-08 | `/blog/list` | Public list of every article | 301 to `/blog` |
| D-09 | `/calendar/list`, `/notices/list`, `/page/list`, `*/create`, `*/edit/{id}`, `*/delete/{id}` | Admin pages, sent to login when signed out | 301 to the section, or let them 404 |
| D-10 | `/email/{id}` | Web copy of a sent publish email. Linked from every email ever sent to subscribers | 301 home, or to the RSS page |
| D-11 | `/email/unsubscribe` | Unsubscribe form | 301 home, or a short page saying emails have stopped (ties to spec 12's subscriber note) |
| D-12 | `/Home`, `/Home/Index`, `/Calendar/Index`, `/Notices/Index`, `/Blog/Index`, `/Contact/Index` | Conventional routes to the same pages | 301 each |
| D-13 | `/contact/contact` | Form POST target | 301 to `/contact` |
| D-14 | `/blog/article/{number}` | _Bug_: 301 to `/blog/article/{number}?slug=...` using another site's article list, then 404. Already broken | Nothing to carry |
| D-15 | `/blog/getarticle/{id}` | Article fragment for script | Let it 404 |
| D-16 | Image URLs with ImageResizer query strings (`?w=`, `?h=`, `?width=`, `mode=crop`) | Resized on the fly | Static Web Apps ignores the query, so the file still serves. Check migrated bodies have none left |

## E. Dropped on purpose

| ID | Live feature | Status |
|---|---|---|
| E-01 | Users, logins, roles, register, account management, "Manage Site" links | Dropped (your call). Redirects in A-03 |
| E-02 | Contact enquiries stored in the database, emailed to each group's managers plus the maintainer, copy to the enquirer, threads | Replaced by Web3Forms, one inbox, type in the subject (your call). Confirm losing the enquirer's copy (B-24) is fine |
| E-03 | Disqus comments on articles, and on events, notices and pages when "Include comments" was ticked (shortname `stpaulswarton`) | Dropped (your call) |
| E-04 | Publish emails to subscribers on every new article, event and notice; subscribe and unsubscribe | Dropped, RSS instead (decided). Subscribers were user accounts with "receive emails" set. See D-10, D-11 |
| E-05 | Share links (Facebook, Twitter, Google+, LinkedIn) on blog list and articles always; on events and notices when "Include social" was ticked | Dropped (builder's call). On notices the links were written inside `<head>` and never showed (_bug_) |
| E-06 | Author names: "by {name}" on articles, creator name on event and notice pages | Dropped (builder's call) |
| E-07 | Google Analytics (`UA-` property) | Dropped |
| E-08 | Maintainer credit and LinkedIn badge in the footer | Dropped (standing decision) |
| E-09 | Audit table recording every create, update and delete with full body | Git history does this |
| E-10 | Edit and Delete links on public pages for contributors | Pages CMS does this |
| E-11 | Admin event table (DataTables from a CDN), date-time picker, CKEditor, Roxy file manager | Pages CMS does this |
| E-12 | Groups on events and notices (owner group, used for email targeting) | Never shown publicly. Nothing to carry |

## F. Not St Paul's

Shared controllers answer on every domain. These are other sites' features. Let them 404 and keep them out of every plan, URL check and migration.

- `/cv`, `/home/about`, `/home/work`, `/miru`, `/team`, `/mobile`: other sites' pages. Some carry the maintainer's personal details.
- `/home/get-donation`, `/home/get-location`, `/home/set-location`, `App_Data/donations.json`: a charity ride tracker for another site.
- `/home/test`: shows the server's clock (200 on live).
- `/api/API/*`: a JSON API over every site's articles, including author names (500 on live).
- `/management/*`: roles, types, topics, groups, users.
- `/ImageUpload`, `/fileman/*`: upload tools. See S-01.
- `?domain={host}` on any URL: sets a cookie that switches the whole site to another tenant for a day.
- Old article redirect table for another site's numbered blog URLs.

## G. Editor capability

| ID | Live admin could | Pages CMS today | Question |
|---|---|---|---|
| G-01 | Add or rename topics | Fixed: `site/data/topics.yaml` plus three copies of the options in `.pages.yml` | Does Paul need new topics? If yes, one source for both |
| G-02 | Add page types (new top menu groups) | Fixed: one collection per type in `.pages.yml`, folder needs an `_index.md` | Likely a maintainer task. Record in the handover runbook |
| G-03 | Add enquiry types | `enquiry_types` in Site settings | At parity |
| G-04 | Hide a page without deleting it | None (B-14) | Add a `hidden` boolean, or accept delete |
| G-05 | Set a notice's start and expiry | None (B-10) | Ties to B-10 |
| G-06 | Wide layout per page | None (B-15) | Ties to B-15 |
| G-07 | Upload `jpg png gif pdf doc docx`. Images over 800 × 800 were scaled down on upload | Pages CMS media, sharp at build | Check `.doc` and `.docx` uploads are allowed and link correctly |
| G-08 | Rename an item and its URL changed (events, notices, pages) | Stable URLs from the file name | Improvement. Make sure the guide says renaming keeps the URL |

## H. Data for the content match

| ID | Fact |
|---|---|
| H-01 | Tables that hold St Paul's content: `Sites`, `Articles`, `Events`, `Notices`, `Pages`, `Types`, `Topics`, `Groups`. Filter every one on St Paul's `SiteID`; the database holds other sites too |
| H-02 | Article: `ArticleID`, `TopicID`, `Title` (200), `Description` (200, the summary), `HTML`, `TimeStamp` (published date), `TitleCode` (the stored slug), `LastModified`, `TitleImageURL` (unused), `Location` and `LatLng` (unused) |
| H-03 | Notice: `NoticeID`, `TopicID`, `Title` (200), `Description` (1000, the bulletin body shown publicly), `HTML` (never shown publicly, may hold stale or different text), `StartDate`, `ExpiryDate` (nullable), `Location`, `TimeStamp` (created, the list order), `IncludeSocial`, `IncludeComments` |
| H-04 | Event: `EventID`, `TopicID`, `Title` (50), `Description` (200, the summary), `HTML`, `StartDate`, `EndDate` (nullable), `Location`, `TimeStamp`, `IncludeSocial`, `IncludeComments`. All times are UK wall-clock times |
| H-05 | Page: `PageID`, `TypeID`, `Title` (50, the slug source), `Description` (200, meta description only), `HTML`, `WideLayout`, `IsHidden`, `TimeStamp`, `LastModified`. Page 12 is the `/contact` intro (B-22) |
| H-06 | Type: `TypeID`, `Name` (slug source). Type 1 is About and is skipped by menus and footers |
| H-07 | The export should also bring `IsHidden`, `WideLayout`, notice `StartDate` and `ExpiryDate`, so B-10, B-14 and B-15 can be decided on real data |
| H-08 | `App_Data/*.mdf` in the copy is an old development database, mostly another site's content. It is not the live database and holds no St Paul's events. Do not use it for dates |
| H-09 | Blog bodies were saved with every `<img>` `style` and `height` attribute removed. Event and notice bodies were not |

## S. Security

> [!WARNING]
> The ignored copy holds live secrets and other people's data. Keep it out of Git, and delete `data/st-pauls/` once the parity plan is written.

| ID | Finding | Action |
|---|---|---|
| S-01 | The Roxy file manager (`/fileman/`, handler `/fileman/asp_net/main.ashx`) lists, uploads, renames and deletes files in `Areas/st_pauls/Uploads`. Its `web.config` has `allow roles` with no `deny`, which on ASP.NET allows everyone. `/fileman/index.html` answers 200 on live | Maintainer checks in a browser whether the handler works signed out. Not probed from here. If open, block `/fileman` now, before cutover |
| S-02 | A plaintext SMTP password for the maintainer's mail account is in `Models/Service/EmailService.cs` and `Web.config`. `Web.config` also has two SQL connection strings with passwords | Treat as exposed. Rotate the mail password and the SQL logins, or remove them at decommission (spec 12) |
| S-03 | ELMAH error log configured with remote access allowed. `/elmah.axd` gave 404 on live, so it looks unreachable | Note only |
| S-04 | `/home/test` shows the server clock, `/api/API/*` returns 500, and `customErrors` is off with debug compilation on, so errors may show stack traces | Goes away at decommission |
| S-05 | The `.mdf` and `.ldf` files hold user accounts and emails for several sites | Delete with the copy |

## Next step

Turn B, C, D and G into decisions (build, redirect, or drop and record), then into a spec. B-01, B-02, B-10, B-25, C-01, C-02, D-01 to D-03 and S-01 matter most: they change what visitors see, break Facebook previews or old links, or are a live risk.
