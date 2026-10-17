---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 02: layout and stylesheet

_One session. Replaces the copied Bootstrap 3 and legacy CSS with one small stylesheet that keeps the live look, and builds the shared shell every later page uses: header, menu, footer, typography, cards. Applied to Notices and the 404 page. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

On a phone, the new shell reads better than live, with clear spacing, a big labelled menu button and nothing breaking out of the column, while looking like the same site. It ships about 25 KB of CSS and under 2 KB of script, and needs no script to navigate.

## Starting point

- Spec 00 on `main`: `site/layouts/baseof.html` links `/Content/bootstrap.css` (134 KB) and `/Content/Site.css` copied from `archive/umbraco-2019`. Header has one link. Footer has the "Find Us" column. Notices list and single pages use Bootstrap classes.
- The live CSS is the source of truth for the look, not the archive copy. Fetch it with `curl -sS "$(curl -sS http://stpaulswarton.co.uk/ | grep -o '/Areas/St_Pauls/Content/css?v=[^"]*' | head -1 | sed 's#^#http://stpaulswarton.co.uk#')"`.
- Live palette and type, read from that CSS on 2026-10-17:

| Use | Live value |
|---|---|
| Navbar background, headings, notice left border | `#002060` navy |
| Navbar bottom border, links, menu hover | `#c8a85a` gold |
| Body text | `#222`, Century Gothic stack, 16 px, line height 1.43 |
| Page background | `#fdfdf7` |
| Menu link text | `#efefef` on navy |
| Footer | `#0c0c0e` background, `#fff` text |
| Dates | `#be6700` |
| Muted text | `#777` |
| Panel heading, hover | `#f5f5f5`, `#ffdf89` |
| Headings | weight 600, line height 1.1 |

- Live menu (2026-10-17): Home, Blog, Calendar, About (About Us, Contact Us, Privacy Policy, Cookie Policy), Services (Regular Church Services, Easter Services 2026), Groups, Community, Links, Gallery (Church Gallery, Website Pictures), Forms, Safeguarding. Register and Login are dropped.
- Live footer: a Links group (Church Blog, Church Calendar, Church Notices, Contact Us, Site Map, Privacy Policy, Cookie Policy), one group per page type with its pages, and the Find Us column (map, address, Facebook).

## In scope

