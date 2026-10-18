---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 06: images and embeds

_One session. Serves every uploaded image as resized WebP inside `<picture>`, including images Paul drops into a rich text body, makes anything else fit the column, and turns the Google Calendar and Facebook album iframes into page settings that the editor cannot break. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

An image Paul uploads, at any size, reaches a phone as a WebP sized for the screen, with its space reserved so nothing jumps. A hot-linked image still fits. The two embeds resize with the page and survive a save in Pages CMS.

## Starting point

- Specs 00 to 05 on `main`, on Eleventy.
- `config/images.js`: the async shortcode `picture({ src, alt, sizes, eager, fill })` and its core `pictureHtml(opts, { assets, out })` handle files under `site/assets/` only (`images/map.png`, `images/hero.jpg`), write `/images/{name}-{width}.<hash8>.{ext}` and cache in `.cache/images/`. A missing asset throws. `assetPath(src)` returns `''` for anything not under `site/assets/`, including `/uploads/...`.
- `partials/image.njk` sends asset paths to `picture` and prints a plain lazy `<img>` for anything else, so an upload in a front matter `image` is not resized today.
- Bodies are printed untouched with `{{ content | safe }}`. No transform runs on the output.
- Pages CMS media: `site/static/uploads/`, written into content as `/uploads/...`. `config/assets.js` copies `site/static/` to the site root as is.
- `tests/serve.js <content dir> <port>` builds with `CONTENT` only. Blog fixture `a8.md` has `image: images/map.png`.
- Live embeds: Google Calendar on `/page/about/church-diary` (`https://calendar.google.com/calendar/embed?src=wartonstpauls%40gmail.com&ctz=Europe/London`, 800 by 600) and EmbedSocial on `/page/gallery/church-gallery` (`//embedsocial.com/facebook_album/album_photos/866062123490460`, 900 by 1450).

## In scope

- `picture` accepts `/uploads/...` from the uploads folder (`UPLOADS`, default `site/static/uploads`), and falls back to a plain lazy `<img>` for anything it cannot process.
- An HTML transform that rewrites body `<img>` tags: uploads become `<picture>`, everything else not already processed gets `loading="lazy"` and `decoding="async"`.
- Embeds as page fields (`embed`, `embed_src`), allowed hosts in `site/data/embeds.yaml`, rendered by `partials/embed.njk` as a sandboxed, lazy, responsive iframe.
- Pages CMS fields for embeds on every page collection.
- `.cache/images` cached in the workflow.
- `tests/serve.js --uploads`, with fixture images written by sharp.

## Out of scope

Copying the hot-linked images into the repo and moving the live iframes into fields (spec 07 does both while migrating). CSP for the embed hosts (09).

---

## Requirements

### Uploads folder

| | |
|---|---|
| Source | `UPLOADS_DIR = process.env.UPLOADS ?? 'site/static/uploads'`, exported from `config/images.js` |
| Published | The originals stay at `/uploads/...`: `site/static/` is copied as today, and when `UPLOADS` is set `config/assets.js` also copies that folder to `/uploads` |
| Processed copies | `/images/{name}-{width}.<hash8>.{ext}` as for layout images. `{name}` is the file name without extension, lower-cased, with every run of other characters than `a-z` and `0-9` turned into `-`, so `Fixture Space.PNG` gives `fixture-space` and `srcset` never holds a space |

The tranquility site wraps a local JPEG or PNG in one 1600 px WebP. This site keeps the four widths of spec 02 for uploads too.

### `picture`

| Input `src` | Output |
|---|---|
| A file under `site/assets/` that exists | As today |
| `/uploads/x.(jpg\|jpeg\|png\|webp)` that exists in `UPLOADS_DIR` (path decoded, so `%20` finds a space) | `<picture>` as today: WebP at 480, 800, 1200, 1600 up to the original width, fallback in the original format, `width`, `height`, `sizes`, lazy unless `eager`. `fill` works too |
| `/uploads/x.(gif\|svg)` that exists | Plain `<img>` with `width` and `height` when sharp can read them, `loading="lazy"`, `decoding="async"`. GIFs are not processed, to keep animation |
| Anything else starting with `/`, `//`, `http:` or `https:` (a missing upload, another site) | Plain `<img src alt loading="lazy" decoding="async">`. No error, no warning: Paul deleting an image must never break a publish |
| A relative path under `site/assets/` that is missing | Throws (a maintainer mistake in a template) |

