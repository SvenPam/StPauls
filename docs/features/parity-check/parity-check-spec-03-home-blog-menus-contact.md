---
date: 2026-10-19
tags: [spec, plan, stpauls, parity]
status: done
---

# Spec 03: home, blog, menus and contact

_One session, after spec 02. The rest of part 1 of the [parity design](parity-check-feature.md): full-width hero, authors and stock pictures on the blog, the About divider, section highlight, back-to-top, footer map on phones, hidden pages, the contact page and two editor checks. Live rules: [parity report](parity-check-discovery-legacy-source.md) A-07, A-09, B-03, B-04, B-14, B-16 to B-22, G-04, G-07, G-08. Conventions: [page-cms-spec-conventions.md](../page-cms/page-cms-spec-conventions.md)._

---

## Goal

Paul's first look at the test site matches what he knows from live, and he can hide a page and name an article's author in Pages CMS.

## Starting point

- `site/_includes/base.njk` wraps every page's content in `<main id="main" class="site-main"><div class="container">`. The hero (`sections/home.njk`, `.hero` in `50-components.css`) sits inside it. `site/assets/images/hero.jpg` is 1024 by 769; the hero `picture` stops at 800 wide (`config/images.js` widths).
- `partials/card.njk` blog branch: image from `image`, "Read more" with a visually hidden "about {title}". 3 of 7 articles have `image`; `church-roof-completed` already uses `/uploads/content/generic-2.jpg` (live's fallback, migrated). The other 4 have none.
- `config/menus.js`: `menuItems`, `footerGroups`, `pagesByType`; About is a page type folder `site/content/page/about/`. `partials/header.njk` sets `aria-current="page"` on exact matches only.
- `site.js`: one IIFE, menu and form enhancements.
- `partials/footer.njk`: `.find-us__map` always shown.
- `.pages.yml` page collections have `title`, `header`, `footer`, `weight`, `url` (hidden), `layout` (hidden), body. Blog has `title`, `date`, `summary`, `image`, `image_alt`, `blogtopics`, `url`, `body`.
- `site/content/page/about/contact-us.md` (`url: /contact`, `layout: contact.njk`) body is a placeholder sentence. `contact.njk` includes `sections/page.njk`, then the form when a key is set; the page also shows a "Find us" address and a contact list link (check `sections/page.njk` and `contact.njk` for where).
- Live article pages read "by Paul Barfoot". Live's stock pictures: `http://stpaulswarton.co.uk/Areas/st_pauls/Content/Image/generic/{1..6}.jpg`.

## In scope / Out of scope

In: everything under Requirements. Out: notices and events (spec 02), Open Graph and descriptions (spec 04), a bigger hero photo.

## Requirements

### Hero

- The home page renders the hero outside `.container`, full width, directly under the header (no gap). Builder's call how: a `hero` block in `base.njk` that `home.njk` fills, or the home layout closing and reopening the container. Other pages unchanged.
- `picture` for the hero offers 1024 wide; the `sizes` stays `100vw`.

### Blog

- `.pages.yml` blog: `author`, type `string`, label "Author", required, no default, after `date`. Every migrated article gets `author: Paul Barfoot`.
- Article page: `<p class="author-attribution">by <span>{author}</span></p>` under the heading. Blog list entries the same. Not on home cards. An article with no `author` (old fixtures) shows no line.
- Stock pictures: `site/assets/images/generic/1.jpg` to `6.jpg` downloaded once from live (byte for byte). `config/images.js` (or a filter in `config/filters.js`) `stockPicture(item): string` returns `images/generic/{n}.jpg`: from a map in `site/data/stock-pictures.yaml` (`{ slug: n }`) for migrated articles, else `n = 1 + (sum of the char codes of the file name without .md) % 6`. Fill the map for the 4 articles with no `image` from each live article page's `og:image`; `church-roof-completed` keeps its own `image`.
- A blog card with no `image` uses `stockPicture` with `alt=""` (decorative, as live).
- Card link text "Read →", keeping the visually hidden " about {title}"; the arrow is `aria-hidden`.

### Menus, footer, pages

- About dropdown: a separator `<li role="separator" class="site-nav__divider"></li>` before Privacy Policy. Builder's call how (simplest: in `menuItems`, for the `about` type, insert `{ divider: true }` before the first page whose weight is above Contact Us's; or a `divider_before: true` front matter key on `privacy-policy.md`, not shown in Pages CMS). The header template renders it.
- Section highlight: `menuItems` items get `section` (`blog`, `calendar`, or `page/{type}`); the header adds `class="is-current"` to the top item (link or `summary`) when `page.url` starts with `/blog/`, `/calendar/` or `/page/{type}/` respectively, and to Home on `/`. Styled like the current hover state. `aria-current` stays exact-match only.
- Back-to-top: `site.js` adds `<a class="back-to-top" href="#main">Back to top</a>` (an up arrow icon, visible text for screen readers) to the body, shown once the page is scrolled more than one screen, hidden in print (`@media print`). Fixed bottom right, navy.
- Footer map: `.find-us__map` hidden below the existing phone breakpoint.
- Hidden pages: pages collections in `.pages.yml` gain `hidden`, type `boolean`, label "Hidden", description "Hidden pages are not on the site". `itemPermalink` returns `false` for a page with `hidden: true`, and `config/content.js` drops it from `collections.pages`, so menus, footer, `/sitemap` and `/sitemap.xml` lose it.

