---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: done
---

# Spec 04: pages, home and menus

_One session. Adds the 14 standing pages under their live `/page/{type}/{slug}` URLs, the home page with its hero, notices and latest articles, a contact page placeholder, and menus built from content so Paul can add a page to the menu with a tick box. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

The site has every live section. The header and footer menus come from the pages themselves. The root no longer redirects to `/notices`.

## Starting point

- Specs 00 to 03 on `main`, on Eleventy 3.1.6 (Node 26). Hugo is gone.
- `config/content.js` publishes only `blog/`, `calendar/` and `notices/` through `itemPermalink(inputPath, data)`. Every other `.md` in the content folder gets `permalink: false`. `sectionOf` already gives `''` for a file at the content root.
- Menus come from `site/data/menus.yaml` (`main` and `footer`), read as the global `menus` by `partials/header.njk` and `partials/footer.njk`.
- `/` is `site/pages/home.njk`, a stub, and `config/swa.js` writes a `/` redirect to `/notices/` into `staticwebapp.config.json`.
- `content.njk` picks `sections/{section}-list.njk` or `sections/{section}-item.njk`. A content file that sets its own `layout` skips that dispatch.
- `picture` (async shortcode, `config/images.js`) takes `{ src, alt, sizes, eager }` with `src` under `site/assets/`. `pictureHtml(opts, { assets, out })` is its testable core.
- Live home: hero with "St Paul's Warton" and the lead "Serving Christ - Serving the Community" on `PAGE-BACK.JPG`; "Church Notices" heading linking to `/notices`, every notice as a block with a navy left border, title and summary; "Latest Blog Articles" heading linking to `/blog`, the 3 newest articles as cards with a 350 by 300 cropped image, title, summary and "Read →".
- Live pages by type: about (about-us, contact-list, church-diary, privacy-policy, cookie-policy), services (regular-church-services, easter-services-2026), groups (church-groups), gallery (church-gallery, website-pictures), forms (st-pauls-forms), links (useful-links), community (community-news), safeguarding (safeguarding).
- Live menu order: Home, Blog, Calendar, About, Services, Groups, Community, Links, Gallery, Forms, Safeguarding. A type with one page in the menu is a plain link named after the type. A type with several is a dropdown.

## In scope

- `site/content/page/_index.md` and eight `page/{type}/_index.md` files (not rendered, hold the menu label and order).
- `itemPermalink` for the home page, pages and root files with a `url`. Collections `pageTypes` and `pages`.
- Page template, contact page placeholder at `/contact`, home page.
- `config/menus.js` with `menuItems(collections)` and `footerGroups(collections)`, replacing `site/data/menus.yaml`.
- `picture` gains a `fill` option for cropped card images.
- Hero image `site/assets/images/hero.jpg` from the archive branch.
- Pages CMS: a "Pages" group with one collection per type, and a "Home page" file entry.
- `site/pages/home.njk` and the root redirect removed.

## Out of scope

Page content (spec 07 migrates it; this spec ships fixtures only, plus the structural `_index.md` files and the contact page). Embeds (06). Contact form (08). HTML site map (05).

---

## Requirements

### Structure

| File | Front matter |
|---|---|
| `site/content/page/_index.md` | `title: Pages` |
| `site/content/page/{type}/_index.md` | `title` (menu label), `weight` |
| `site/content/page/about/contact-us.md` | `title: Contact Us`, `url: /contact`, `layout: contact.njk`, `header: true`, `footer: true`, `weight: 2`, body: a short intro |
| `site/content/_index.md` | `title: St Paul's Warton`, `lead: Serving Christ - Serving the Community` |

| Type | `title` | `weight` |
|---|---|---|
| `about` | About | 40 |
| `services` | Services | 50 |
| `groups` | Groups | 60 |
| `community` | Community | 70 |
| `links` | Links | 80 |
| `gallery` | Gallery | 90 |
| `forms` | Forms | 100 |
| `safeguarding` | Safeguarding | 110 |

The structural files are owned by the maintainer, excluded from Pages CMS, and are the one part of `site/content/` a test may check (that they exist with these titles and weights).

### URLs (`itemPermalink` in `config/content.js`)

