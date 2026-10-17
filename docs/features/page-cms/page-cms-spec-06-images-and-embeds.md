---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 06: images and embeds

_One session. Serves every uploaded image as resized WebP inside `<picture>`, including images Paul drops into a rich text body, makes anything else fit the column, and turns the Google Calendar and Facebook album iframes into page settings that the editor cannot break. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

An image Paul uploads, at any size, reaches a phone as a WebP sized for the screen, with its space reserved so nothing jumps. A hot-linked image still fits. The two embeds resize with the page and survive a save in Pages CMS.

## Starting point

- `picture.html` (specs 02 and 04) handles asset paths such as `images/map.png`, with `fill`, and calls `errorf` when an asset is missing.
- `body.html` (spec 03) returns `.RawContent` untouched.
- Pages CMS media: `site/static/uploads/`, written into content as `/uploads/...`. Hugo copies those files as they are; it cannot process them.
- Live embeds: Google Calendar on `/page/about/church-diary` (`https://calendar.google.com/calendar/embed?src=wartonstpauls%40gmail.com&ctz=Europe/London`, 800 by 600) and EmbedSocial on `/page/gallery/church-gallery` (`//embedsocial.com/facebook_album/album_photos/866062123490460`, 900 by 1450).

## In scope

- Mount `static/uploads` as `assets/uploads`, so uploads are both published as is and processable.
- `picture.html` accepts `/uploads/...`, and falls back to a plain lazy `<img>` for anything it cannot process.
- `body.html` rewrites body `<img>` tags: uploads become `<picture>`, everything else gets `loading="lazy"` and `decoding="async"`.
- Embeds as page fields (`embed`, `embed_src`), allowed hosts in `site/data/embeds.yaml`, rendered by `embed.html` as a sandboxed, lazy, responsive iframe.
- Pages CMS fields for embeds on every page collection.
- Processed image cache in the workflow.
- Test helper option to build with fixture uploads.

## Out of scope

Copying the hot-linked images into the repo and moving the live iframes into fields (spec 07 does both while migrating). CSP for the embed hosts (09).

---

## Requirements

### Mounts (`site/hugo.toml`)

```toml
[[module.mounts]]
  source = 'static'
  target = 'static'
[[module.mounts]]
  source = 'assets'
  target = 'assets'
[[module.mounts]]
  source = 'static/uploads'
  target = 'assets/uploads'

[imaging]
  quality = 75
```

### `picture.html`

| Input `src` | Output |
|---|---|
| `images/...` asset that exists | As today |
| `/uploads/x.(jpg|jpeg|png|webp)` that exists | `<picture>` as today: WebP widths 480, 800, 1200, 1600 up to the original, fallback in the original format, `width`, `height`, `sizes`, lazy unless `eager`. `fill` works too |
| `/uploads/x.(gif|svg)` that exists | Plain `<img>` with `width` and `height` when Hugo can read them (GIF), `loading="lazy"`, `decoding="async"`. GIFs are not processed, to keep animation |
| Anything else (missing upload, other site, `http:`) | Plain `<img src alt loading="lazy" decoding="async">`. No error, no warning: Paul deleting an image must never break a publish |
| `images/...` asset that is missing | `errorf` (a maintainer mistake) |

`alt` is always present. When the caller passes none, `alt=""`.

### `body.html`

1. Take `.RawContent`.
2. For each `<img ...>` tag (regex `(?i)<img\b[^>]*>`): read `src` and `alt` (single or double quotes). When `src` starts with `/uploads/`, or with `https://stpaulswarton.co.uk/uploads/` or `http://stpaulswarton.co.uk/uploads/` (normalise to `/uploads/`), replace the tag with `picture.html` (`sizes: "(min-width: 48rem) 70ch, 100vw"`). Otherwise add `loading="lazy" decoding="async"` when the tag has no `loading`.
3. Return `safeHTML`.

Other attributes on uploaded images (`width`, `height`, `style`, `class`) are dropped; the processed image sets its own dimensions. Attributes on other images are kept, and CSS from spec 02 overrides any fixed width.

### Embeds

`site/data/embeds.yaml`:

```yaml
google-calendar:
  host: calendar.google.com
  title: Church diary
  ratio: "4 / 3"
facebook-album:
  host: embedsocial.com
  title: Photos from the church Facebook page
  ratio: "62 / 100"
```