`alt` is always present. When the caller passes none, `alt=""`. `pictureHtml` gains an `uploads` option next to `assets` and `out`, so unit tests pass a temporary folder. `partials/image.njk` sends every front matter image to `picture` (`(imageSrc | assetPath) or imageSrc`), so an upload in `image` or `hero_image` is resized too.

### Body images (`optimiseImages`)

`optimiseImages(html, { assets, uploads, out })` in `config/images.js`, registered as `addTransform('images', ...)` for every output ending in `.html`.

1. Find each `<img ...>` tag, in order, with a quote-aware, case-insensitive pattern, `<img\b(?:[^>"']|"[^"]*"|'[^']*')*>`, so a raw `>` inside a quoted attribute (`ALT='Quote " and > inside'`) does not end the tag. Read `src` and `alt` in single or double quotes. Decode `alt` once with `entities`.
2. A `src` under `/images/` is a picture this build already made: left alone.
3. A `src` that starts with `/uploads/`, or with `https://stpaulswarton.co.uk/uploads/` or `http://stpaulswarton.co.uk/uploads/` (normalised to `/uploads/`): the tag is replaced by `pictureHtml` with `sizes: '(min-width: 48rem) 70ch, 100vw'`. It is `eager` only when it is the first `<img>` inside `<main>`; every other one is lazy.
4. Any other `<img>` keeps its `src` and attributes, and gains `loading="lazy" decoding="async"` when it has no `loading`. CSS from spec 02 overrides any fixed width, so it fits the column.

Other attributes on uploaded images (`width`, `height`, `style`, `class`) are dropped; the processed image sets its own dimensions. Identical tags are each replaced once, in order. The source folder is read once per file per build (memoised, as tranquility does).

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
| `embedFor(data, embeds)` | `config/embeds.js`, named export and filter. Returns `{ key, src, title }` or `null`. `null` unless `embed` is a key of `embeds` and `embed_src`, after turning a leading `//` into `https://`, parses as a URL whose protocol is `https:` and whose host is exactly the entry's `host` |
| `partials/embed.njk` | Nothing for `null`. Otherwise `<div class="embed embed--{key}"><iframe src title loading="lazy" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" allowfullscreen></iframe></div>` |
| CSS | `.embed { width: 100%; }` `.embed iframe { width: 100%; height: 100%; border: 0; }` and one `aspect-ratio` rule per key, in `60-content.css`. No inline style |
| Placement | `sections/page.njk` includes the embed after the body |

### Workflow

In the `build` job, before the Build step, `actions/cache` (current major tag; spec 09 pins every action to a SHA) restores `.cache/images` with `key: images-${{ hashFiles('package-lock.json', 'config/images.js') }}-${{ hashFiles('site/static/uploads/**', 'site/assets/images/**') }}` and `restore-keys: images-${{ hashFiles('package-lock.json', 'config/images.js') }}-`. A new sharp version or changed image settings start a fresh cache; a new upload saves a new cache that still starts from the last one. A cold build still works. The `deploy` job gets no cache: it runs no npm code.

### Test fixtures

| | |
|---|---|
| `tests/fixtures/uploads.mjs` | `writeFixtureUploads(dir)` writes, with sharp: `fixture-wide.png` (1600 by 900), `fixture-huge.png` (6000 by 4000), `Fixture Space.PNG` (900 by 600), `fixture.gif` (1 by 1), and `fixture.svg` (text, `width="10" height="10"`). Nothing binary is committed |
| `tests/serve.js <content dir> <port> [--uploads]` | With `--uploads`, writes the fixture uploads into a temporary folder and builds with `UPLOADS` set to it |
| `tests/playwright.config.js` | The `fixtures/content` server on 1313 runs with `--uploads` |

---

## Manual steps (maintainer)

1. After merge, upload a large photo through Pages CMS into a notice body and check on a phone that it loads quickly and fits.

---

## Acceptance

- [ ] `npm test` passes.
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