| Input | Output |
|---|---|
| `_index.md` at the content root | `/index.html` |
| `page/_index.md`, `page/{type}/_index.md` | `false` (not rendered, no feed) |
| `page/{type}/{name}.md` with `url` | `{url}/index.html` (trailing slash trimmed, as for items) |
| `page/{type}/{name}.md` | `/page/{type}/{name}/index.html` |
| Any other file at the content root, with `url` | `{url}/index.html`. Without `url`: `false`. Spec 05 (`sitemap.md`) and spec 08 (`contact-thanks.md`) rely on this |
| `blog/`, `calendar/`, `notices/` | Unchanged |

A page in a folder with no `_index.md` (a ninth type added by hand) still gets `/page/{type}/{name}`. It is only left out of the menus.

### Collections

| Collection | Holds | Order |
|---|---|---|
| `pageTypes` | `page/*/_index.md` | Eleventy's default. Menus sort them |
| `pages` | `page/*/*.md`, no `_index.md` | Eleventy's default. Menus sort them |

### Page front matter

`title`, `summary`, `header` (show in the top menu), `footer` (show in the footer), `weight` (order within its type, default 100), `image`, `image_alt`, `url` (hidden), `layout` (hidden), body.

### Templates

| Template | Requirements |
|---|---|
| `content.njk` | Root `_index.md`: `sections/home.njk`. Any other file outside `blog/`, `calendar/` and `notices/`: `sections/page.njk`. The section dispatch stays as it is for the three dated sections |
| `sections/page.njk` | Title (h1), summary as `.lead` when set, image through `partials/image.njk` when set, body in `.prose` |
| `contact.njk` | Extends `base.njk`. As a page, then the church address (as in the footer) and a link "Church contact list" to `/page/about/contact-list`. Spec 08 adds the form |
| `sections/home.njk` | Hero: `<section class="hero">` with `picture` (`eager: true`, `sizes: '100vw'`) of `hero_image | assetPath` or else `images/hero.jpg`, so a Pages CMS `/uploads/...` value falls back to the default hero until spec 06 lets `picture` read uploads, `alt` from `hero_alt` or else `""` (decorative), the site title (h1) and `lead`. Then "Church Notices" (h2 linking to `/notices`) with every notice newest first as `<a class="home-notice">` holding an `h3` title and the summary. Then "Latest Blog Articles" (h2 linking to `/blog`) with the 3 newest articles as `partials/card.njk`, image cropped with `fill: '350x300'`, title, summary, "Read →" link |

