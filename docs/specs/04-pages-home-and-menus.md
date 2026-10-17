---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 04: pages, home and menus

_One session. Adds the 14 standing pages under their live `/page/{type}/{slug}` URLs, the home page with its hero, notices and latest articles, a contact page placeholder, and menus built from content so Paul can add a page to the menu with a tick box. See the [design](../design-site-replacement.md) and [conventions](conventions.md)._

---

## Goal

The site has every live section. The header and footer menus come from the pages themselves. The root no longer redirects to `/notices`.

## Starting point

- Specs 02 and 03 on `main`. Menus come from static `[[menus.main]]` and `[[menus.footer]]` in `hugo.toml`.
- `site/static/staticwebapp.config.json` redirects `/` to `/notices/`. `site/layouts/home.html` is a stub.
- `picture.html` takes `{ src, alt, sizes, eager }`.
- Live home: hero with "St Paul's Warton" and the lead "Serving Christ - Serving the Community" on `PAGE-BACK.JPG`; "Church Notices" heading linking to `/notices`, every notice as a block with a navy left border, title and summary; "Latest Blog Articles" heading linking to `/blog`, the 3 newest articles as cards with a 350 by 300 cropped image, title, summary and "Read →".
- Live pages by type: about (about-us, contact-list, church-diary, privacy-policy, cookie-policy), services (regular-church-services, easter-services-2026), groups (church-groups), gallery (church-gallery, website-pictures), forms (st-pauls-forms), links (useful-links), community (community-news), safeguarding (safeguarding).
- Live menu order: Home, Blog, Calendar, About, Services, Groups, Community, Links, Gallery, Forms, Safeguarding. A type with one page in the menu is a plain link named after the type. A type with several is a dropdown.

## In scope

- `site/content/page/_index.md` and eight `page/{type}/_index.md` files (not rendered, hold the menu label and order).
- Page template, contact page placeholder at `/contact`, home page.
- `menu-items.html` and `footer-groups.html` rewritten to compute from pages. Static menus removed from `hugo.toml`.
- `picture.html` gains a `fill` option for cropped card images.
- Hero image `site/assets/images/hero.jpg` from the archive branch.
- Pages CMS: a "Pages" group with one collection per type, and a "Home page" file entry.
- Root redirect removed.

## Out of scope

Page content (spec 07 migrates it; this spec ships fixtures only, plus the structural `_index.md` files and the contact page). Embeds (06). Contact form (08). HTML site map (05).

---

## Requirements

### Structure

| File | Front matter |
|---|---|
| `site/content/page/_index.md` | `title: Pages`, `build: { render: never, list: always }` |
| `site/content/page/{type}/_index.md` | `title` (menu label), `weight`, `build: { render: never, list: always }` |
| `site/content/page/about/contact-us.md` | `title: Contact Us`, `url: /contact`, `layout: contact`, `header: true`, `footer: true`, `weight: 2`, body: a short intro |

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

Permalink: `page = '/page/:sections[1:]/:slugorcontentbasename/'`. These structural files are owned by the maintainer, excluded from Pages CMS, and are the one part of `site/content/` a test may check (that they exist with these titles and weights).

### Page front matter

`title`, `summary`, `header` (show in the top menu), `footer` (show in the footer), `weight` (order within its type, default 100), `image`, `image_alt`, `url` (hidden), `layout` (hidden), body.

### Templates

| Template | Requirements |
|---|---|
| `page/page.html` | Title (h1), summary as `.lead` when set, image when set, body in `.prose` |
| `contact.html` | As a page, then the church address from the footer and a link to `/page/about/contact-list`. Spec 08 adds the form |
| `home.html` | Hero: `<section class="hero">` with `picture.html` (`eager: true`, `sizes: 100vw`) of `hero_image` or else `images/hero.jpg`, `alt` from `hero_alt` or else empty with `role="presentation"`, the site title (h1) and `lead`. Then "Church Notices" (h2 linking to `/notices`) with every notice newest first as `<a class="home-notice">` holding title and summary. Then "Latest Blog Articles" (h2 linking to `/blog`) with the 3 newest articles as cards, image cropped with `fill: "350x300"`, title, summary, "Read →" link |