- One stylesheet from `site/assets/css/` (Hugo Pipes: concatenate, minify, fingerprint, SRI). Bootstrap and `Site.css` deleted.
- Design tokens as CSS custom properties, with the live palette. Text colours that fail WCAG AA darkened as little as needed.
- Readability: type scale, line height, line length, spacing, images and iframes that never overflow.
- New `baseof.html`, `head.html`, `header.html`, `footer.html`. Skip link. Favicon.
- Menu: a "Menu" toggle at least 44 by 44 px that works without script (`:target`) and is enhanced by `site.js`. Dropdowns are `<details>` elements, so they work without script too.
- `href.html`, `menu-items.html`, `footer-groups.html` and `picture.html` partials (see [site contract](page-cms-spec-conventions.md#partials-in-sitelayouts_partials)). In this spec the menu and footer come from static `[menus]` entries in `hugo.toml`, matching live. Spec 04 computes them from content.
- Notices list, notice page and 404 restyled with the new shell.
- `scripts/screenshots.py` for side-by-side screenshots of live and new, used for sign-off.

## Out of scope

Home page and hero (spec 04), other sections (03, 04), URL changes (03, 05), image pipeline for uploads (06), security headers (09). The root redirect to `/notices/` stays until spec 04.

---

## Requirements

### Tokens (`site/assets/css/10-tokens.css`)

| Token | Value | Notes |
|---|---|---|
| `--navy` | `#002060` | |
| `--gold` | `#c8a85a` | Borders, decoration, text on navy or the footer |
| `--gold-text` | darkest needed | Link text on `--surface` and `--page`. At least 4.5:1 on both. Start from `#c8a85a`, darken lightness only |
| `--text` | `#222222` | |
| `--muted` | `#767676` | Live `#777` is 4.48:1 on white |
| `--date` | darkest needed | From `#be6700`, at least 4.5:1 on `--surface` |
| `--page` | `#fdfdf7` | |
| `--surface` | `#ffffff` | Cards |
| `--panel` | `#f5f5f5` | |
| `--highlight` | `#ffdf89` | Hover background |
| `--border` | `#dddddd` | |
| `--nav-text` | `#efefef` | |
| `--footer-bg` | `#0c0c0e` | |
| `--footer-text` | `#ffffff` | |
| `--font` | `'Century Gothic', CenturyGothic, AppleGothic, 'Muli', sans-serif` | |
| `--measure` | `70ch` | Maximum line length for body text |

Every change from a live value is listed in a comment next to the token, with the live value and the contrast ratio before and after.

### Type and spacing

| | |
|---|---|
| Body | 1.0625rem (17 px), line height 1.6, colour `--text` on `--page` |
| Headings | `--navy`, weight 600, line height 1.2, margin above at least 1.5 times the margin below |
| Paragraphs and lists | One consistent bottom margin, no double spacing from nested elements |
| Body text width | `max-width: var(--measure)` on `.prose` |
| Links in body text | `--gold-text`, underlined (live relies on colour alone, which fails WCAG 1.4.1) |
| Focus | Visible outline on every focusable element, at least 2 px, never removed |

### Content safety (`60-content.css`)

Inside `.prose`: `img`, `video`, `iframe` and `table` never exceed the column. `img { max-width: 100%; height: auto; }` overrides `width` and `height` attributes such as live's `width="1024"`. Tables scroll sideways inside a wrapper rather than widening the page. Long URLs wrap (`overflow-wrap: anywhere`).

### Header and menu markup

```html
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="site-header__bar">
    <a class="site-brand" href="/">St Paul's Warton</a>
    <a class="menu-toggle" href="#site-nav"><span class="menu-toggle__icon" aria-hidden="true"></span>Menu</a>
  </div>
  <nav id="site-nav" class="site-nav" aria-label="Main">
    <ul class="site-nav__list">
      <li><a href="/">Home</a></li>
      <li><details class="site-nav__group" name="site-nav"><summary>About</summary>
        <ul><li><a href="/page/about/about-us">About Us</a></li></ul></details></li>
    </ul>
  </nav>
</header>
<main id="main" class="site-main">...</main>
```

| Behaviour | Without script | With `site.js` |
|---|---|---|
| Narrow screens (below 768 px) | Menu hidden. "Menu" link jumps to `#site-nav`, and `.site-nav:target` shows it | Toggle gets `role="button"`, `aria-controls="site-nav"`, `aria-expanded`. Click, Enter or Space toggles `.site-nav.is-open`. Escape closes and returns focus |
| Wide screens | Menu always shown in one row on navy, gold underline as live | Same, plus Escape and an outside click close an open dropdown |
| Dropdowns | `<details>` opens and closes. `name="site-nav"` keeps one open at a time | Same |
| Current section | `aria-current="page"` on the matching link | Same |

The toggle is at least 44 by 44 px, shows the word "Menu", and has visible focus.

### Footer

Two areas, stacked on narrow screens:

1. The groups from `footer-groups.html`, each a heading and a list of links.
2. Find Us: the map image (via `picture.html`, alt "Map showing St Paul's Church, Warton") linking to the Google Maps place URL in the current footer, the address linking to the directions URL in the current footer, and a "Like us on Facebook" text link to `https://www.facebook.com/stpaulswarton` with an inline SVG icon (no sprite, no script).

Then `&copy; {year} St Paul's Warton`. No "Site by" text.

### Partials

| Partial | Behaviour |
|---|---|
| `href.html` | `{{ return }}` the input with one trailing `/` removed, except when the input is `/` |
| `menu-items.html` | Returns `slice` of `dict "name" "url" "children"` from `site.Menus.main`, in weight order, `children` empty when none. URLs pass through `href.html` |
| `footer-groups.html` | Returns `slice` of `dict "title" "links"` from `site.Menus.footer`: each top-level entry is a group, its children the links |
| `picture.html` | Takes `dict "src" "alt" "sizes" "eager"`. `src` is an asset path such as `images/map.png`. Calls `errorf` when the asset is missing. Outputs `<picture>` with a WebP `<source>` whose `srcset` holds widths 480, 800, 1200 and 1600 that do not exceed the original, then an `<img>` in the original format at the largest width up to 800, with `srcset`, `sizes` (default `100vw`), `width`, `height`, `alt`, `decoding="async"` and `loading="lazy"` unless `eager` |

### Scripts and styles

| | |
|---|---|
| CSS | `resources.Match "css/*.css"`, concatenated in file name order to `css/site.css`, `minify`, `fingerprint`. One `<link rel="stylesheet">` with `integrity` |
| CSS files | `10-tokens.css`, `20-base.css` (reset, type, `@font-face` for Muli with `font-display: swap`), `30-layout.css`, `40-header.css`, `50-components.css` (cards, buttons, status labels), `60-content.css`, `70-footer.css` |
| CSS budget | Under 25,000 bytes minified |
| Script | `site/assets/js/site.js`, `minify`, `fingerprint`, one `<script defer>` with `integrity` at the end of `<head>`. Under 2,048 bytes minified |
| Inline | No `<script>` without `src`, no `style=` attribute, no `on*=` attribute in any template output |
| Favicon | `site/static/favicon.ico` copied from `archive/umbraco-2019:StPauls.Web/favicon.ico` |
| Layout images | `site/assets/images/map.png` moved from `site/static/Content/Image/map.png` |
| Deleted | `site/static/Content/` (bootstrap, Site.css, social sprites) |

### Notices and 404

Same content and CSS hooks as spec 00 (`notice-date`, `notice-summary`, `notice-location`), on the new shell. List: cards in a responsive grid (one column on phones, two from 768 px). Single: title, date, location, then the body in `.prose`. Links go through `href.html`, so the list links to `/notices/newer`, not `/notices/newer/`. Static Web Apps serves both today.

### Menus in `hugo.toml`

`[[menus.main]]` and `[[menus.footer]]` entries reproduce the live menu and footer listed in Starting point, with Register and Login removed. Identifiers are the lower-case group names (`about`, `services`, `gallery`, `links-group` for the footer Links group). URLs are the live URLs. Spec 04 deletes these entries.

---

## Manual steps (maintainer)

1. Look at the side-by-side screenshots (live and new, 390 px and 1280 px wide) and say whether the look is still recognisably the same site. This is the sign-off before merging.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] No file under `site/static/Content/` remains, and the built site references nothing under `/Content/`.
- [ ] CSS under 25,000 bytes and script under 2,048 bytes, both fingerprinted with SRI.
- [ ] Every token pair in the contrast test meets its threshold.
- [ ] With script disabled, the menu opens on a phone-width screen and every dropdown opens.
- [ ] The menu toggle is at least 44 by 44 px and reads "Menu".
- [ ] A 1024 px wide image or 900 px wide iframe in a notice body stays inside the column at 390 px.
- [ ] The maintainer signs off the screenshots.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A shared shell and one small stylesheet that keep the live look, read better on phones, and need no script.

**Architecture:** CSS split into ordered files under `site/assets/css/` and bundled by Hugo Pipes. Templates take menu and footer data from two partials that return plain slices, so spec 04 can change where the data comes from without touching markup. One small deferred script enhances a menu that already works without it.

**Tech Stack:** Hugo extended 0.167.0 (Pipes, image processing), plain CSS with custom properties, plain JavaScript, Python 3 `unittest`, Playwright for Python (sandbox only, screenshots).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- CSS custom property names exactly as in the Tokens table. Class names exactly as in the header markup block.
- No CSS framework, no preprocessor, no `@import`. Plain CSS that Hugo's minifier accepts.
- Breakpoint 768 px for the menu and card grid. Any further breakpoints are the builder's call.
- No `!important` except inside `60-content.css` where it is needed to beat inline `width` attributes or `style` in content.

### Review Focus

1. A phone user with script blocked or failed (old browser, flaky connection) cannot open the menu. Pinned by `test_menu_works_without_script`.
2. Legacy body HTML with `width="1024"` images, an 800 px iframe or a wide table pushes the page wider than the screen. Pinned by `test_content_cannot_overflow` and the 390 px screenshot.
3. Darkened gold or date colours still fail contrast on the off-white page background, not just on white. Pinned by `test_token_contrast` checking both surfaces.
4. A keyboard user tabs into an open dropdown and cannot get out, or loses focus visibility. Pinned by `test_focus_is_never_hidden` and a manual Tab run in the screenshot session.
5. A notice title or summary much longer than the fixtures breaks the card grid. Pinned by the long-text fixture in `test_long_text_wraps`.

---

### Task 1: Tokens, base stylesheet and bundle

**Files:**
- Create: `site/assets/css/10-tokens.css`, `20-base.css`, `30-layout.css`, `50-components.css`, `60-content.css`
- Create: `site/layouts/_partials/head.html`
- Modify: `site/layouts/baseof.html`
- Delete: `site/static/Content/bootstrap.css`, `site/static/Content/Site.css`, `site/static/Content/Image/social-sprites.png`
- Move: `site/static/Content/Image/map.png` to `site/assets/images/map.png`
- Create: `site/static/favicon.ico` (from the archive branch, byte for byte)
- Create: `tests/test_styles.py`
- Modify: `tests/test_layout.py` (replace `test_page_uses_legacy_css`)

**Interfaces:**
- Produces: tokens as listed in the spec. `head.html` takes the page and outputs charset, viewport, title (`{{ .Title }} | {{ site.Title }}`, or `site.Title` on home), description from `.Params.summary`, `theme-color` `#002060`, favicon link, the CSS link, the script tag (Task 2 adds the script). `baseof.html` outputs skip link, header partial, `<main id="main" class="site-main"><div class="container">{{ block "main" . }}{{ end }}</div></main>`, footer partial.

- [ ] **Step 1: Write the failing tests**

`tests/test_styles.py`:

```python
TOKENS = REPO / "site/assets/css/10-tokens.css"

def contrast(a: str, b: str) -> float:
    """WCAG 2.2 contrast ratio of two #rrggbb colours."""

def tokens() -> dict[str, str]:
    """--name: #rrggbb pairs from 10-tokens.css, lower case, 3-digit hex expanded."""

class TokenTests(unittest.TestCase):
    def test_live_palette_kept(self):
        t = tokens()
        self.assertEqual(t["--navy"], "#002060")
        self.assertEqual(t["--gold"], "#c8a85a")
        self.assertEqual(t["--page"], "#fdfdf7")
        self.assertEqual(t["--footer-bg"], "#0c0c0e")

    def test_token_contrast(self):
        t = tokens()
        pairs = [("--text", "--page", 4.5), ("--text", "--surface", 4.5),
                 ("--gold-text", "--page", 4.5), ("--gold-text", "--surface", 4.5),
                 ("--muted", "--surface", 4.5), ("--date", "--surface", 4.5),
                 ("--date", "--page", 4.5), ("--nav-text", "--navy", 4.5),
                 ("--gold", "--navy", 4.5), ("--footer-text", "--footer-bg", 4.5),
                 ("--gold", "--footer-bg", 4.5), ("--navy", "--page", 4.5)]
        for fg, bg, need in pairs:
            self.assertGreaterEqual(round(contrast(t[fg], t[bg]), 2), need, f"{fg} on {bg}")

    def test_gold_text_is_as_close_to_live_as_allowed(self):
        # Darkened only as far as needed: one step lighter would fail on the page colour.
        ...
```

For `test_gold_text_is_as_close_to_live_as_allowed`, convert `--gold-text` to HSL, raise lightness by 2 percentage points, and assert the result is below 4.5:1 on `--page`. Same test for `--date` against `--surface`.

In `tests/test_layout.py` replace `test_page_uses_legacy_css` with:

```python
def test_single_bundled_stylesheet(self):
    links = re.findall(r'<link rel="stylesheet" href="([^"]+)" integrity="sha256-[^"]+"', self.page)
    self.assertEqual(len(links), 1)
    self.assertRegex(links[0], r"^/css/site\.min\.[0-9a-f]{64}\.css$")
    self.assertNotIn("/Content/", self.page)
    self.assertFalse((self.out / "Content").exists())
    self.assertTrue((self.out / "favicon.ico").is_file())

def test_css_budget(self):
    css = next((self.out / "css").glob("site.min.*.css"))
    self.assertLess(css.stat().st_size, 25_000)

def test_content_cannot_overflow(self):
    css = next((self.out / "css").glob("site.min.*.css")).read_text()
    for sel in (".prose img", ".prose iframe", ".prose video", ".prose table"):
        self.assertIn(sel, css)
    self.assertRegex(css, r"\.prose img[^{]*\{[^}]*max-width:100%")
    self.assertRegex(css, r"\.prose img[^{]*\{[^}]*height:auto")

def test_focus_is_never_hidden(self):
    css = next((self.out / "css").glob("site.min.*.css")).read_text()
    self.assertNotRegex(css, r":focus[^{]*\{[^}]*outline:(none|0)[;}]")
    self.assertIn(":focus-visible", css)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_styles.py' -v` and `-p 'test_layout.py'`
Expected: `FileNotFoundError` for the tokens file, and the bundle assertions fail.

- [ ] **Step 3: Write the tokens and base CSS, `head.html` and the new `baseof.html`; move, copy and delete the files listed**

Pick `--gold-text` and `--date` by darkening HSL lightness in 1 point steps from the live value until both surfaces pass. Record live value, chosen value and both ratios in a comment beside each.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass except header and footer checks in `test_layout.py` that Task 2 replaces. If any other test fails, fix before moving on.

- [ ] **Step 5: Commit**

```bash
git add -A site/assets site/static site/layouts tests
git commit -m "Replace Bootstrap with a small tokenised stylesheet"
```

---

### Task 2: Header, menu and script

**Files:**
- Create: `site/assets/css/40-header.css`, `site/assets/js/site.js`
- Create: `site/layouts/_partials/href.html`, `site/layouts/_partials/menu-items.html`
- Modify: `site/layouts/_partials/header.html`, `site/layouts/_partials/head.html` (script tag)
- Modify: `site/hugo.toml` (`[[menus.main]]` entries)
- Modify: `tests/test_layout.py`

**Interfaces:**
- Consumes: `head.html`, tokens (Task 1).
- Produces: `href.html` and `menu-items.html` exactly as in the site contract. Header markup and class names exactly as the spec's header block. `site.js` exposes nothing global.

- [ ] **Step 1: Write the failing tests in `tests/test_layout.py`**

```python
def test_skip_link_comes_first(self):
    body = self.page.split("<body", 1)[1]
    first_link = re.search(r"<a [^>]*>", body).group(0)
    self.assertIn('class="skip-link"', first_link)
    self.assertIn('href="#main"', first_link)
    self.assertIn('id="main"', self.page)

def test_menu_works_without_script(self):
    self.assertRegex(self.page, r'<a class="menu-toggle" href="#site-nav">.*Menu</a>')
    self.assertIn('<nav id="site-nav" class="site-nav" aria-label="Main">', self.page)
    css = next((self.out / "css").glob("site.min.*.css")).read_text()
    self.assertIn(".site-nav:target", css)

def test_menu_matches_live(self):
    for name in ("Home", "Blog", "Calendar", "About", "Services", "Groups",
                 "Community", "Links", "Gallery", "Forms", "Safeguarding"):
        self.assertRegex(self.page, rf">\s*{name}\s*<")
    self.assertNotIn("Register", self.page)
    self.assertNotIn("Login", self.page)

def test_dropdowns_are_details(self):
    groups = re.findall(r'<details class="site-nav__group" name="site-nav"><summary>([^<]+)</summary>', self.page)
    self.assertEqual(groups, ["About", "Services", "Gallery"])
    self.assertIn('href="/page/about/about-us"', self.page)

def test_links_have_no_trailing_slash(self):
    hrefs = re.findall(r'href="(/[^"#]*)"', self.page)
    self.assertTrue(hrefs)
    self.assertEqual([h for h in hrefs if h != "/" and h.endswith("/")], [])

def test_toggle_is_big_enough(self):
    css = next((self.out / "css").glob("site.min.*.css")).read_text()
    rule = re.search(r"\.menu-toggle\{([^}]*)\}", css).group(1)
    self.assertRegex(rule, r"min-height:(2\.75rem|44px)")
    self.assertRegex(rule, r"min-width:(2\.75rem|44px)")

def test_single_small_deferred_script(self):
    tags = re.findall(r"<script[^>]*>", self.page)
    self.assertEqual(len(tags), 1)
    self.assertRegex(tags[0], r'src="/js/site\.min\.[0-9a-f]{64}\.js"')
    self.assertIn("defer", tags[0])
    self.assertIn('integrity="sha256-', tags[0])
    js = next((self.out / "js").glob("site.min.*.js"))
    self.assertLess(js.stat().st_size, 2048)

def test_no_inline_script_style_or_handlers(self):
    self.assertNotRegex(self.page, r"<script(?![^>]*\bsrc=)[^>]*>")
    self.assertNotRegex(self.page, r"\sstyle=")
    self.assertNotRegex(self.page, r"\son[a-z]+=")
```

Remove `'class="navbar-brand"'` and `'href="/notices/"'` from `test_header_and_footer`, assert `'class="site-brand"'` instead. Footer assertions stay until Task 3.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_layout.py' -v`
Expected: the new tests fail on missing markup.

- [ ] **Step 3: Add the menus to `hugo.toml`, write the partials, header, CSS and script**

`site.js` does three things, in plain ES2020 inside an IIFE: enhances `.menu-toggle` as the spec's table says, closes an open `details.site-nav__group` on Escape or a click outside it, and does nothing else. No dependencies, no `document.write`, no `eval`.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass. Run `actionlint` is not needed here (no workflow change).

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add header and menu that work without script"
```

---

### Task 3: Footer and picture partial

**Files:**
- Create: `site/assets/css/70-footer.css`
- Create: `site/layouts/_partials/footer-groups.html`, `site/layouts/_partials/picture.html`
- Modify: `site/layouts/_partials/footer.html`, `site/hugo.toml` (`[[menus.footer]]` entries)
- Modify: `tests/test_layout.py`

**Interfaces:**
- Consumes: `href.html` (Task 2).
- Produces: `footer-groups.html` and `picture.html` exactly as in the site contract. `picture.html` is used by specs 04 and 06.

- [ ] **Step 1: Write the failing tests**

```python
def test_footer_groups_match_live(self):
    foot = self.page.split('<footer', 1)[1]
    for title in ("Links", "Services", "Groups", "Community", "Gallery", "Forms", "Safeguarding"):
        self.assertRegex(foot, rf"<h2[^>]*>\s*{title}\s*</h2>")
    for href in ("/blog", "/calendar", "/notices", "/contact", "/sitemap",
                 "/page/about/privacy-policy", "/page/gallery/website-pictures"):
        self.assertIn(f'href="{href}"', foot)

def test_find_us(self):
    foot = self.page.split('<footer', 1)[1]
    self.assertIn("PR4 1BD", foot)
    self.assertIn('href="https://www.facebook.com/stpaulswarton"', foot)
    self.assertIn("<svg", foot)
    self.assertNotIn("Site by", foot)

def test_map_is_a_responsive_picture(self):
    pic = re.search(r"<picture>.*?</picture>", self.page, re.S).group(0)
    self.assertRegex(pic, r'<source type="image/webp" srcset="/images/map_hu_\w+\.webp 480w, /images/map_hu_\w+\.webp 800w"')
    self.assertIn('alt="Map showing St Paul&#39;s Church, Warton"', pic)
    self.assertIn('width="800" height="712"', pic)
    self.assertIn('loading="lazy"', pic)
    self.assertIn('decoding="async"', pic)
```

The map is 841 by 749, so the widths are 480 and 800 and the fallback is 800 by 712. If Hugo escapes the apostrophe differently, match what it outputs and keep the assertion exact.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_layout.py' -v`
Expected: the three new tests fail.

- [ ] **Step 3: Add the footer menus, write `footer-groups.html`, `picture.html`, `footer.html` and `70-footer.css`**

Footer group headings are `<h2>` styled small, so the page outline stays valid on every page.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add footer groups and responsive map image"
```

---

### Task 4: Notices and 404 on the new shell

**Files:**
- Modify: `site/layouts/notices/section.html`, `site/layouts/notices/page.html`, `site/layouts/404.html`
- Create: `tests/fixtures/content/notices/long.md`
- Modify: `tests/test_notices.py`

**Interfaces:**
- Consumes: `href.html`, `.prose`, card classes from `50-components.css`.
- Produces: card markup `<article class="card">` with `<h2 class="card__title"><a href="...">`, used again by spec 03 for events and articles.

- [ ] **Step 1: Write the fixture and failing tests**

`long.md`: `title` of 140 characters with one 60 character word, `date: 2026-01-15`, `summary` of 600 characters, body `<p><img src="https://example.org/wide.jpg" width="1024" alt="Wide"></p><iframe src="https://example.org/" width="900" height="400" title="Wide frame"></iframe>`.

In `tests/test_notices.py`:

- `test_list_links_and_dates`: expect `href="/notices/newer"` (no trailing slash).
- `test_long_text_wraps`: the built CSS has `overflow-wrap:anywhere` on `.card__title` and on `.prose`.
- `test_list_is_a_card_grid`: list page has one `<article class="card">` per fixture notice and a container with class `card-grid`.
- `test_single_body_in_prose`: `notices/newer/index.html` wraps the body in `<div class="prose">`.

Existing CSS hook tests stay as they are.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_notices.py' -v`
Expected: the changed and new tests fail.

- [ ] **Step 3: Rewrite the three templates on the new classes**

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Move notices and 404 onto the new shell"
```

---

### Task 5: Screenshots for sign-off

**Files:**
- Create: `scripts/screenshots.py`
- Create: `scripts/README.md` (one table: script, what it does, how to run, never run in CI)

**Interfaces:**
- Produces: `python3 scripts/screenshots.py --out <dir> --width 390 --width 1280 <name>=<url> ...` writes `<dir>/<name>-<width>.png` full-page screenshots with Playwright Chromium. Used again in specs 04 and 06.

- [ ] **Step 1: Write the script**

Standard library plus `playwright.sync_api`, imported inside `main()` so the test suite never needs it. Exit with a clear message if Playwright is missing.

- [ ] **Step 2: Build and serve the site locally, then take the screenshots**

```bash
hugo --source site --destination /tmp/<scratch>/public --minify
python3 -m http.server 8080 --directory /tmp/<scratch>/public &
python3 scripts/screenshots.py --out <scratchpad>/shots --width 390 --width 1280 \
  live-notices=http://stpaulswarton.co.uk/notices \
  new-notices=http://localhost:8080/notices/ \
  live-notice=http://stpaulswarton.co.uk/notices/notice/46/news-pew-sheets \
  new-notice=http://localhost:8080/notices/news-pew-sheets/
```

Expected: eight PNG files. Check by eye at 390 px: no sideways scroll, menu button visible, text not cramped.

- [ ] **Step 3: Tab through the new notices page with the keyboard in the same Playwright session** (skip link, brand, Menu, each menu item and dropdown, cards, footer links). Expected: focus is always visible and never trapped.

- [ ] **Step 4: Commit the script and send the screenshots to the maintainer for sign-off**

```bash
git add scripts
git commit -m "Add screenshot script for side-by-side sign-off"
git push -u origin <session branch>
```

Send the PNGs with the user file tool. Do not mark the spec done until the maintainer signs off.