| | |
|---|---|
| Page fields | `embed` (select: the keys above, optional, label "Embedded calendar or gallery"), `embed_src` (string, label "Embed address", description "Paste the address the calendar or gallery gives you") |
| `embed.html` | Takes a page. Outputs nothing unless `embed` is a known key and `embed_src`, after turning a leading `//` into `https://`, starts with `https://{host}/`. Then `<div class="embed embed--{key}"><iframe src title loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" allowfullscreen></iframe></div>` |
| CSS | `.embed { width: 100%; }` `.embed iframe { width: 100%; height: 100%; border: 0; }` and one `aspect-ratio` rule per key, in `60-content.css`. No inline style |
| Placement | `page/page.html` renders the embed after the body |

### Workflow

Before the build step, `actions/cache` restores `site/resources/_gen` with key `hugo-gen-${{ hashFiles('site/static/uploads/**', 'site/assets/images/**') }}` and restore key `hugo-gen-`. A cold build still works.

### Tests helper

`build_site(dest, content_dir=None, *, uploads_dir=None, minify=False, strict=True)`: when `uploads_dir` is given, write a temporary TOML that mounts `site/static` to `static`, `site/assets` to `assets`, and `uploads_dir` to both `static/uploads` and `assets/uploads`, and pass `--config <site/hugo.toml>,<temp toml>`. `helpers.make_png(path: Path, width: int, height: int) -> None` writes a valid RGB PNG with the standard library (`zlib`, `struct`), so no binary fixtures are committed.

---

## Manual steps (maintainer)

1. After merge, upload a large photo through Pages CMS into a notice body and check on a phone that it loads quickly and fits.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] A 1600 by 900 upload in a body becomes `<picture>` with WebP at 480, 800, 1200 and 1600, and `width="800" height="450"` on the fallback.
- [ ] A hot-linked image keeps its `src`, gains `loading="lazy"`, and fits the column.
- [ ] A missing upload, a GIF and an SVG render as plain images without failing the build.
- [ ] A Google Calendar embed renders sandboxed and responsive. An embed address on another host renders nothing.
- [ ] Every page collection in Pages CMS has `embed` and `embed_src`.
- [ ] `actionlint` passes.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimised uploads everywhere they appear, safe fallbacks for everything else, and embeds as fields.

**Architecture:** Uploads are mounted twice, as static files and as assets, so the original URL keeps working while Hugo makes WebP copies next to it. One partial decides between `<picture>` and a plain image. The body partial rewrites `<img>` tags into that partial. Embeds are validated against a host list in data.

**Tech Stack:** Hugo extended 0.167.0 image processing and module mounts, GitHub Actions cache, Python 3 `unittest`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- WebP widths exactly 480, 800, 1200, 1600, never above the original. Quality 75.
- No binary fixtures in the repo. Test images are generated with `helpers.make_png`.
- Nothing about a missing or foreign image may fail a build or print a warning.
- Embed hosts only from `embeds.yaml`.

### Review Focus

1. Paul uploads a 6000 by 4000 phone photo. Expected: largest WebP is 1600 wide, fallback 800, page weight stays low. Pinned by `test_huge_upload_is_capped`.
2. Paul deletes an image still used in a body. Expected: a plain `<img>` pointing at the missing file, the build passes. Pinned by `test_missing_upload_is_plain`.
3. Body HTML with single-quoted attributes, upper-case `IMG`, or `alt` containing `>` or quotes. Expected: rewritten correctly, alt preserved and escaped. Pinned by `test_odd_img_markup`.
4. An image file name with spaces or capitals (`Website_large.jpg`, `My Photo.JPG`). Expected: processed, and the published URL works. Pinned by `test_awkward_file_names`.
5. Paul pastes an embed address from a different host, or a `javascript:` URL. Expected: nothing rendered. Pinned by `test_embed_host_is_enforced`.

---

### Task 1: Uploads as processable assets

**Files:**
- Modify: `site/hugo.toml` (mounts, `[imaging]`)
- Modify: `site/layouts/_partials/picture.html`
- Modify: `tests/helpers.py` (`uploads_dir`, `make_png`)
- Modify: `tests/fixtures/content/blog/a8.md` (`image: /uploads/fixture-wide.png`, `image_alt: Wide`)
- Create: `tests/test_images.py` (`PictureTests`)

**Interfaces:**
- Produces: `build_site(..., uploads_dir=...)`, `make_png(path, width, height)`, the extended `picture.html` contract above.

- [ ] **Step 1: Write the failing tests**

`setUpClass` creates a temp uploads folder with `make_png`: `fixture-wide.png` (1600 by 900), `fixture-huge.png` (6000 by 4000), `Fixture Space.PNG` (900 by 600), and writes a two-frame-free minimal GIF (`fixture.gif`, the 43-byte transparent GIF as bytes) and `fixture.svg`. Builds `FIXTURES / "content"` with `uploads_dir`.