### Contact page

- `contact-us.md` body: the contact table from the live `/contact` page, converted to Markdown as written (same converter rules as spec 07a; it is the table in `contact-list.md`). Replaces the placeholder.
- After the body and only when the form shows: `<h2>Alternatively</h2>` then `<h3>Send an Enquiry</h3>` (heading levels as live; builder may adjust if the outline needs it), then the form.
- The page no longer shows the "Find us" address or the contact list link.
- Name input: `maxlength="100"`.

### Editor checks

- Pages CMS `media` accepts `.doc` and `.docx` (check `.pages.yml` `media.extensions` or equivalent; add them if a list exists). A fixture body linking `/uploads/x.docx` keeps the link as written.
- Spec 10's editor guide gets two lines: renaming an item keeps its address; notices appear and disappear overnight (or on the next save).

### Changed while building (2026-10-20)

- **Card pictures:** live's 4 articles without an `image` all have a picture in their body, and live's card and `og:image` use it. So the rule is `image`, else the first body picture, else a stock picture by a fixed rule from the file name (`cardImage`, `stockPicture`, `firstImage` in `config/filters.js`). No `stock-pictures.yaml` map. The stock pictures are `site/assets/images/generic-1.jpg` to `generic-6.jpg`; `generic-2.jpg` is byte for byte the one "Church Roof Completed" already uses.
- **Back-to-top:** a plain link after the footer, shown by a CSS scroll-driven animation once the page has scrolled a screen (always shown where unsupported), not `site.js`. `site.js` had under 100 bytes left of its 2 KB budget.
- **Hero widths:** `picture` takes `full: true` to also offer the source's own width; only the hero uses it, so other images keep spec 06's widths.
- **Media:** `.pages.yml` has no file-type list, so `.doc` and `.docx` already upload. No change.

## Manual steps (maintainer)

_Tracked in [the maintainer checklist](../page-cms/page-cms-how-to-run-the-maintainer-checklist.md) (spec 10), which is the one list to run through. Kept here for detail._

1. After merge, look at home on a phone and a big screen: the hero is edge to edge.
2. In Pages CMS, open a page and tick "Hidden", save, check it is gone from the menu and gives "not found", then untick.

## Acceptance

- [x] Hero full width at 1024 max.
- [x] Author field and line; stock pictures as live; "Read →".
- [x] About divider, section highlight, back-to-top, footer map hidden on phones, hidden pages.
- [x] Contact page as live; name max 100.
- [x] `.doc`/`.docx` uploads; guide lines added.
- [x] `npm test` green.

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** as above.

**Architecture:** template and CSS changes, one new filter for stock pictures, a `hidden` flag handled in the permalink and pages collection, and a back-to-top block in `site.js`.

**Tech Stack:** Eleventy 3, Nunjucks, sharp via `config/images.js`, vanilla JS, Playwright with `playwright-bdd`, `node:test`.

**Spec:** this document and [parity-check-feature.md](parity-check-feature.md).

### Global Constraints

- Exact copy: "by {author}", "Read →", "Back to top", "Alternatively", "Send an Enquiry", "Hidden", "Author".
- Colours and layout stay the site's. No inline script or style.
- Migrated content is not corrected (the contact table keeps its broken email links).

### Review Focus

- A page that is both hidden and in the header menu: not in the menu, not built (scenario).
- A page type whose only page is hidden: the type disappears from the menu and footer (unit test on `menuItems` / `footerGroups`).
- An article file name with non-ASCII characters: `stockPicture` still returns 1 to 6 (unit test).
- A short page with no scroll: no back-to-top shown (scenario).
- Contact page with no Web3Forms key: no "Alternatively" heading (scenario on 1313, key-less).

---

### Task 1: Full-width hero

**Files:** Modify `site/_includes/base.njk`, `sections/home.njk`, `site/assets/css/50-components.css`, `config/images.js` if widths are global. Test `tests/features/pages.feature`.

