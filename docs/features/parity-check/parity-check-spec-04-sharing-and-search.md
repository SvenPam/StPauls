---
date: 2026-10-19
tags: [spec, plan, stpauls, parity]
status: agreed
---

# Spec 04: sharing and search

_One session, before cutover (spec 11), after spec 03. Part 2 of the [parity design](parity-check-feature.md): Facebook link previews, live's search descriptions and article markup. Live rules: [parity report](parity-check-discovery-legacy-source.md) B-25 to B-27. Conventions: [page-cms-spec-conventions.md](../page-cms/page-cms-spec-conventions.md)._

---

## Goal

A link to the home page or an article shared on Facebook shows a title, description and picture, every section index has live's description, and articles carry `BlogPosting` markup.

## Starting point

- `partials/head.njk` writes `<title>` and a `description` meta only where the page has `summary` or `description`.
- `site.url` (site data) is the production origin used by feeds and the sitemap.
- Spec 03: `stockPicture(item)` filter; articles have `author`.
- The content security policy (`config/swa.js`) blocks inline scripts.
- `site/content/_index.md` (home) is in `.pages.yml` (`home`). Section indexes `site/content/{blog,calendar,notices}/_index.md` are not, unless a spec added them (check).

## Requirements

### Open Graph

- Home: `og:type` `website`, `og:title` site title, `og:description` the home description, `og:url` `site.url` + `/`, `og:image` the hero, absolute, 1024 wide.
- Article: `og:type` `article`, `og:title` title, `og:description` summary (else the blog description), `og:url` absolute canonical, `og:image` absolute: the article's `image`, else the first image in the body, else `stockPicture`. Use a resized JPEG at least 600 wide.
- Other pages: none (as live).

### Descriptions

- `description` default, as written, typos kept:
  - Home: `St. Pauls's Church, Warton. Serving Christ - Serving the Community.`
  - Blog: `Read the latest blog articles from St. Pauls Church, Warton.`
  - Calendar: `Read the latest events and going's on at St Pauls Church, Warton.`
  - Notices: `Latest bulletins and notices for St. Pauls Church, Warton.`
- In each `_index.md` front matter. Editable in Pages CMS: a `description` field (label "Search description") on `home`, and a new single-file entry "Section descriptions" or one file entry per section index (builder's call) with only `title` and `description`.
- Topic pages use their section's description.

### Article markup

- Article page `<article itemscope itemtype="https://schema.org/BlogPosting">` with `itemprop` `headline` (h1), `datePublished` (a `<time datetime>` with `isoDay`), `author` (the author span, as `itemprop="author"` with a nested `name`), `articleBody` (the prose div). Microdata only.

### Changed while building (2026-10-20)

- **Section descriptions:** one Pages CMS file entry each ("Blog page", "Calendar page", "Notices page"), showing only "Search description". `content.merge` keeps their other keys. Topic pages read their section's description through a `sectionIndex` filter.
- **Share picture:** an async shortcode `shareImage(src, siteUrl)` in `config/images.js`, a JPEG up to 1200 wide. The article's picture follows `cardImage` (spec 03), so it matches the card.
- **Test URL:** share addresses use `site.url`, the real domain. Before cutover a preview of the test URL points at pictures that only exist once the domain moves, so the Facebook check waits for cutover.

## Manual steps (maintainer)

1. After cutover, paste an article's address on the real domain into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/): title, description and picture show. Before cutover, View Source on the test URL shows the `og:` tags; the picture addresses only work once the domain moves.

## Acceptance

- [ ] Open Graph on home and articles as above, absolute URLs.
- [ ] Live's descriptions on home, blog, calendar, notices and topic pages, editable in Pages CMS.
- [ ] `BlogPosting` microdata on articles.
- [ ] `npm test` green.

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** as above. **Architecture:** head partial additions driven by page data, an `ogImage` filter, microdata attributes on the article template, description fields in `.pages.yml`. **Tech Stack:** Eleventy 3, Nunjucks, sharp, Playwright, `node:test`. **Spec:** this document and [parity-check-feature.md](parity-check-feature.md).

### Global Constraints

- Description copy exactly as above. Absolute URLs from `site.url`. No inline script.

### Review Focus

- An article whose only picture is a hot-linked `https:` image: `og:image` uses it as is (unit test).
- An article with no summary: `og:description` falls back to the blog description (scenario).
- A description containing `"` or `&`: escaped in the meta tag (scenario with a fixture).
- A body image with a relative `/uploads/` path: made absolute (unit test).

---

### Task 1: Descriptions

**Files:** Modify `site/content/_index.md`, `site/content/{blog,calendar,notices}/_index.md`, `.pages.yml`, `partials/head.njk`, `site/pages/topics.njk` if topic pages need the section description passed. Test `tests/features/pages.feature`, `tests/features/editor.feature`.

- [ ] **Step 1: Failing scenarios**: each of `/`, `/blog`, `/calendar`, `/notices` and one topic page has `meta[name=description]` with the exact copy; `.pages.yml` exposes `description` labelled "Search description" for home and each section index.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Descriptions". Fixture `_index.md` files get the same values.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Restore live's search descriptions, editable in Pages CMS"`

### Task 2: Open Graph

**Files:** Modify `partials/head.njk`, `config/images.js` or `config/filters.js`. Test `tests/unit/images.test.mjs` or `filters.test.mjs`, `tests/features/blog.feature`, `tests/features/pages.feature`.

**Interfaces:** Produces async filter `ogImage(item | page data): string` (absolute URL).

- [ ] **Step 1: Failing tests**: unit for `ogImage` order (image field, first body image, stock picture) and absolute URLs. Scenarios: home has the five tags with `og:type` `website` and an `og:image` starting with `site.url`; a fixture article has `og:type` `article`, its title, summary and an absolute `og:url`; an article with no image gets a `generic` picture; a page like `/page/about/about-us` has no `og:` tags.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Open Graph".
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Add Facebook link previews for home and articles"`

### Task 3: Article markup

**Files:** Modify `sections/blog-item.njk`. Test `tests/features/blog.feature`.

- [ ] **Step 1: Failing scenario**: a fixture article has an element with `itemtype` `https://schema.org/BlogPosting` containing `itemprop` `headline` with the title, `datePublished` with `datetime` the date, `author` with the author name, and `articleBody` holding the body text.
- [ ] **Step 2: Run** `npm run test:bdd`. Expected: FAIL.
- [ ] **Step 3: Implement** per "Article markup".
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "Mark articles up as BlogPosting, as on live"`

### Finish

- [ ] `npm ci && npm test` green with Node 26. Push. Give the maintainer the manual step.