```python
def test_front_matter_upload_is_picture(self):
    pic = re.search(r"<picture>.*?</picture>", self.a8, re.S).group(0)
    widths = re.findall(r"\.webp (\d+)w", pic)
    self.assertEqual(widths, ["480", "800", "1200", "1600"])
    self.assertRegex(pic, r'<img [^>]*src="/uploads/fixture-wide_hu_\w+\.png"')
    self.assertIn('width="800" height="450"', pic)
    self.assertIn('alt="Wide"', pic)

def test_original_still_published(self):
    self.assertTrue((self.out / "uploads/fixture-wide.png").is_file())

def test_huge_upload_is_capped(self):
    ...  # via a body image in Task 2's fixture; here assert the generated files max out at 1600 wide

def test_no_upload_means_plain_image(self):
    with tempfile.TemporaryDirectory() as tmp:
        build_site(Path(tmp), FIXTURES / "content")  # no uploads_dir
        a8 = (Path(tmp) / "blog/article/a8/index.html").read_text()
    self.assertNotIn("<picture>", a8.split("blog-aside")[0])
    self.assertIn('<img src="/uploads/fixture-wide.png" alt="Wide" loading="lazy" decoding="async"', a8)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_images.py' -v`

- [ ] **Step 3: Add the mounts and imaging config, extend `picture.html`, extend the helpers**

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass once two older test classes get the same temp uploads through `uploads_dir`: spec 03's `BlogTests` (`test_article_image_is_picture`) and spec 04's `HomeTests` (`test_three_latest_articles_cropped`), since `a8.md` now points at `/uploads/fixture-wide.png`.

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Serve uploads as resized WebP through the picture partial"
```

---

### Task 2: Images inside rich text bodies

**Files:**
- Modify: `site/layouts/_partials/body.html`
- Create: `tests/fixtures/content/notices/images.md` (`title: Fixture images`, `date: 2015-06-01`)
- Modify: `tests/test_images.py` (`BodyImageTests`)

Body of `images.md`:

```html
<p><img src="/uploads/fixture-wide.png" alt="Wide one" width="1024" style="float:left"></p>
<p><IMG SRC='/uploads/fixture-huge.png' ALT='Quote " and > inside'></p>
<p><img src="http://stpaulswarton.co.uk/uploads/Fixture Space.PNG" alt="Spaces"></p>
<p><img src="https://media.acny.uk/x.jpg" alt="Hot linked" width="1024"></p>
<p><img src="/uploads/fixture.gif" alt="Gif"><img src="/uploads/fixture.svg" alt="Svg"></p>
<p><img src="/uploads/deleted.jpg" alt="Gone"></p>
```

**Interfaces:**
- Consumes: `picture.html` (Task 1).
- Produces: `body.html` contract above. Spec 07 relies on it: migrated bodies keep plain `<img src="/uploads/...">` tags.

- [ ] **Step 1: Write the failing tests**

```python
def test_body_upload_becomes_picture(self):
    self.assertEqual(self.page.count("<picture>"), 3)
    self.assertNotIn('width="1024"', self.page.split("acny")[0])
    self.assertNotIn('float:left', self.page)

def test_odd_img_markup(self):
    self.assertIn('alt="Quote &#34; and &gt; inside"', self.page)

def test_absolute_own_domain_upload(self):
    self.assertIn('alt="Spaces"', self.page)
    self.assertRegex(self.page, r'srcset="/uploads/Fixture%20Space_hu_\w+\.webp 480w')

def test_awkward_file_names(self):
    self.assertTrue(any((self.out / "uploads").glob("Fixture Space_hu_*.webp")))

def test_hot_linked_image_is_lazy(self):
    self.assertRegex(self.page, r'<img src="https://media\.acny\.uk/x\.jpg" alt="Hot linked" width="1024" loading="lazy" decoding="async">')

def test_gif_and_svg_are_plain(self):
    self.assertRegex(self.page, r'<img src="/uploads/fixture\.gif" alt="Gif" width="1" height="1" loading="lazy"')
    self.assertRegex(self.page, r'<img src="/uploads/fixture\.svg" alt="Svg" loading="lazy"')

def test_missing_upload_is_plain(self):
    self.assertIn('<img src="/uploads/deleted.jpg" alt="Gone" loading="lazy" decoding="async">', self.page)