**Architecture:** `picture` learns a second source folder, the uploads, while the original files keep their `/uploads/` URLs. One function decides between `<picture>` and a plain image. An Eleventy transform runs that function over every `<img>` in the built HTML, so bodies stay untouched in the content files and Paul's editor never sees the rewritten markup. Embeds are validated against a host list in data by a pure function.

**Tech Stack:** Eleventy 3.1.6 transforms, sharp, `entities`, GitHub Actions cache, `node:test`, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- WebP widths exactly 480, 800, 1200, 1600, never above the original. Quality as spec 02 (`webp: 75`).
- No binary fixtures in the repo. Test images are written by `writeFixtureUploads`.
- Nothing about a missing or foreign image may fail a build or print a warning.
- Embed hosts only from `embeds.yaml`.

### Review Focus

1. Paul uploads a 6000 by 4000 phone photo. Expected: largest WebP is 1600 wide, fallback 800, page weight stays low. Pinned by the unit test "a huge upload is capped at 1600".
2. Paul deletes an image still used in a body. Expected: a plain `<img>` pointing at the missing file, the build passes. Pinned by "a missing upload stays a plain lazy image".
3. Body HTML with single-quoted attributes, upper-case `IMG`, or `alt` containing `>` or quotes. Expected: rewritten correctly, alt preserved and escaped once. Pinned by "odd img markup is read".
4. An image file name with spaces or capitals (`Website_large.jpg`, `My Photo.JPG`). Expected: processed, the published URL works and `srcset` has no space. Pinned by "an own-domain upload with a space in its name is processed".
5. Paul pastes an embed address from a different host, a look-alike host or a `javascript:` URL. Expected: nothing rendered. Pinned by the `embedFor` tests and the scenario "An embed on another host shows nothing".
6. The transform touching the hero or the map, which are already pictures, and making the hero lazy. Pinned by "processed pictures are left alone" and spec 04's "the hero image loads straight away".

---

### Task 1: Uploads through `picture`

**Files:**
- Modify: `config/images.js` (`UPLOADS_DIR`, uploads in `pictureHtml`, file name slug), `config/assets.js` (copy `UPLOADS` to `/uploads`)
- Modify: `site/_includes/partials/image.njk`
- Create: `tests/fixtures/uploads.mjs`
- Modify: `tests/serve.js` (`--uploads`), `tests/playwright.config.js`
- Modify: `tests/fixtures/content/blog/a8.md` (`image: /uploads/fixture-wide.png`, `image_alt: Wide`)
- Modify: `tests/unit/images.test.mjs`, `tests/features/blog.feature`

**Interfaces:**
- Consumes: `pictureHtml`, `assetPath` (specs 02 to 04).
- Produces: `UPLOADS_DIR`, `pictureHtml(opts, { assets, uploads, out })` with the contract above, `writeFixtureUploads(dir)`, `tests/serve.js --uploads`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/images.test.mjs`, with `writeFixtureUploads(uploads)` in `before`:

```js
const up = (src, extra = {}) => pictureHtml({ src, alt: 'A', ...extra }, { assets: tmp, uploads, out });

test('an upload is a picture at every width up to the original', async () => {
  const html = await up('/uploads/fixture-wide.png');
  assert.deepEqual([...html.matchAll(/\.webp (\d+)w/g)].map((m) => m[1]), ['480', '800', '1200', '1600']);
  assert.match(html, /<img src="\/images\/fixture-wide-800\.\w{8}\.png"[^>]* width="800" height="450"/);
});