### Menus

`menu-items.html` returns, in order:

1. Home `/`, Blog `/blog`, Calendar `/calendar`.
2. For each page type in weight order, its pages with `header: true` in weight then title order. None: skip the type. One: a plain item named after the type, linking to the page. Several: an item named after the type with the pages as `children` (no `url`).

`footer-groups.html` returns:

1. "Links": Church Blog `/blog`, Church Calendar `/calendar`, Church Notices `/notices`, Site Map `/sitemap`, then `about` pages with `footer: true` in weight order.
2. For each other page type in weight order with any `footer: true` pages: a group titled after the type with those pages.

Both keep the shapes in the site contract, so `header.html` and `footer.html` do not change.

### `picture.html` addition

`fill` (optional, `"WxH"`): crop to that aspect with `.Fill`, generating WebP widths of 1x and 2x the given width (capped at the original), and use `W` by `H` for `width` and `height`.

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

Field labels: `header` "Show in the top menu", `footer` "Show in the footer", `weight` "Order in menu (lower comes first)", `image_alt` "Image description". Title has the same `pattern` as spec 03. `body` is `rich-text`, `format: html`. The YAML above is shorthand: write each field in full, and repeat the field list for all eight collections (no YAML anchors, to keep the plain text tests simple).

### Root

`staticwebapp.config.json` loses the `/` redirect. `responseOverrides` stays.

---

## Manual steps (maintainer)

1. After merge, open Pages CMS: check the Home page entry and the Pages group with eight collections. Tick "Show in the top menu" on a practice page and check it appears in the menu after the deploy, then delete it.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] Fixture pages render at `/page/{type}/{name}`, and `/page/about` and `/page` are not built.
- [ ] Menus built from the fixture match the live menu shape: plain items for one-page types, dropdowns for several, in live order.
- [ ] `/contact` renders the contact placeholder.
- [ ] Home shows the hero, every notice, and the 3 newest articles with cropped WebP images.
- [ ] `/` returns the home page with no redirect.
- [ ] `hugo.toml` has no `[[menus` entries.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standing pages at live URLs, a real home page, and menus that follow the content.

**Architecture:** Page types are unrendered sections whose `_index.md` carries the menu label and order. Pages opt into the header and footer with booleans, and two partials turn that into the same slices the shell already renders. The home page reuses `card.html` and `picture.html`.