def test_huge_upload_is_capped(self):
    pic = self.page.split("Quote", 1)[0].rsplit("<picture>", 1)[1]
    self.assertEqual(re.findall(r"\.webp (\d+)w", pic), ["480", "800", "1200", "1600"])
```

Match Hugo's real escaping of `"` in attributes (`&#34;` or `&quot;`) and of spaces in URLs, and keep the assertions exact once known.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_images.py' -v`

- [ ] **Step 3: Write the rewrite in `body.html`**

Use `findRE` to collect tags, `findRESubmatch` with `(?i)\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')` and the same for `alt` to read attributes, `htmlUnescape` the alt before passing it on, and `replace` each tag once. Process tags in order so identical tags are each replaced.

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Rewrite rich text images into responsive pictures"
```

---

### Task 3: Embeds as page fields

**Files:**
- Create: `site/data/embeds.yaml`, `site/layouts/_partials/embed.html`
- Modify: `site/layouts/page/page.html`, `site/assets/css/60-content.css`
- Modify: `.pages.yml` (two fields on every `page-*` collection, after `body`)
- Create: `tests/fixtures/content/page/about/church-diary.md` (`embed: google-calendar`, `embed_src` the live calendar URL), `page/gallery/_index.md` (copy of the real one), `page/gallery/church-gallery.md` (`embed: facebook-album`, `embed_src: //embedsocial.com/facebook_album/album_photos/866062123490460`), `page/gallery/bad-host.md` (`embed: google-calendar`, `embed_src: https://evil.example/calendar`), `page/gallery/script-url.md` (`embed: facebook-album`, `embed_src: "javascript:alert(1)"`)
- Modify: `tests/test_images.py` (`EmbedTests`), `tests/test_cms_config.py`

**Interfaces:**
- Produces: `embed.html` (takes a page), `site.Data.embeds`. Spec 07 writes `embed` and `embed_src` when migrating. Spec 09 builds `frame-src` from `embeds.yaml`.

- [ ] **Step 1: Write the failing tests**

```python
def test_google_calendar_embed(self):
    html = (self.out / "page/about/church-diary/index.html").read_text()
    frame = re.search(r'<div class="embed embed--google-calendar"><iframe [^>]*></iframe></div>', html).group(0)
    self.assertIn('src="https://calendar.google.com/calendar/embed?src=wartonstpauls%40gmail.com&amp;ctz=Europe/London"', frame)
    for attr in ('loading="lazy"', 'title="Church diary"', 'sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"',
                 'referrerpolicy="strict-origin-when-cross-origin"'):
        self.assertIn(attr, frame)

def test_protocol_relative_becomes_https(self):
    html = (self.out / "page/gallery/church-gallery/index.html").read_text()
    self.assertIn('src="https://embedsocial.com/facebook_album/album_photos/866062123490460"', html)

def test_embed_host_is_enforced(self):
    for p in ("page/gallery/bad-host", "page/gallery/script-url"):
        self.assertNotIn("<iframe", (self.out / p / "index.html").read_text(), p)

def test_embed_css_has_ratios(self):
    css = next((self.out / "css").glob("site.min.*.css")).read_text()
    self.assertIn(".embed--google-calendar{aspect-ratio:4/3}", css)
```

In `tests/test_cms_config.py`, extend the expected field list for every `page-*` collection with `embed`, `embed_src`, and assert the `embed` select values equal the keys of `embeds.yaml`.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_images.py' -v`

- [ ] **Step 3: Write `embeds.yaml`, `embed.html`, the CSS, and the Pages CMS fields**

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests .pages.yml
git commit -m "Add embeds as validated page fields"
```

---

### Task 4: Cache processed images in the workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `tests/test_workflow.py`

- [ ] **Step 1: Write the failing test**

```python
def test_processed_images_are_cached(self):
    self.assertIn("uses: actions/cache@", WF)
    self.assertIn("path: site/resources/_gen", WF)
    self.assertIn("hashFiles('site/static/uploads/**', 'site/assets/images/**')", WF)
    self.assertLess(WF.index("uses: actions/cache@"), WF.index("hugo --source site --minify"))
```

- [ ] **Step 2: Run it and watch it fail**

Run: `python3 -m unittest discover -s tests -p 'test_workflow.py' -v`

- [ ] **Step 3: Add the cache step** (use the current major tag; spec 09 pins every action to a SHA)

- [ ] **Step 4: Run the suite and `actionlint .github/workflows/deploy.yml`**

- [ ] **Step 5: Commit and push**

```bash
git add .github tests
git commit -m "Cache processed images between deploys"
git push -u origin <session branch>
```