test('a huge upload is capped at 1600', async () => {
  const html = await up('/uploads/fixture-huge.png');
  assert.match(html, /1600w"/);
  assert.doesNotMatch(html, /(2400|3200|6000)w/);
});

test('a file name with spaces and capitals is processed under a safe name', async () => {
  const html = await up('/uploads/Fixture%20Space.PNG');
  assert.match(html, /srcset="\/images\/fixture-space-480\.\w{8}\.webp 480w/);
});

test('a GIF and an SVG are plain images with their size', async () => {
  assert.equal(await up('/uploads/fixture.gif'), '<img src="/uploads/fixture.gif" alt="A" width="1" height="1" loading="lazy" decoding="async">');
  assert.match(await up('/uploads/fixture.svg'), /^<img src="\/uploads\/fixture\.svg" alt="A"[^>]* loading="lazy" decoding="async">$/);
});

test('a missing upload or another site is a plain lazy image, never an error', async () => {
  assert.equal(await up('/uploads/deleted.jpg'), '<img src="/uploads/deleted.jpg" alt="A" loading="lazy" decoding="async">');
  assert.equal(await up('https://media.acny.uk/x.jpg'), '<img src="https://media.acny.uk/x.jpg" alt="A" loading="lazy" decoding="async">');
});

test('a missing layout asset is still an error', async () => {
  await assert.rejects(up('images/missing.png'));
});
```

In `tests/features/blog.feature`, "An article page" now expects `the image is a responsive picture described as "Wide"`.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "article page"`
Expected: FAIL. `pictureHtml` has no `uploads` option and `a8` shows a plain image.

- [ ] **Step 3: Extend `pictureHtml`, `image.njk`, `assets.js`, write `uploads.mjs`, and add `--uploads` to `serve.js` and the 1313 server**

`serve.js` parses its flags with `node:util` `parseArgs`, writes the uploads into `mkdtempSync(join(tmpdir(), 'stpauls-uploads-'))`, and passes `UPLOADS` in the build's `env`.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass. Spec 04's home scenario ("the "Fixture article 8" card image is 350 by 300") now crops the upload.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Serve uploads as resized WebP through picture"
```

---

### Task 2: Images inside rich text bodies

**Files:**
- Modify: `config/images.js` (`optimiseImages`, the transform)
- Create: `tests/fixtures/content/notices/images.md` (`title: Fixture images`, `date: 2015-03-01`)
- Modify: `tests/unit/images.test.mjs`
- Create: `tests/features/images.feature`, `tests/steps/images.js`
- Modify: `tests/features/notices.feature` (card order: `Fixture images` between `Fixture wide...` and `Fixture dated`), `tests/features/feeds.feature` (notices feed count 7 to 8)

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
- Consumes: `pictureHtml` (Task 1).
- Produces: `optimiseImages(html, { assets, uploads, out }): Promise<string>` and the `images` transform. Spec 07 relies on it: migrated bodies keep plain `<img src="/uploads/...">` tags. Spec 09 adds its `noopener` transform after it.

- [ ] **Step 1: Write the failing tests**

`tests/unit/images.test.mjs`:

```js
const page = (body) => `<header><img src="/images/map-800.abcd1234.png" alt=""></header><main>${body}</main>`;
const run = (body) => optimiseImages(page(body), { assets: tmp, uploads, out });

test('an upload in a body becomes a picture, its own attributes dropped', async () => {
  const html = await run('<p><img src="/uploads/fixture-wide.png" alt="Wide one" width="1024" style="float:left"></p>');
  assert.match(html, /<main><p><picture>[\s\S]*width="800" height="450"[\s\S]*<\/picture><\/p>/);
  assert.doesNotMatch(html, /float:left|width="1024"/);
});

test('odd img markup is read and alt is escaped once', async () => {
  for (const tag of [`<IMG SRC='/uploads/fixture-huge.png' ALT='Quote " and > inside'>`, `<IMG SRC='/uploads/fixture-huge.png' ALT='Quote &quot; and &gt; inside'>`]) {
    const html = await run(tag);
    assert.match(html, /<picture>[\s\S]*alt="Quote &#34; and &gt; inside"/);
    assert.doesNotMatch(html, /inside'>/);
  }
});

test('an own-domain upload with a space in its name is processed', async () => {
  const html = await run('<img src="http://stpaulswarton.co.uk/uploads/Fixture Space.PNG" alt="Spaces">');
  assert.match(html, /<picture>[\s\S]*fixture-space-480\.\w{8}\.webp 480w/);
});

test('a hot-linked image keeps its attributes and becomes lazy', async () => {
  const html = await run('<img src="https://media.acny.uk/x.jpg" alt="Hot linked" width="1024">');
  assert.match(html, /<img src="https:\/\/media\.acny\.uk\/x\.jpg" alt="Hot linked" width="1024" loading="lazy" decoding="async">/);
});

test('only the first image in main is eager', async () => {
  const html = await run('<img src="/uploads/fixture-wide.png" alt="1"><img src="/uploads/fixture-wide.png" alt="2">');
  const imgs = [...html.split('<main>')[1].matchAll(/<img [^>]*>/g)].map((m) => m[0]);
  assert.doesNotMatch(imgs[0], /loading=/);
  assert.match(imgs[1], /loading="lazy"/);
});

test('processed pictures are left alone', async () => {
  const html = await run('');
  assert.match(html, /<header><img src="\/images\/map-800\.abcd1234\.png" alt=""><\/header>/);
});
```

`tests/features/images.feature`:

```gherkin
Feature: Images
  Uploads reach a phone as small WebP files. Anything else still fits.

  Scenario: Uploads in a body are responsive pictures
    When I open "/notices/notice/images"
    Then the "Wide one" image is a responsive picture at widths "480, 800, 1200, 1600"
    And the "Wide one" image is 800 by 450
    And the "Quote \" and > inside" image is a responsive picture at widths "480, 800, 1200, 1600"
    And the "Spaces" image is a responsive picture at widths "480, 800"

  Scenario: Other images stay as they are and load lazily
    When I open "/notices/notice/images"
    Then the "Hot linked" image comes from "https://media.acny.uk/x.jpg" and loads lazily
    And the "Gone" image comes from "/uploads/deleted.jpg" and loads lazily
    And the "Gif" image comes from "/uploads/fixture.gif" and loads lazily

  Scenario: Big images never push the page sideways
    Given a phone screen
    When I open "/notices/notice/images"
    Then the page does not scroll sideways
```

New steps in `tests/steps/images.js`: "the {string} image is a responsive picture at widths {string}" (the `img` with that `alt` sits in a `picture` whose WebP `source` `srcset` lists those widths), "the {string} image is {int} by {int}" (`width` and `height` attributes), "the {string} image comes from {string} and loads lazily".

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "Images|images"`
Expected: FAIL. Body images are untouched.

- [ ] **Step 3: Write `optimiseImages` and register the transform**

Memoise `pictureHtml` per `src` and `eager` within a build, cleared in `eleventy.before`. The transform returns non-HTML output unchanged.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add config tests
git commit -m "Rewrite rich text images into responsive pictures"
```

---

### Task 3: Embeds as page fields

**Files:**
- Create: `site/data/embeds.yaml`, `config/embeds.js`, `site/_includes/partials/embed.njk`
- Modify: `site/_includes/sections/page.njk`, `site/assets/css/60-content.css`
- Modify: `.pages.yml` (two fields on every `page-*` collection, after `body`)
- Create: `tests/fixtures/content/page/about/church-diary.md` (`embed: google-calendar`, `embed_src` the live calendar URL), `tests/fixtures/content/page/gallery/bad-host.md` (`embed: google-calendar`, `embed_src: https://evil.example/calendar`), `tests/fixtures/content/page/gallery/script-url.md` (`embed: facebook-album`, `embed_src: "javascript:alert(1)"`)
- Modify: `tests/fixtures/content/page/gallery/church-gallery.md` (`embed: facebook-album`, `embed_src: //embedsocial.com/facebook_album/album_photos/866062123490460`)
- Create: `tests/unit/embeds.test.mjs`
- Modify: `tests/features/images.feature`, `tests/steps/images.js`, `tests/features/editor.feature`, `tests/steps/editor.js`

None of the new fixture pages sets `header` or `footer`, so the menus in spec 04's scenarios do not change.

**Interfaces:**
- Consumes: `sections/page.njk` (spec 04).
- Produces: `embedFor(data, embeds): { key, src, title } | null`, the global `embeds`, `partials/embed.njk`. Spec 07 writes `embed` and `embed_src` when migrating. Spec 09 builds `frame-src` from `embeds.yaml`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/embeds.test.mjs`:

```js
import { embedFor } from '../../config/embeds.js';
const embeds = { 'google-calendar': { host: 'calendar.google.com', title: 'Church diary' }, 'facebook-album': { host: 'embedsocial.com', title: 'Photos' } };

test('a known embed on its own host', () => {
  assert.deepEqual(embedFor({ embed: 'google-calendar', embed_src: 'https://calendar.google.com/calendar/embed?src=x' }, embeds),
    { key: 'google-calendar', src: 'https://calendar.google.com/calendar/embed?src=x', title: 'Church diary' });
});

test('a protocol-relative address becomes https', () => {
  assert.equal(embedFor({ embed: 'facebook-album', embed_src: '//embedsocial.com/a/1' }, embeds).src, 'https://embedsocial.com/a/1');
});

test('another host, a look-alike host, http, javascript or an unknown type give nothing', () => {
  for (const [embed, embed_src] of [
    ['google-calendar', 'https://evil.example/calendar'],
    ['google-calendar', 'https://calendar.google.com.evil.example/x'],
    ['google-calendar', 'http://calendar.google.com/x'],
    ['facebook-album', 'javascript:alert(1)'],
    ['youtube', 'https://calendar.google.com/x'],
    ['google-calendar', ''],
  ]) assert.equal(embedFor({ embed, embed_src }, embeds), null, embed_src);
});
```

Add to `tests/features/images.feature`:

```gherkin
  Scenario: The church diary is a sandboxed, responsive calendar
    When I open "/page/about/church-diary"
    Then the page embeds "https://calendar.google.com/calendar/embed?src=wartonstpauls%40gmail.com&ctz=Europe/London" titled "Church diary"
    And the embed is 4 by 3

  Scenario: A protocol-relative gallery address is loaded over https
    When I open "/page/gallery/church-gallery"
    Then the page embeds "https://embedsocial.com/facebook_album/album_photos/866062123490460" titled "Photos from the church Facebook page"

  Scenario: An embed on another host shows nothing
    When I open "/page/gallery/bad-host"
    Then the page has no embed
    When I open "/page/gallery/script-url"
    Then the page has no embed
```

New steps: "the page embeds {string} titled {string}" (one `iframe` in `.embed` with that `src` and `title`, `loading="lazy"`, the `sandbox` and `referrerpolicy` values above), "the embed is {int} by {int}" (the `.embed` box's width over height, within 1 percent), "the page has no embed".

In `tests/features/editor.feature`, the page collection field list becomes "title, summary, header, footer, weight, image, image_alt, body, embed, embed_src, url, layout", and:

```gherkin
  Scenario: Embed types match the site's embeds
    Then the "page-about" collection offers the site embeds as "embed"
```

New step in `tests/steps/editor.js`, reading `site/data/embeds.yaml` keys as the topics step reads `topics.yaml`.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "embed|Pages CMS"`
Expected: FAIL.

- [ ] **Step 3: Write `embeds.yaml`, `embeds.js`, `embed.njk`, the CSS, and the Pages CMS fields**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass. The two embed hosts are not reached: the scenarios check the markup and box, not the frame's content.

- [ ] **Step 5: Commit**

```bash
git add config site tests .pages.yml
git commit -m "Add embeds as validated page fields"
```

---

### Task 4: Cache processed images in the workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `tests/unit/workflow.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('the build restores the image cache before it builds', () => {
  const steps = wf.jobs.build.steps;
  const cache = steps.findIndex((s) => /^actions\/cache@/.test(s.uses ?? ''));
  assert.ok(cache >= 0, 'no actions/cache step');
  assert.equal(steps[cache].with.path, '.cache/images');
  assert.match(steps[cache].with.key, /hashFiles\('package-lock\.json', 'config\/images\.js'\)/);
  assert.match(steps[cache].with['restore-keys'], /^images-/);
  assert.ok(cache < steps.findIndex((s) => s.run === 'npm run build'));
  assert.ok(!wf.jobs.deploy.steps.some((s) => /^actions\/cache@/.test(s.uses ?? '')));
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm run test:unit`
Expected: FAIL, no cache step.

- [ ] **Step 3: Add the cache step** as in the Workflow requirement.

- [ ] **Step 4: Run the suite and `actionlint .github/workflows/deploy.yml`**

Expected: all pass, no actionlint output.

- [ ] **Step 5: Commit**

```bash
git add .github tests
git commit -m "Cache processed images between builds"
git push -u origin <session branch>
```
