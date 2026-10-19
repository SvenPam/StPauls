---
date: 2026-10-19
tags: [design, stpauls, parity, plan]
status: agreed
---

# Design: what to match from live before Paul edits

_Which findings from the [legacy source parity check](parity-check-discovery-legacy-source.md) the new site carries over, which it drops, and the two repo changes that go with them. IDs (B-01, C-02 and so on) point at that report, which holds the live rules in full. Agreed with the maintainer on 2026-10-19. Specs are written from this document._

---

## Intent

The maintainer is about to share the test site with Paul, who will start editing in Pages CMS straight away, most likely with a notice. Anything Paul or a visitor would notice as missing or different from live should be fixed first, so his first look is of a site that behaves like the one he knows. Things that only matter once the domain moves wait until just before cutover.

The site gets very little traffic and there are no search concerns, so old-link variants and old email links are not worth carrying. The bar is "Paul and visitors don't miss anything", not "every live URL and quirk".

## Goals

1. **Before Paul:** the hero, notices, events, blog, menus, footer and contact page behave like live (part 1).
2. **Paul's saves go live in about 3 minutes**, down from about 4, with the tests still run on every deploy.
3. **Code on `main` needs the maintainer's approval**, while Paul's and other publishers' saves still go straight to `main`.
4. **Old admin and login links land in Pages CMS**, where anyone looking to edit now needs to be.
5. **Before cutover:** Facebook link previews, search descriptions and article markup match live (part 2).

## Non-goals

- Old-link variants (D-01 to D-16): short or wrong-slug event and notice links, `/calendar/expired`, `/notices/expired`, `/blog/list`, `/Home/Index` and other conventional routes, `/contact/contact`, more mixed-case spellings. They 404. Maintainer, 2026-10-19: barely any traffic, no search concern.
- Old email links (D-10, D-11): `/email/{id}` and `/email/unsubscribe` 404. Barely used, only generated spam (maintainer).
- Wide layout per page (B-15, G-06). No live page uses it (checked 2026-10-19: every page sits in the standard column). Maintainer agreed to drop it.
- Visual redesign. Still phase 2.

## Anti-goals

- Paul's first save fails, or takes so long he thinks it failed. The ruleset must let Pages CMS through, and must be checked with a real save before Paul is invited.
- A notice or event Paul adds behaves differently from live in a way he notices: a notice that never goes away, an event that vanishes the moment it starts.
- New articles published under Paul's name by someone else.
- Dropping the tests to buy speed. They are the one check that stops a bad edit going live.

## Constraints

- Every standing decision in `CLAUDE.md` holds, except the two this document changes (see "Decisions", rows marked _changes CLAUDE.md_).
- Static site: anything worked out from "now" is right at build time. The nightly rebuild (`17 3 * * *` UTC) and every save rebuild it. Where live works something out on every view, `site.js` may correct it in the browser; the page must still read correctly with no script.
- All dates and times are UK wall-clock times (`config/dates.js`, `londonInstant`).
- Bodies are pure Markdown, and migrated content is never corrected (spec 07a). Text copied from live goes in as written, typos and broken links included.
- Tests: Gherkin scenarios and `node:test` for every behaviour here, whole suite green, per `docs/features/page-cms/page-cms-spec-conventions.md#tests`. No tests on docs.
- The live source copy (`data/st-pauls/`) is not in the sandbox and is due for deletion. The parity report is the record of live rules. Live pages can still be read with `curl` until cutover.

---

## Decisions