**Tech Stack:** Hugo extended 0.167.0, Pages CMS config, Python 3 `unittest`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](conventions.md#global-constraints).
- Page type folder names, titles and weights exactly as in the Structure table.
- `menu-items.html` and `footer-groups.html` return exactly the shapes in the site contract. `header.html` and `footer.html` are not edited.
- The page type `_index.md` files and `contact-us.md` are the only files under `site/content/page/` this spec creates.

### Review Focus

1. Paul unticks "Show in the top menu" on every page of a type, or deletes the only page. Expected: that menu item disappears, no empty dropdown. Pinned by `test_type_with_no_menu_pages_is_skipped`.
2. Two pages with the same weight. Expected: stable order by title. Pinned by `test_equal_weights_sort_by_title`.
3. The home page with no notices or fewer than 3 articles. Expected: headings stay, nothing breaks, no empty cards. Pinned by `test_home_with_no_content`.
4. Paul sets a hero image and leaves its description empty. Expected: the image is treated as decorative, never `alt` missing. Pinned by `test_hero_alt_fallback`.
5. A new page created in a type folder that has no `_index.md` (a ninth type added by hand). Expected: the build still works and the page still renders. Pinned by `test_page_outside_known_types_still_builds`.

---

### Task 1: Page types, pages and contact placeholder

**Files:**
- Create: `site/content/page/_index.md`, `site/content/page/{about,services,groups,community,links,gallery,forms,safeguarding}/_index.md`, `site/content/page/about/contact-us.md`
- Modify: `site/hugo.toml` (page permalink)
- Create: `site/layouts/page/page.html`, `site/layouts/contact.html`
- Create fixtures under `tests/fixtures/content/page/`: `_index.md` and the eight type `_index.md` files copied from the real ones; `about/about-us.md` (`header: true`, `weight: 1`), `about/contact-us.md` (as the real one), `about/privacy-policy.md` (`header: true`, `footer: true`, `weight: 3`), `services/regular-church-services.md` and `services/easter-services-2026.md` (both `header: true`, `footer: true`, equal `weight: 1`), `groups/church-groups.md` (`header: true`, `footer: true`), `forms/hidden.md` (no flags), `extra/stray.md` (no `_index.md` in `extra/`)
- Create: `tests/test_pages.py`

**Interfaces:**
- Produces: URLs `/page/{type}/{name}` and `/contact`. Front matter `header`, `footer`, `weight` read by Task 2.

- [ ] **Step 1: Write the failing tests**

```python
def test_page_urls(self):
    for p in ("page/about/about-us", "page/services/easter-services-2026", "page/groups/church-groups"):
        self.assertTrue((self.out / p / "index.html").is_file(), p)

def test_type_sections_not_rendered(self):
    self.assertFalse((self.out / "page/index.html").exists())
    self.assertFalse((self.out / "page/about/index.html").exists())
    self.assertFalse((self.out / "page/index.xml").exists())

def test_contact_placeholder(self):
    html = (self.out / "contact/index.html").read_text()
    self.assertIn("<h1>Contact Us</h1>", html)
    self.assertIn("PR4 1BD", html)
    self.assertIn('href="/page/about/contact-list"', html)

def test_page_outside_known_types_still_builds(self):
    self.assertTrue(any(self.out.glob("page/**/stray/index.html")))

def test_real_page_types_exist(self):
    # Structural files, excluded from Pages CMS: the one allowed check on site/content.
    expected = {"about": ("About", 40), "services": ("Services", 50), "groups": ("Groups", 60),
                "community": ("Community", 70), "links": ("Links", 80), "gallery": ("Gallery", 90),
                "forms": ("Forms", 100), "safeguarding": ("Safeguarding", 110)}
    for t, (title, weight) in expected.items():
        text = (REPO / f"site/content/page/{t}/_index.md").read_text()
        self.assertIn(f"title: {title}", text)
        self.assertIn(f"weight: {weight}", text)
        self.assertIn("render: never", text)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_pages.py' -v`

- [ ] **Step 3: Write the structure files, permalink, `page/page.html` and `contact.html`**

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add standing pages under their live URLs and a contact placeholder"
```

---

### Task 2: Menus from content

**Files:**
- Modify: `site/layouts/_partials/menu-items.html`, `site/layouts/_partials/footer-groups.html`
- Modify: `site/hugo.toml` (delete every `[[menus.main]]` and `[[menus.footer]]`)
- Modify: `tests/test_layout.py` (build `FIXTURES / "content"` instead of an empty folder, so menus have pages)
- Create: `tests/test_menus.py`

**Interfaces:**
- Consumes: page front matter (Task 1), `href.html`.
- Produces: the same slice shapes as spec 02.

- [ ] **Step 1: Write the failing tests in `tests/test_menus.py`**

Build `FIXTURES / "content"`, read `404.html` (every page shares the shell). Extract the nav with `re.search(r'<nav id="site-nav".*?</nav>', page, re.S)`.

```python
def test_order_and_shape(self):
    top = self.nav.split('class="site-nav__list">', 1)[1]
    top = re.sub(r"<ul>.*?</ul>", "", top, flags=re.S)  # drop dropdown children
    names = re.findall(r"<a [^>]*>([^<]+)</a>|<summary>([^<]+)</summary>", top)
    self.assertEqual([a or b for a, b in names], ["Home", "Blog", "Calendar", "About", "Services", "Groups"])

def test_single_page_type_is_plain_link(self):
    self.assertIn('<a href="/page/groups/church-groups">Groups</a>', self.nav)

def test_several_pages_make_a_dropdown(self):
    about = re.search(r"<summary>About</summary>(.*?)</details>", self.nav, re.S).group(1)
    self.assertEqual(re.findall(r">([^<]+)</a>", about), ["About Us", "Contact Us", "Privacy Policy"])

def test_equal_weights_sort_by_title(self):
    svc = re.search(r"<summary>Services</summary>(.*?)</details>", self.nav, re.S).group(1)
    self.assertEqual(re.findall(r">([^<]+)</a>", svc), ["Easter Services 2026", "Regular Church Services"])

def test_type_with_no_menu_pages_is_skipped(self):
    self.assertNotIn(">Forms<", self.nav)

def test_footer_groups(self):
    foot = self.page.split("<footer", 1)[1]
    links = re.search(r">\s*Links\s*</h2>(.*?)</ul>", foot, re.S).group(1)
    self.assertEqual(re.findall(r'href="([^"]+)"', links),
                     ["/blog", "/calendar", "/notices", "/sitemap", "/contact", "/page/about/privacy-policy"])
    self.assertRegex(foot, r">\s*Services\s*</h2>")
    self.assertNotRegex(foot, r">\s*Forms\s*</h2>")

def test_no_static_menus_left(self):
    self.assertNotIn("[[menus", (REPO / "site/hugo.toml").read_text())
```

Remove `test_menu_matches_live`, `test_dropdowns_are_details` and `test_footer_groups_match_live` from `test_layout.py`: `test_menus.py` replaces them against fixtures.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_menus.py' -v`

- [ ] **Step 3: Rewrite the two partials and delete the static menus**

Find page types with `site.GetPage "/page"` then `.Sections.ByWeight`. Pages per type: `where .RegularPages "Params.header" true`, sorted by `weight` (default 100) then `title`. Contact's URL comes from its `url`, through `href.html`.

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Build header and footer menus from page settings"
```

---

### Task 3: Home page and hero

**Files:**
- Create: `site/content/_index.md` (`title: St Paul's Warton`, `lead: Serving Christ - Serving the Community`)
- Create: `site/assets/images/hero.jpg` (from `archive/umbraco-2019:StPauls.Web/Content/Image/PAGE-BACK.JPG`, byte for byte)
- Modify: `site/layouts/home.html`, `site/layouts/_partials/picture.html` (`fill`), `site/static/staticwebapp.config.json`
- Modify: `site/assets/css/50-components.css` (hero, home notices)
- Create: `tests/fixtures/content/_index.md` (same as the real one plus `hero_image: images/hero.jpg`, `hero_alt: ""`)
- Create: `tests/fixtures/home-empty/_index.md` and `tests/fixtures/home-empty/notices/_index.md` only
- Create: `tests/test_home.py`
- Modify: `tests/test_layout.py` (`test_swa_config`, `test_root_has_index_page`)

**Interfaces:**
- Consumes: `card.html` (spec 03), `picture.html`, notices and blog fixtures (spec 03).
- Produces: `picture.html` `fill` option, used again by spec 06.

- [ ] **Step 1: Write the failing tests in `tests/test_home.py`**

```python
def test_hero(self):
    hero = re.search(r'<section class="hero">.*?</section>', self.home, re.S).group(0)
    self.assertIn("<h1>St Paul&#39;s Warton</h1>", hero)
    self.assertIn("Serving Christ - Serving the Community", hero)
    img = re.search(r"<img [^>]*>", hero).group(0)
    self.assertNotIn('loading="lazy"', img)
    self.assertIn('alt=""', img)
    self.assertIn('role="presentation"', img)

def test_hero_alt_fallback(self):
    self.assertNotRegex(self.home, r"<img(?![^>]*\balt=)[^>]*>")

def test_every_notice_newest_first(self):
    titles = re.findall(r'<a class="home-notice" href="[^"]+">\s*<h3>([^<]+)</h3>', self.home)
    self.assertEqual(titles[:2], ["Fixture future", "Fixture newer"])

def test_three_latest_articles_cropped(self):
    cards = re.findall(r'<article class="card">.*?</article>', self.home.split("Latest Blog Articles", 1)[1], re.S)
    self.assertEqual(len(cards), 3)
    self.assertIn("Fixture article 8", cards[0])
    self.assertIn('width="350" height="300"', cards[0])

def test_home_with_no_content(self):
    # build tests/fixtures/home-empty
    self.assertIn("Church Notices", empty_home)
    self.assertIn("Latest Blog Articles", empty_home)
    self.assertNotIn('<article class="card">', empty_home)
```

In `test_layout.py`: `test_swa_config` asserts `cfg["routes"]` has no entry for `/`, and `test_root_has_index_page` asserts the home page has `<section class="hero">`.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_home.py' -v`

- [ ] **Step 3: Write the home content, copy the hero, add `fill`, write `home.html` and its CSS, drop the root redirect**

The hero image fills the section with `object-fit: cover` at about 50vh (live height), with the text on top. Keep text contrast at least 4.5:1 over the image with a navy overlay at the opacity needed.

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add the home page with hero, notices and latest articles"
```

---

### Task 4: Pages CMS for pages and home

**Files:**
- Modify: `.pages.yml`
- Modify: `tests/test_cms_config.py`

**Interfaces:**
- Consumes: page and home front matter.
- Produces: `home` entry and `pages` group with collections `page-about` to `page-safeguarding`. Spec 06 adds `embed` fields to them.

- [ ] **Step 1: Write the failing tests**

```python
TYPES = ["about", "services", "groups", "community", "links", "gallery", "forms", "safeguarding"]

def test_home_entry(self):
    b = block("home")
    self.assertIn("type: file", b)
    self.assertIn("path: site/content/_index.md", b)
    self.assertRegex(b, r"operations:\s*\{?\s*delete: false")

def test_pages_group_in_menu_order(self):
    self.assertRegex(CFG, r"- name: pages\n\s+label: Pages\n\s+type: group")
    order = re.findall(r"- name: page-([a-z]+)\n", CFG)
    self.assertEqual(order, TYPES)

def test_every_page_collection_has_the_same_fields(self):
    expected = ["title", "summary", "header", "footer", "weight", "image", "image_alt", "body", "url", "layout"]
    for t in TYPES:
        b = block(f"page-{t}")
        self.assertIn(f"path: site/content/page/{t}", b)
        self.assertIn('filename: "{primary}.md"', b)
        self.assertIn("exclude: [_index.md]", b)
        self.assertEqual(re.findall(r"(?m)^\s+- name: (\w+)$", b), expected)
        self.assertRegex(b, r"- name: url\n\s+type: string\n\s+hidden: true")
        self.assertRegex(b, r"- name: layout\n\s+type: string\n\s+hidden: true")
```

`block()` from spec 03 must also find entries nested under `items:` (indent 6). Widen its split regex to `r"(?m)^\s+- name: "` and look up by the name at the start of each piece.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_cms_config.py' -v`

- [ ] **Step 3: Write the entries in `.pages.yml`**

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit and push**

```bash
git add .pages.yml tests
git commit -m "Add pages and home page to Pages CMS"
git push -u origin <session branch>
```

Tell the maintainer the Pages CMS check is theirs after merge.