`card.njk` passes `fill` to `picture` when the including template sets `cardFill`. Cards stay inside `asyncEach`, and `ifAsync` guards the picture (see [Eleventy facts](page-cms-spec-conventions.md#eleventy-316)).

The live hero `<img>` also carried `role="presentation"`. It is not carried over: `alt=""` already marks an image as decorative.

### Menus (`config/menus.js`)

Two pure functions, named exports and Nunjucks filters. Both take the `collections` object and read only `collections.pageTypes` and `collections.pages`. The type of a page or page type is the folder name after `page/` in its computed `section`. URLs go through `href`.

`menuItems(collections)` returns, in order:

1. `{ name: 'Home', url: '/' }`, `{ name: 'Blog', url: '/blog' }`, `{ name: 'Calendar', url: '/calendar' }`.
2. For each page type in `weight` order (then title), its pages with `header: true` in `weight` (default 100) then title order. None: skip the type. One: `{ name: <type title>, url }`. Several: `{ name: <type title>, children: [{ name: <page title>, url }] }` (no `url`).

`footerGroups(collections)` returns:

1. `{ title: 'Links', links }`: Church Blog `/blog`, Church Calendar `/calendar`, Church Notices `/notices`, Site Map `/sitemap`, then `about` pages with `footer: true` in weight then title order.
2. For each other page type in weight order with any `footer: true` pages: `{ title: <type title>, links }` with those pages.

The shapes are those `menus.main` and `menus.footer` have today, so the loop bodies in `header.njk` and `footer.njk` do not change. Only their source does: `{% for item in collections | menuItems %}` and `{% for group in collections | footerGroups %}`. `site/data/menus.yaml` is deleted.

### `picture` addition

`fill` (optional, `'WxH'`): crop to that aspect with sharp (`fit: 'cover'`), generate widths of 1x and 2x `W` (capped at the source width, as other widths are), and use `W` by `H` for the `<img>` `width` and `height`. The cache key includes `fill`, so a cropped and an uncropped copy of the same source never collide.

### Pages CMS

```yaml
content:
  - name: home
    label: Home page
    type: file
    path: site/content/_index.md
    operations: { delete: false }
    fields: [title (string, required), lead (string), hero_image (image), hero_alt (string)]
  - name: pages
    label: Pages
    type: group
    items:
      - name: page-about        # one per type, in the weight order above
        label: About
        type: collection
        path: site/content/page/about
        filename: "{primary}.md"
        exclude: [_index.md]
        operations: { rename: false }
        fields: [title, summary, header, footer, weight, image, image_alt, body, url (hidden), layout (hidden)]
```

Field labels: `header` "Show in the top menu", `footer` "Show in the footer", `weight` "Order in menu (lower comes first)", `image_alt` "Image description". Title has the same `pattern` as spec 03. `body` is `rich-text`, `format: html`. The YAML above is shorthand: write each field in full, and repeat the field list for all eight collections (no YAML anchors, so the config reads plainly).

### Root

`buildSwaConfig` loses the `/` redirect, so `routes` is empty until spec 05. `responseOverrides` stays. `site/pages/home.njk` is deleted: the root `_index.md` writes `/index.html`.

---

## Manual steps (maintainer)

1. After merge, open Pages CMS: check the Home page entry and the Pages group with eight collections. Tick "Show in the top menu" on a practice page and check it appears in the menu after the deploy, then delete it.

---

## Acceptance

- [x] `npm test` passes.
- [x] Fixture pages render at `/page/{type}/{name}`, and `/page/about` and `/page` are not built.
- [x] Menus built from the fixture match the live menu shape: plain items for one-page types, dropdowns for several, in live order.
- [x] `/contact` renders the contact placeholder.
- [x] Home shows the hero, every notice, and the 3 newest articles with cropped WebP images.
- [x] `/` returns the home page with no redirect.
- [x] `site/data/menus.yaml` and `site/pages/home.njk` are gone.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standing pages at live URLs, a real home page, and menus that follow the content.

**Architecture:** Page types are unrendered `_index.md` files whose front matter carries the menu label and order, gathered in a `pageTypes` collection. Pages opt into the header and footer with booleans, and two pure functions in `config/menus.js` turn the `pageTypes` and `pages` collections into the same shapes the shell already renders. The home page is the root `_index.md`, dispatched by `content.njk`, and reuses `card.njk` and `picture`.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, sharp, Pages CMS config, `node:test`, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Page type folder names, titles and weights exactly as in the Structure table.
- `menuItems` and `footerGroups` return exactly the shapes in the site contract. Only the `for` lines of `header.njk` and `footer.njk` change.
- The page type `_index.md` files, `page/_index.md`, `contact-us.md` and the root `_index.md` are the only files under `site/content/` this spec creates.

### Review Focus

1. Paul unticks "Show in the top menu" on every page of a type, or deletes the only page. Expected: that menu item disappears, no empty dropdown. Pinned by the `menuItems` test "a type with no menu pages is skipped".
2. Two pages with the same weight. Expected: stable order by title. Pinned by the `menuItems` test "equal weights sort by title" and the "Services" menu scenario.
3. The home page with no notices or fewer than 3 articles. Expected: headings stay, nothing breaks, no empty cards. Pinned by the scenario "The home page with no content" on the empty site.
4. Paul sets a hero image and leaves its description empty. Expected: the image is decorative (`alt=""`), never `alt` missing. Pinned by the scenario "Every image on the home page has a description".
5. A new page created in a type folder that has no `_index.md` (a ninth type added by hand). Expected: the build still works and the page still renders. Pinned by the scenario "A page outside the known types still builds" and the `menuItems` test "a page without a type is left out".

---

### Task 1: Page types, pages and contact placeholder

**Files:**
- Create: `site/content/page/_index.md`, `site/content/page/{about,services,groups,community,links,gallery,forms,safeguarding}/_index.md`, `site/content/page/about/contact-us.md`
- Modify: `config/content.js` (permalinks, `pageTypes` and `pages` collections)
- Modify: `site/_includes/content.njk` (page dispatch)
- Create: `site/_includes/sections/page.njk`, `site/_includes/contact.njk`
- Create fixtures under `tests/fixtures/content/page/`: `_index.md` and the eight type `_index.md` files copied from the real ones; `about/about-us.md` (`header: true`, `weight: 1`, `summary: About summary`, body `<p>About body.</p>`), `about/contact-us.md` (as the real one), `about/privacy-policy.md` (`header: true`, `footer: true`, `weight: 3`), `services/regular-church-services.md` and `services/easter-services-2026.md` (both `header: true`, `footer: true`, equal `weight: 1`), `groups/church-groups.md` (`header: true`, `footer: true`), `gallery/church-gallery.md` (`header: true`, `footer: true`, `weight: 1`) and `gallery/website-pictures.md` (`header: true`, `weight: 2`), `forms/hidden.md` (no flags), `extra/stray.md` (no `_index.md` in `extra/`)
- Create: `tests/features/pages.feature`
- Modify: `tests/steps/pages.js` (one step for the structural files)
- Modify: `tests/unit/topics.test.mjs` or create `tests/unit/content.test.mjs` (`itemPermalink` cases)

The gallery fixtures keep the "Gallery" dropdown that `menu.feature` opens today.

**Interfaces:**
- Consumes: `itemPermalink`, `sectionOf`, `isIndex` (spec 03), `partials/image.njk`, `base.njk`.
- Produces: URLs `/page/{type}/{name}` and `/contact`, collections `pageTypes` and `pages`, includes `sections/page.njk` and `contact.njk`. Front matter `header`, `footer`, `weight` read by Task 2. Root files with a `url`, used by specs 05 and 08.

- [ ] **Step 1: Write the failing tests**

`tests/unit/content.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemPermalink } from '../../config/content.js';

const at = (p) => `site/content/${p}`;

test('pages publish under /page/{type}/{name}, page types and the pages root do not', () => {
  assert.equal(itemPermalink(at('page/about/about-us.md'), {}), '/page/about/about-us/index.html');
  assert.equal(itemPermalink(at('page/about/contact-us.md'), { url: '/contact' }), '/contact/index.html');
  assert.equal(itemPermalink(at('page/about/_index.md'), {}), false);
  assert.equal(itemPermalink(at('page/_index.md'), {}), false);
  assert.equal(itemPermalink(at('page/extra/stray.md'), {}), '/page/extra/stray/index.html');
});

test('the root index is the home page, other root files need a url', () => {
  assert.equal(itemPermalink(at('_index.md'), {}), '/index.html');
  assert.equal(itemPermalink(at('sitemap.md'), { url: '/sitemap' }), '/sitemap/index.html');
  assert.equal(itemPermalink(at('stray.md'), {}), false);
});
```

`tests/features/pages.feature`:

```gherkin
Feature: Pages
  Standing pages at their live URLs, the contact page and the home page.

  Scenario: Pages keep their live URLs
    Then "/page/about/about-us" exists
    And "/page/services/easter-services-2026" exists
    And "/page/groups/church-groups" exists

  Scenario: Page types and the pages root are not pages
    Then "/page/about" does not exist
    And "/page" does not exist

  Scenario: A page
    When I open "/page/about/about-us"
    Then the page heading is "About Us"
    And the summary "About summary" is the lead
    And I see "About body."

  Scenario: The contact placeholder
    When I open "/contact"
    Then the page heading is "Contact Us"
    And I see "PR4 1BD"
    And the "Church contact list" link goes to "/page/about/contact-list"

  Scenario: A page outside the known types still builds
    Then "/page/extra/stray" exists

  Scenario: The page types match live
    Then the real page types are, in order:
      | about        | About        | 40  |
      | services     | Services     | 50  |
      | groups       | Groups       | 60  |
      | community    | Community    | 70  |
      | links        | Links        | 80  |
      | gallery      | Gallery      | 90  |
      | forms        | Forms        | 100 |
      | safeguarding | Safeguarding | 110 |
```

New step in `tests/steps/pages.js`: "the real page types are, in order:" parses `site/content/page/{type}/_index.md` front matter with `yaml` for each row and checks `title` and `weight`. Structural files only, as the conventions allow.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "Pages"`
Expected: FAIL. `itemPermalink` returns `false` for pages and the root, and the page URLs are 404.

- [ ] **Step 3: Write the structure files, the permalink rules, the collections, `content.njk`, `sections/page.njk` and `contact.njk`**

`pageTypes` uses `api.getFilteredByGlob(`${CONTENT_DIR}/page/*/_index.md`)`, `pages` uses `page/*/*.md` without `_index.md`. The address in `contact.njk` is copied from `partials/footer.njk` for now; spec 08 moves both to settings.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test`
Expected: all pass. The home stub still serves `/` until Task 3.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Add standing pages under their live URLs and a contact placeholder"
```

---

### Task 2: Menus from content

**Files:**
- Create: `config/menus.js`
- Modify: `site/_includes/partials/header.njk`, `site/_includes/partials/footer.njk` (the `for` lines only)
- Delete: `site/data/menus.yaml`
- Create: `tests/unit/menus.test.mjs`
- Modify: `tests/features/menu.feature`, `tests/steps/menu.js`

**Interfaces:**
- Consumes: `pageTypes`, `pages` (Task 1), `href` (`config/filters.js`).
- Produces: `menuItems(collections): Array<{ name, url } | { name, children: Array<{ name, url }> }>` and `footerGroups(collections): Array<{ title, links: Array<{ name, url }> }>`, named exports and filters. Spec 05's HTML site map and spec 08's footer use them.

- [ ] **Step 1: Write the failing tests**

`tests/unit/menus.test.mjs` builds plain collection objects, so no Eleventy run is needed:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menuItems, footerGroups } from '../../config/menus.js';

const type = (t, title, weight) => ({ data: { section: `page/${t}`, title, weight } });
const page = (t, name, data) => ({ url: data.url ? `${data.url}/` : `/page/${t}/${name}/`, data: { section: `page/${t}`, ...data } });

const collections = {
  pageTypes: [type('groups', 'Groups', 60), type('about', 'About', 40), type('services', 'Services', 50), type('forms', 'Forms', 100)],
  pages: [
    page('about', 'privacy-policy', { title: 'Privacy Policy', header: true, footer: true, weight: 3 }),
    page('about', 'about-us', { title: 'About Us', header: true, weight: 1 }),
    page('about', 'contact-us', { title: 'Contact Us', url: '/contact', header: true, footer: true, weight: 2 }),
    page('services', 'regular-church-services', { title: 'Regular Church Services', header: true, footer: true, weight: 1 }),
    page('services', 'easter-services-2026', { title: 'Easter Services 2026', header: true, footer: true, weight: 1 }),
    page('groups', 'church-groups', { title: 'Church Groups', header: true, footer: true }),
    page('forms', 'hidden', { title: 'Hidden' }),
    page('extra', 'stray', { title: 'Stray', header: true, footer: true }),
  ],
};

test('fixed items, then page types in weight order', () => {
  assert.deepEqual(menuItems(collections).map((i) => i.name), ['Home', 'Blog', 'Calendar', 'About', 'Services', 'Groups']);
});

test('a type with one menu page is a plain link named after the type', () => {
  assert.deepEqual(menuItems(collections).find((i) => i.name === 'Groups'), { name: 'Groups', url: '/page/groups/church-groups' });
});

test('a type with several menu pages is a dropdown in weight order, without a url', () => {
  const about = menuItems(collections).find((i) => i.name === 'About');
  assert.equal(about.url, undefined);
  assert.deepEqual(about.children, [
    { name: 'About Us', url: '/page/about/about-us' },
    { name: 'Contact Us', url: '/contact' },
    { name: 'Privacy Policy', url: '/page/about/privacy-policy' },
  ]);
});

test('equal weights sort by title', () => {
  const services = menuItems(collections).find((i) => i.name === 'Services');
  assert.deepEqual(services.children.map((c) => c.name), ['Easter Services 2026', 'Regular Church Services']);
});

test('a type with no menu pages is skipped, and a page without a type is left out', () => {
  const names = JSON.stringify(menuItems(collections));
  assert.doesNotMatch(names, /Forms|Stray/);
});

test('a page with no weight sorts as 100', () => {
  const c = { pageTypes: [type('links', 'Links', 80)], pages: [page('links', 'b', { title: 'B', header: true, weight: 50 }), page('links', 'a', { title: 'A', header: true })] };
  assert.deepEqual(menuItems(c).at(-1).children.map((x) => x.name), ['B', 'A']);
});

test('footer: Links first with the about pages, then each type with footer pages', () => {
  const groups = footerGroups(collections);
  assert.deepEqual(groups.map((g) => g.title), ['Links', 'Services', 'Groups']);
  assert.deepEqual(groups[0].links.map((l) => l.url), ['/blog', '/calendar', '/notices', '/sitemap', '/contact', '/page/about/privacy-policy']);
});
```

In `tests/features/menu.feature`, add:

```gherkin
  Scenario: The menu follows the pages
    When I open "/notices"
    And I press the menu button
    Then the main menu items are, in order:
      | Home     |
      | Blog     |
      | Calendar |
      | About    |
      | Services |
      | Groups   |
      | Gallery  |
    And the "Groups" link goes to "/page/groups/church-groups" in the menu
    And the "About" menu lists, in order:
      | About Us       |
      | Contact Us     |
      | Privacy Policy |
    And the "Services" menu lists, in order:
      | Easter Services 2026    |
      | Regular Church Services |

  Scenario: The footer follows the pages
    When I open "/notices"
    Then the footer groups are, in order:
      | Links    |
      | Services |
      | Groups   |
      | Gallery  |
    And the "Links" footer group links to, in order:
      | /blog                      |
      | /calendar                  |
      | /notices                   |
      | /sitemap                   |
      | /contact                   |
      | /page/about/privacy-policy |
```

New steps in `tests/steps/menu.js`: "the main menu items are, in order:" (top-level `summary` and `a` texts of `.site-nav__list > li`), "the {string} link goes to {string} in the menu", "the {string} menu lists, in order:", "the footer groups are, in order:" and "the {string} footer group links to, in order:". The existing menu scenarios (About, Services and Gallery dropdowns, Privacy Policy in About) now run against menus built from the fixtures.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "menu|footer"`
Expected: FAIL. `config/menus.js` does not exist, and the menus still come from `menus.yaml`.

- [ ] **Step 3: Write `config/menus.js`, change the two `for` lines and delete `menus.yaml`**

The type of a page is `section.split('/')[1]`. Sort with `(a.data.weight ?? 100) - (b.data.weight ?? 100) || a.data.title.localeCompare(b.data.title)`. The fixed items and the Links group's fixed links are constants in the module.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Build header and footer menus from page settings"
```

---

### Task 3: Home page and hero

**Files:**
- Create: `site/content/_index.md` (`title: St Paul's Warton`, `lead: Serving Christ - Serving the Community`)
- Create: `site/assets/images/hero.jpg` (from `archive/umbraco-2019:StPauls.Web/Content/Image/PAGE-BACK.JPG`, byte for byte)
- Create: `site/_includes/sections/home.njk`
- Modify: `site/_includes/content.njk` (home dispatch), `site/_includes/partials/card.njk` (`cardFill`), `config/images.js` (`fill`), `config/swa.js` (no `/` redirect)
- Delete: `site/pages/home.njk`
- Modify: `site/assets/css/50-components.css` (hero, home notices)
- Create: `tests/fixtures/content/_index.md` (same as the real one plus `hero_image: images/hero.jpg`, `hero_alt: ""`), `tests/fixtures/empty/_index.md` (same as the real one)
- Modify: `tests/features/pages.feature`, `tests/steps/pages.js`, `tests/unit/images.test.mjs`, `tests/unit/swa-config.test.mjs`

**Interfaces:**
- Consumes: `card.njk`, `newestFirst` (spec 03), `picture`, notices and blog fixtures (spec 03).
- Produces: `picture` `fill` option, used again by spec 06. Include `sections/home.njk`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/images.test.mjs`, with the existing 1000 by 500 test PNG:

```js
test('fill crops to the aspect and sizes the img to it', async () => {
  const html = await pictureHtml({ src: 'images/t.png', alt: 'T', fill: '350x300' }, { assets: tmp, out });
  assert.match(html, /-350\.\w{8}\.webp 350w, [^"]*-700\.\w{8}\.webp 700w"/);
  assert.match(html, / width="350" height="300"/);
  const file = /src="([^"]*\.png)"/.exec(html)[1];
  const meta = await sharp(join(out, file)).metadata();
  assert.equal(meta.width / meta.height, 350 / 300);
});

test('a cropped and an uncropped copy of one source do not collide', async () => {
  const plain = await pictureHtml({ src: 'images/t.png', alt: 'T' }, { assets: tmp, out });
  const cropped = await pictureHtml({ src: 'images/t.png', alt: 'T', fill: '350x300' }, { assets: tmp, out });
  assert.notEqual(/src="([^"]+)"/.exec(plain)[1], /src="([^"]+)"/.exec(cropped)[1]);
});
```

`tests/unit/swa-config.test.mjs`: "it holds the same content as the old static file" becomes "the root is served, not redirected", asserting no route has `route: '/'` and `routes` is `[]`.

Add to `tests/features/pages.feature`:

```gherkin
  Scenario: The home page
    When I open "/"
    Then the hero shows "St Paul's Warton" and "Serving Christ - Serving the Community"
    And the hero image loads straight away
    And the "Church Notices" link goes to "/notices"
    And the home notices are, in order:
      | Fixture future   |
      | Fixture newer    |
      | Fixture older    |
      | Fixture migrated |
    And the cards are, in order:
      | Fixture article 8 |
      | Fixture article 7 |
      | Fixture article 6 |
    And the "Fixture article 8" card image is 350 by 300

  Scenario: Every image on the home page has a description
    When I open "/"
    Then every image on the page has an alt attribute

  Scenario: The home page with no content
    When I open "/" on the empty site
    Then I see "Church Notices"
    And I see "Latest Blog Articles"
    And there are no cards
```

The notices table lists the first four only: the step checks that the page starts with them in that order. New steps in `tests/steps/pages.js`: "the hero shows {string} and {string}" (`.hero h1` and `.hero` text), "the hero image loads straight away" (`.hero img` has no `loading` attribute), "the home notices are, in order:" (`.home-notice h3`, leading rows), "the {string} card image is {int} by {int}" (the card's `img` `width` and `height`), "every image on the page has an alt attribute" (spec 09 reuses it), "there are no cards".

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "home|Home"`
Expected: FAIL. `fill` is ignored, `/` is the stub, and `staticwebapp.config.json` still redirects `/`.

- [ ] **Step 3: Write the home content, copy the hero, add `fill`, write `sections/home.njk` and its CSS, drop the stub and the root redirect**

The hero image fills the section with `object-fit: cover` at about 50vh (live height), with the text on top. Keep text contrast at least 4.5:1 over the image with a navy overlay at the opacity needed. No inline `style`.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass. "No personal details or trackers" now checks the real home page at `/`.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Add the home page with hero, notices and latest articles"
```

---

### Task 4: Pages CMS for pages and home

**Files:**
- Modify: `.pages.yml`
- Modify: `tests/features/editor.feature`, `tests/steps/editor.js`

**Interfaces:**
- Consumes: page and home front matter.
- Produces: `home` entry and `pages` group with collections `page-about` to `page-safeguarding`. Spec 06 adds `embed` fields to them, spec 08 adds `settings`, spec 10 orders the sidebar.

- [ ] **Step 1: Write the failing scenarios**

```gherkin
  Scenario: The home page is one entry Paul cannot delete
    Then the "home" entry edits the file "site/content/_index.md"
    And the "home" entry has the fields "title, lead, hero_image, hero_alt"

  Scenario: Pages are grouped by type in menu order
    Then the "pages" group holds, in order:
      | page-about        |
      | page-services     |
      | page-groups       |
      | page-community    |
      | page-links        |
      | page-gallery      |
      | page-forms        |
      | page-safeguarding |
    And every page collection saves to its type folder with the fields "title, summary, header, footer, weight, image, image_alt, body, url, layout"
    And the "page-about" collection has a hidden "url" field
    And the "page-about" collection has a hidden "layout" field
```

In `tests/steps/editor.js`, `collection(cfg, name)` and the rich text and title steps look through the `items` of a `group` entry too: add a helper that flattens `cfg.content` into its collections and files. New steps: "the {string} entry edits the file {string}" (`type: file`, `path`, `operations.delete === false`), "the {string} entry has the fields {string}", "the {string} group holds, in order:", and "every page collection saves to its type folder with the fields {string}" (`path` `site/content/page/{type}`, `filename` `{primary}.md`, `exclude` `[_index.md]`, `operations.rename === false`, field names in that order). The existing "every rich text field saves HTML" and title pattern scenarios then cover the page collections and the home entry as well.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:bdd -- --grep "Pages CMS"`
Expected: FAIL on the new scenarios.

- [ ] **Step 3: Write the entries in `.pages.yml`**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass, including "Whatever Paul has saved builds".

- [ ] **Step 5: Commit**

```bash
git add .pages.yml tests
git commit -m "Add pages and home page to Pages CMS"
git push -u origin <session branch>
```

Tell the maintainer the Pages CMS check is theirs after merge.