| Topic | Decision | By |
|---|---|---|
| Scope line | Part 1 is what Paul or a visitor would notice, done before Paul is invited. Part 2 is what matters on cutover day | Maintainer |
| Hero | Full width, edge to edge, touching the menu bar, about half the screen high, like live. Navy wash stays | Maintainer |
| Authors | Back on blog articles. Others may publish, so it is a field, not a fixed name | Maintainer |
| Notices | Start and optional end date, live's rules (part 1, "Notices") | Maintainer |
| Events | Live's rules (part 1, "Events") | Maintainer |
| Wide layout | Dropped | Maintainer |
| Topics (G-01) | Stay fixed at the 4 in `site/data/topics.yaml`. Static for a decade. Adding or renaming one is a maintainer job on request; it goes in the handover runbook (spec 12) with G-02, adding a page type | Maintainer |
| Old-link and email redirects | Dropped | Maintainer |
| Admin and login links | Temporary redirect (302) to `https://app.pagescms.org/svenpam/stpauls/main`. _Changes CLAUDE.md_ ("Logins": `/account/*` went home) | Maintainer |
| Build speed | Bicep runs only when `infra/` changes. Tests stay | Maintainer |
| Repo protection | Code owners plus a ruleset on `main`: maintainer approval for any non-content change | Maintainer |
| URLs | Item URLs stay identical to live. Other live URL variants are no longer a parity target. _Changes CLAUDE.md_ ("Content source") | Maintainer |
| Time format | 24-hour (`19:30`) on cards and event pages, as the UK local time typed in Pages CMS (no zone), never UTC | Maintainer |
| Soon | 7 days, not live's 24 hours | Maintainer |
| Countdowns and labels | `site.js` refreshes event status labels and countdowns, and hides events that have ended since the build, from times in `data-` attributes. The built page is the no-script fallback | _Builder's call_ |
| Topic pages | Calendar and notices topic pages include past items, like live (B-30, B-31) | _Builder's call_ |
| Kept improvements | `<title>` format, `/contact/thanks`, topic link on event pages, blog summaries, sitemap, `robots.txt`, `dd-MMM-yy` article dates, lead paragraph on pages and articles (B-07, B-23, B-28, B-29, B-32 to B-36) | _Builder's call_, from the report |

---

## Part 0: repo and build (first)

Small, and needed before Paul's first save.

### Bicep only when `infra/` changes

Measured on the last deploy of `main` (run 38, 2026-10-19): about 4 minutes. Install 32s, build 3s, tests 28s, Bicep 55s, deploy action set-up and upload 68s, the rest about 50s. Skipping Bicep saves about a minute.

- On a push to `main`: run "Deploy infrastructure" only when `infra/**` changed between `github.event.before` and `github.sha`. Run it when `before` is missing or all zeros.
- A manual "Run workflow" always runs Bicep, so the maintainer can force it.
- The nightly rebuild never runs Bicep.
- The "Read deployment token" step needs the Static Web App's name and the summary line needs the host name. When Bicep is skipped, read both from the last `stpauls-web` deployment's outputs (`az deployment group show`). The template deployer role (`infra/roles/stpauls-template-deployer.json`) already grants `Microsoft.Resources/deployments/*`, so no role change.
- Known gap, accepted: GitHub keeps only one waiting run per concurrency group. If an `infra/` push is waiting and a Pages CMS save replaces it, Bicep is skipped. Record it in the Azure how-to: run the workflow by hand after an infra change that landed alongside a save.

### Protect `main`

Pages CMS commits straight to `main`, and code owners only apply to pull requests, so this takes two parts.