- [ ] **Step 1: Failing scenarios**: on a 1440-wide viewport, the `.hero` box is 1440 wide and its top equals the header's bottom; the hero `img` `srcset` includes `1024w`; other pages' first heading is inside `.container`.
- [ ] **Step 2: Run** `npm run test:bdd`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Hero".
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Make the home hero full width, as on live"`

### Task 2: Authors, stock pictures and "Read →"

**Files:** Modify `.pages.yml`, `site/content/blog/*.md` (author), `sections/blog-item.njk`, `sections/blog-list.njk`, `partials/card.njk`, `config/filters.js` or `config/images.js`. Create `site/assets/images/generic/1.jpg`..`6.jpg`, `site/data/stock-pictures.yaml`. Test `tests/unit/filters.test.mjs` (or `images.test.mjs`), `tests/features/blog.feature`, `tests/features/editor.feature`, fixtures in `tests/fixtures/content/blog/` (add `author` to two).

**Interfaces:** Produces `stockPicture(item): string` filter.

- [ ] **Step 1: Failing tests**: `stockPicture` returns the mapped picture for a mapped slug, `images/generic/{1..6}.jpg` for any other name including `"église-été"`, the same value on two calls. Scenarios: a fixture article with `author: Ann Example` shows "by Ann Example" on its page and the blog list; one without shows no "by"; a card with no image shows an `img` from `/images/generic-` (fingerprinted path from `images/generic/`) with `alt=""`; card link text is "Read →" and its accessible name includes the title; home cards show no "by". Editor: blog has a required `author` string labelled "Author".
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Blog". Read live `og:image` for the 4 articles with `curl` and record them in `stock-pictures.yaml`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Bring back authors and live's stock pictures on blog cards"`

### Task 3: Menus, back-to-top and footer map

**Files:** Modify `config/menus.js`, `partials/header.njk`, `site/assets/js/site.js`, CSS (`30-layout.css`, `70-footer.css`). Test `tests/unit/menus.test.mjs`, `tests/features/menu.feature`, `tests/features/layout.feature`.

**Interfaces:** `menuItems` items gain `section: string`; About children may contain `{ divider: true }`.

- [ ] **Step 1: Failing tests**: unit, `menuItems` About children have a divider between Contact Us and Privacy Policy (fixture pages); each item carries `section`. Scenarios: About dropdown has a separator between "Contact Us" and "Privacy Policy"; on a fixture article "Blog" has class `is-current`; on a fixture event "Calendar" does; on `/page/about/about-us` the About `summary` does; on `/` Home does; on a long page after scrolling two screens a "Back to top" link is visible and goes to `#main`; on the 404 page (short) it is not visible; at 375 wide the footer map is hidden, at 1280 shown. Checks: blog aside hidden at 375 wide and in print emulation; footer Links has Contact Us, Privacy Policy, Cookie Policy.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL (checks that already pass are kept as guards).
- [ ] **Step 3: Implement** per "Menus, footer, pages" (not hidden pages).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Add live's About divider, section highlight, back-to-top and phone footer"`

### Task 4: Hidden pages

**Files:** Modify `.pages.yml` (every page collection), `config/content.js`. Create fixture `tests/fixtures/content/page/about/hidden-page.md` (`hidden: true`, `header: true`, `footer: true`). Test `tests/unit/content.test.mjs`, `tests/features/pages.feature`, `tests/features/sitemap.feature`, `tests/features/editor.feature`.

- [ ] **Step 1: Failing tests**: `itemPermalink` is `false` for a page with `hidden: true`; `/page/about/hidden-page` is 404; not in header, footer, `/sitemap`, `/sitemap.xml`; a type whose only page is hidden is not in the menu; every page collection in `.pages.yml` has a boolean `hidden` labelled "Hidden".
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Hidden pages".
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Let publishers hide a page"`

### Task 5: Contact page and editor checks

**Files:** Modify `site/content/page/about/contact-us.md`, `site/_includes/contact.njk`, `sections/page.njk` if the address lives there, `.pages.yml` (media extensions if listed), `docs/features/page-cms/page-cms-spec-10-editor-rollout.md` (two guide lines). Test `tests/features/contact.feature`, fixtures `tests/fixtures/content/page/about/contact-us.md` (a small table).

- [ ] **Step 1: Failing scenarios**: on 1315 (with key) `/contact` shows the fixture table first, then "Alternatively", then "Send an Enquiry", then the form; no "Find us" and no link to `/page/about/contact-list`; the name input has `maxlength` 100. On 1313 (no key) no "Alternatively". Editor: media accepts `docx`. A fixture notice body link to `/uploads/x.docx` is kept.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Contact page" and "Editor checks". Take the live table with `curl http://stpaulswarton.co.uk/contact` and convert it as written.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Show live's contact table above the form"`

### Finish

- [ ] `npm ci && npm test` green with Node 26. Push. Give the maintainer the manual steps.