1. **`.github/CODEOWNERS`** (built): `* @SvenPam`, then the paths Pages CMS writes, with no owner: `/site/content/`, `/site/static/uploads/`, `/site/data/settings.yaml`. Those come from `.pages.yml` (`media.input`, every `content[].path`). A unit test that reads both files and fails if a `.pages.yml` path is not listed without an owner is the builder's call.
2. **A ruleset on `main`** (maintainer's manual step, written up in `docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md`, replacing its "no ruleset" note):
   - Require a pull request, with review from code owners. Required approvals 0, so a content-only pull request needs nobody.
   - Require the `build` status check.
   - Block force pushes and deletion.
   - Bypass: the Pages CMS GitHub App (always), and the Repository admin role. You can't approve your own pull requests, so without this the maintainer is locked out. _Builder's call:_ admin bypass "for pull requests only", so a stray direct push is still blocked.
   - Check with a real save before Paul is invited: one save in Pages CMS signed in with GitHub (the maintainer), one as an email collaborator. If the maintainer's save is refused, Pages CMS uses his own token for it: set the admin bypass to "always".

Effect: Dependabot and any future GitHub collaborator need the maintainer's approval for code. Publishers are unaffected. Gap, accepted: the Pages CMS bypass covers every file, not just content. Publishers have no GitHub access, and Pages CMS only edits the paths in `.pages.yml`. The repo is public, so rulesets are free.

### Admin and login links to Pages CMS

Temporary (302) redirect to `https://app.pagescms.org/svenpam/stpauls/main`:

- `/account*` and `/Account*`. These already exist in `site/data/legacy.yaml` as 301s to `/`. They change target and status. They have only ever been served from the test URL, so no browser holds the old 301.
- `/{calendar,notices,page}/list`. `/blog/list` was public, so it 404s.
- `/{blog,calendar,notices,page}/create`, `/edit/*`, `/delete/*`.
- `/management*`.
- Each in lower case and with the section name capitalised (`/Calendar/Create`), as `legacy.yaml` does for `/Account*`.

`legacy.yaml` redirects are all 301 today (`config/swa.js`). How a 302 is expressed is the builder's call. The Pages CMS address lives in one place.

---

## Part 1: before Paul

### Home hero

- Breaks out of the `.container` that `site/_includes/base.njk` wraps every page in, and touches the menu bar. Height about 50vh, as now. Navy wash and text as now.
- The source photo (`site/assets/images/hero.jpg`) is 1024 by 769. Serve it up to 1024 wide (it stops at 800 today). Full width on a big screen will look soft, as it does on live. A bigger photo from the church fixes it later.

### Notices

Live (B-02, B-10, B-11, B-13, C-04, C-05): a notice has a start date and an optional end date. 35 of the 40 notices in the SQL export had ended, so end dates were used.

- **Pages CMS:** the existing `date` field is labelled "Show from". A new optional date field labelled "Show until". Field name is the builder's call. Both are dates, no time.
- **"Ended"** means after the end of the "Show until" day, UK time. _Builder's call:_ the day itself is included.
- **Home:** notices that have started (on or before today) and not ended, newest "Show from" first, at most 5. The "Church Notices" section is hidden when there are none.
- **`/notices`:** every notice not ended, whether started or not (live ignores the start date here). Newest first.
- **An ended notice's page** still builds, with live's warning box: "**Expired** This notice has now expired and should be ignored." It drops out of `/notices`, home, the sitemaps and the notices RSS feed. Topic pages keep it (see Decisions).
- **No date shown** to visitors on notice cards or pages, like live.
- A notice appears or disappears at the nightly rebuild or the next save. Say so in Paul's guide (spec 10).

### Events

Live (B-01, B-05, B-06, B-08, B-09, C-01, C-02, C-03). There are no upcoming events on live today, so these rules are tested on fixtures only.

- **Status.** Expired: after the end. Active ("In Progress"): between start and end. Soon: starts within the next **7 days** (`SOON_MS`, kept from the 2019 port; live used 24 hours. Maintainer, 2026-10-19). Future: otherwise.
- **No end time:** the event ends 24 hours after it starts. Today the end falls back to the start, so the event goes from Soon straight to Expired and drops off `/calendar` as it starts.
- **Home:** an "Upcoming Events" column beside the notices, heading linking to `/calendar`. Events not yet ended, soonest first, first 20, grouped under the month name (no year). Each line: day of the month in bold, the title, and a "Soon" or "Active" label when one applies. Hidden when there are none. Column widths and how it stacks on a phone are the builder's call.
- **`/calendar`:** heading "Upcoming Events", `<title>` "Calendar" (in the site's title format).
- **Calendar card:** day number, status label (Expired, "In Progress", Soon; none for Future), 24-hour time, full month name, title, location, summary. The title is a real link (live used script). Topic dropped from the card, like live.
- **Event page date blocks.** Start and end on the same date: Start `{time}` `{full month}` `{day}`, End likewise. Otherwise: Start `{day}` `{short month}` `{time}`, and End the same when there is one. "Same date" compares day, month and year (live compared the day number only, a bug). No end: no End block (today it repeats the start).
- **Event page countdown:** Expired, "In Progress", "{h} hours to go" or "{m} minutes to go" under an hour (while Soon), "{d} days to go" (Future). Whole numbers rounded down.
- **Calendar topic pages:** every event in the topic, past included, soonest first.
- **Testing:** fixture events at fixed times around a fixed clock: build-time "now" for Eleventy, Playwright's clock for `site.js`. How the build clock is set is the builder's call.

### Blog

- **Author.** A required "Author" text field on blog articles in Pages CMS, empty on a new article. The 7 migrated articles get `Paul Barfoot` (every live article reads "by Paul Barfoot", checked 2026-10-19). Shown as "by {author}" on the article page and the blog list, like live. Not on home cards. Events and notices stay without a name (E-06 still holds for them).
- **Stock pictures (B-03).** An article with no picture of its own uses one of live's 6 stock pictures, on its card and as its Facebook picture (part 2). Copy `generic/1.jpg` to `6.jpg` from live (`/Areas/st_pauls/Content/Image/generic/`). The migrated articles with no picture get the one live gives them: read it from each live article page's `og:image`. New articles get one by a fixed rule from the file name, so it never changes between builds.
- **Card button** reads "Read →" (B-04). It still needs an accessible name that says which article.

### Menus, footer and pages

- **About divider (B-16):** between Contact Us and Privacy Policy, like live. The header otherwise matches live already (checked 2026-10-19).
- **Section highlight (B-18):** the top menu item for the current section is highlighted: Blog on any `/blog/...` page, Calendar on any `/calendar/...` page, the page type's item or dropdown on `/page/{type}/...`. Done at build time. `aria-current="page"` stays on exact matches only.
- **Back-to-top button (B-21)** on every page, from `site.js`. Shows after scrolling, hidden in print. Look is the builder's call, within the site's colours.
- **Footer map (B-20):** hidden on phones, like live.
- **Checks only:** blog aside hidden on phones and in print (A-09), footer Links group has Contact Us, Privacy Policy and Cookie Policy (B-19), page order in menus matches live (B-17). Add scenarios where none exist.
- **Hidden pages (B-14, G-04):** a "Hidden" tick box on pages in Pages CMS. A hidden page is not built (404) and is in no menu, footer or sitemap. The two hidden pages on live (13 and 17) were not migrated and stay out.

### Contact page

Live (B-22): the body of page 12, a table of church contacts, then a heading "Alternatively", then "Send an Enquiry" and the form.

- The table goes in the body of `site/content/page/about/contact-us.md`, replacing the placeholder sentence, so publishers edit it there. Take it from the live `/contact` page as written. It is the same table as `/page/about/contact-list`, broken email links included; leave both as they are.
- "Alternatively" and "Send an Enquiry" come before the form, and are hidden with the form while no Web3Forms key is set.
- _Builder's call:_ drop the "Find us" address and the contact list link from the page, like live. The footer has the address.
- Name field gets `maxlength="100"`, like live (A-07).

### Editor checks

- `.doc` and `.docx` uploads work in Pages CMS media and link correctly from a body (G-07). Fix `.pages.yml` if not.
- For Paul's guide (spec 10): renaming an item keeps its URL (G-08), and notices appear or disappear overnight.

---

## Part 2: before cutover

- **Facebook previews (B-25).** Home: `og:description`, `og:type` `website`, `og:image` the hero. Article: `og:title`, `og:type` `article`, `og:url`, `og:description`, `og:image` (the first picture in the article, else its stock picture). Image URLs absolute.
- **Search descriptions (B-26).** Live's fixed text, as written, as the default `description` for home, blog, calendar and notices, editable in Pages CMS. How each section's description is exposed is the builder's call.
  - Home: "St. Pauls's Church, Warton. Serving Christ - Serving the Community."
  - Blog: "Read the latest blog articles from St. Pauls Church, Warton."
  - Calendar: "Read the latest events and going's on at St Pauls Church, Warton."
  - Notices: "Latest bulletins and notices for St. Pauls Church, Warton."
- **Article markup (B-27).** schema.org `BlogPosting` with `headline`, `datePublished`, `articleBody`, and `author` now there is one. Microdata, like live. The content security policy blocks inline scripts, so not JSON-LD.

---

## Dropped and recorded

Nothing to build. Recorded so nobody adds them back by accident.

| IDs | What | Why |
|---|---|---|
| D-01 to D-09, D-12 to D-16 | Old-link variants | Maintainer: little traffic, no search concern. Admin links are the exception (part 0) |
| D-10, D-11 | Old email links | Maintainer: barely used, only spam |
| B-15, G-06 | Wide layout | No page uses it. Maintainer |
| G-01, G-02 | Publishers adding topics or page types | Topics static for a decade. Maintainer job, in the handover runbook |
| B-24, E-02 | Copy of the enquiry emailed to the enquirer | Web3Forms free has no autoresponder. Accepted |
| B-37 | Future-dated articles hidden | The live editor never let anyone set the date |
| E-01, E-03 to E-05, E-07 to E-12 | Logins, comments, publish emails, share links, analytics, maintainer credit, audit table, admin tools, groups | Already decided |
| E-06 | Names on events and notices | Articles only (maintainer) |
| F | Other sites' routes | Not St Paul's. They 404 |

---

## Maintainer's manual steps

1. **Now, whatever else happens:** check in a browser whether the live file manager works signed out (S-01, `/fileman/index.html` and its handler). If it does, block `/fileman` on live before anything else.
2. Rotate the mail password and SQL logins found in the live source (S-02), or plan their removal at decommission (spec 12).
3. Delete the ignored live source copy `data/st-pauls/` (S-05). This document is the plan the report was waiting for.
4. Set up the ruleset on `main` (part 0), then do the two real saves before inviting Paul.
5. After part 1 is on the test site, invite Paul.

## Work outline

Proposed specs, in `docs/features/parity-check/` as `parity-check-spec-NN-<topic>.md`. They go before spec 10 (editor rollout) and spec 11 (cutover) in the Page CMS sequence. Final split is for the plan.

| Spec | Covers | Before |
|---|---|---|
| 01 Repo and build | Part 0 | Paul |
| 02 Notices and events | Part 1, "Notices", "Events" | Paul |
| 03 Home, blog, menus, contact | Part 1, the rest | Paul |
| 04 Sharing and search | Part 2 | Cutover |

When a spec merges: update `CLAUDE.md` ("Logins" and "Content source" rows, new rows for build and repo protection, "Next steps") and the decisions table in `docs/features/page-cms/page-cms-feature.md`.

## Left to the builder

- How each rule is split between build time and `site.js`, within "Constraints".
- Field names in `.pages.yml`, markup and CSS, as long as the look stays within the site's colours and layout.
- How the hero breaks out of the container, the home column layout, the divider and the section highlight.
- How a 302 is expressed in `legacy.yaml` and `config/swa.js`.
- The fixed rule for new articles' stock pictures.
- The test clock.

## Calls to check

The builder's calls above, in one list for the maintainer to read:

1. 24-hour times everywhere, shown as the UK local time typed in Pages CMS, never treated as UTC. Agreed (maintainer, 2026-10-19).
2. `site.js` refreshes labels and countdowns and hides ended events, not just the event page countdown.
3. Calendar and notices topic pages keep past items.
4. A notice's "Show until" day is included.
5. Contact page drops the address and contact list link.
6. Admin bypass on the ruleset is "for pull requests only".
7. Topic dropped from calendar cards.
8. The lead paragraph stays on pages and articles, though live doesn't show it there.
