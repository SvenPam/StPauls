---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 08: contact form and site settings

_One session. Adds a Site settings file that Paul edits in Pages CMS, moves the footer details into it, and builds the contact form on Web3Forms with a placeholder key, so the form switches on when someone pastes a real key. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

`/contact` has a working, accessible form the moment a Web3Forms key is set in Settings, and shows the address and contact list until then. Changing the inbox, the enquiry types, the address or the Facebook link needs no code.

## Starting point

- Specs 00 to 07 on `main`, on Eleventy.
- Spec 04 contact placeholder: `site/content/page/about/contact-us.md` (`url: /contact`, `layout: contact.njk`), include `site/_includes/contact.njk` showing the address and a "Church contact list" link to `/page/about/contact-list`.
- Footer address, map link, directions link and Facebook link are written in `site/_includes/partials/footer.njk`.
- `config/data.js` makes one global per `site/data/*.yaml` file and exports `readData()` (spec 05). There is no way to swap a data file for a test.
- `tests/serve.js <content dir> <port> [--uploads]` (spec 06). Servers: `fixtures/content` on 1313 with uploads, `fixtures/empty` on 1314.
- `site/assets/js/site.js`: menu toggle and expired events, minified with terser, under 2048 bytes (the `layout.feature` budget).
- Root content files with a `url` are published there (spec 04). `sitemap: false` keeps a page out of `sitemap.xml` (spec 05). `site.url` is `https://stpaulswarton.co.uk` (spec 05).
- Live form fields: Name, Enquiry Type (General Enquiry, Website Enquiry, Weddings and Baptisms, MU, WI), Message, Email, Phone. Believed not to deliver.
- Web3Forms behaviour: see [checked facts](page-cms-spec-conventions.md#web3forms-docs-mirror-surjithctlyweb3forms-docs).
- Decision: one inbox for every enquiry type. The inbox is not known yet.

## In scope

- `site/data/settings.yaml` and a "Site settings" file entry in Pages CMS.
- Footer and contact page read from settings.
- The form, a thanks page at `/contact/thanks`, the subject line carrying the enquiry type when script runs.
- A `DATA` folder layered over `site/data` so tests use fixture settings, and `tests/serve.js --data <dir>`.
- A how-to for creating the Web3Forms key.

## Out of scope

CSP `form-action` (spec 09). Choosing the inbox (the church, later). hCaptcha: _builder's call_, not used, because it needs a third-party script on the page; the honeypot is the only spam guard to start with, and the how-to explains how to turn hCaptcha on if spam arrives.

---

## Requirements

### `site/data/settings.yaml`

```yaml
contact_access_key: ""
contact_subject: "Website enquiry"
enquiry_types:
  - General Enquiry
  - Website Enquiry
  - Weddings and Baptisms
  - MU
  - WI
address:
  - Church Road
  - Warton
  - Lancashire
  - PR4 1BD
facebook_url: "https://www.facebook.com/stpaulswarton"
map_url: "<the Google Maps place URL from the current footer>"
directions_url: "https://www.google.com/maps/dir/?api=1&destination=53.7513578,-2.8932638"
```

### Layered data (`config/data.js`)

| | |
|---|---|
| `DATA` | Optional folder, relative to the repo root (the build runs there). `serve.js --data <dir>` resolves `<dir>` the same way as the content folder, from where `serve.js` runs, and passes it on relative to the repo root, so `--data fixtures/data/with-key` from `tests/` becomes `DATA=tests/fixtures/data/with-key`. For each file name, `DATA/{name}.yaml` wins over `site/data/{name}.yaml`; every other file still comes from `site/data`. A file only in `DATA` is added |
| Globals and `readData()` | Both use the layered set, so `buildSwaConfig` (spec 05) and the templates see the same data |
| `tests/serve.js` | `--data <dir>` sets `DATA` for the build |
| `config/topics.js` | Keeps reading `site/data/topics.yaml` directly. Fixtures never override topics |

### Pages CMS entry

| | |
|---|---|
| Entry | `name: settings`, `label: Site settings`, `type: file`, `path: site/data/settings.yaml`, `format: yaml`, `operations: { delete: false }` |
| `contact_access_key` | `string`, label "Contact form key", description "From web3forms.com. Leave empty to hide the form.", `pattern: { regex: "^$\|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", message: "Paste the whole key, or leave it empty" }` |
| `contact_subject` | `string`, required, label "Email subject" |
| `enquiry_types` | `string`, `list: true`, label "Enquiry types" |
| `address` | `string`, `list: true`, label "Address lines" |
| `facebook_url`, `map_url`, `directions_url` | `string`, labels "Facebook page", "Map link", "Directions link" |

### When the form shows

`contactKey(settings)` in `config/contact.js` (named export and filter) returns the key when `contact_access_key` matches the UUID pattern above exactly, untrimmed, and `''` otherwise. The form renders only for a non-empty result. Otherwise the contact page shows the address and the contact list link, as now. A key that fails the pattern is treated as empty.

`enquiryTypes(settings)` returns `enquiry_types` without empty entries, or `['General Enquiry']` when that leaves nothing, so the required select never blocks sending.

### Form (`site/_includes/contact.njk`)

```html
<form class="contact-form" action="https://api.web3forms.com/submit" method="POST">
  <input type="hidden" name="access_key" value="{key}">
  <input type="hidden" name="subject" value="{contact_subject}">
  <input type="hidden" name="from_name" value="St Paul's Warton website">
  <input type="hidden" name="redirect" value="https://stpaulswarton.co.uk/contact/thanks">
  <input type="checkbox" name="botcheck" class="contact-form__trap" tabindex="-1" autocomplete="off" aria-hidden="true">
  ...visible fields...
  <button type="submit" class="button">Send</button>
</form>
```

| Field | `name` | Element | Required | `autocomplete` |
|---|---|---|---|---|
| Name | `name` | `input type=text` | yes | `name` |
| Enquiry type | `enquiry_type` | `select` with `enquiryTypes(settings)` | yes | |
| Message | `message` | `textarea rows=6` | yes | |
| Email | `email` (Web3Forms uses it as reply-to) | `input type=email` | yes | `email` |
| Phone | `phone` | `input type=tel` | no, label says "(optional)" | `tel` |

Every field has a visible `<label for>` and an `id` equal to its `name`. Above the button: one sentence saying the message is emailed to the church and linking to `/page/about/privacy-policy`. `.contact-form__trap` is `display: none` in CSS (no inline style). `redirect` is `{{ site.url }}/contact/thanks`, so it is absolute on the real domain whatever host serves the page. Nunjucks autoescape escapes every settings value once.

### Script

`site.js`: when `.contact-form` exists, on load and on `change` of `enquiry_type`, set the hidden `subject` to `{contact_subject}: {type}`. Without script the subject stays `{contact_subject}` and the type is still in the email body. The minified script stays under 2048 bytes.

### Thanks page

`site/content/contact-thanks.md`: `title: Thank you`, `url: /contact/thanks`, `sitemap: false`, body "Thank you for getting in touch. Someone from the church will reply as soon as they can." plus a link home. Rendered by `sections/page.njk` (spec 04's dispatch for root files). Not in Pages CMS.

### How-to (`docs/features/page-cms/page-cms-how-to-set-up-the-contact-form.md`)

Who does it (whoever will receive enquiries, with the maintainer), creating the key at web3forms.com with the receiving address, pasting it into Site settings in Pages CMS, sending a test message, what the free plan allows (about 250 a month), what to do about spam (turn on hCaptcha in the Web3Forms dashboard and ask the maintainer to add its script and CSP entry), and how to change the inbox (new key, paste, done).

### Test fixtures

| | |
|---|---|
| `tests/fixtures/data/no-key/settings.yaml` | Every key, `contact_access_key: ""`, the live address and links |
| `tests/fixtures/data/with-key/settings.yaml` | Every key; `contact_access_key: 0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a`, the five live enquiry types, `address: ["St Paul's & Hall", Church Road, Warton, PR4 1BD]`, `facebook_url: https://www.facebook.com/fixture` |
| `tests/playwright.config.js` | 1313 gains `--data fixtures/data/no-key`, so no scenario reads Paul's settings. A third server on 1315 builds `fixtures/content` with `--uploads --data fixtures/data/with-key` |
| `tests/steps/fixtures.js` | `KEYED_SITE = 'http://localhost:1315'` next to `EMPTY_SITE` |

A bad key and an empty list of enquiry types are covered by unit tests on `contactKey` and `enquiryTypes`, so they need no server.

---

## Manual steps (maintainer)

1. After merge, check Site settings appears in Pages CMS and that changing the Facebook link changes the footer after the deploy (then change it back).
2. When the church picks an inbox: follow the how-to with them.

---

## Acceptance

- [ ] `npm test` passes.
- [ ] With an empty key, `/contact` has no `<form>` and shows the address and the contact list link.
- [ ] With a fixture key, `/contact` has the form posting to Web3Forms with every field labelled and the honeypot hidden.
- [ ] The footer address and Facebook link come from settings.
- [ ] `/contact/thanks` exists and is not in `sitemap.xml`.
- [ ] The script is still under 2048 bytes.
- [ ] Site settings appears in Pages CMS (maintainer).

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settings Paul can edit, and a contact form that turns on with one pasted key.

**Architecture:** One YAML data file feeds the footer and the contact page. Two pure functions decide whether the form shows and which enquiry types it offers. Tests swap the data file through a `DATA` folder layered over `site/data`, never touching Paul's copy.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Web3Forms (plain HTML form), Pages CMS file entry, `node:test`, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Settings keys exactly as in the YAML block. Form field `name`s exactly as in the field table.
- No third-party script. The form is plain HTML that works with script off.
- Tests never read `site/data/settings.yaml`; every server builds with a fixture `DATA` folder.

### Review Focus

1. Paul pastes the key with a space or a line break, or pastes the whole HTML snippet Web3Forms shows. Expected: Pages CMS refuses it, and if it gets through, the form stays hidden rather than posting to a broken key. Pinned by the `contactKey` test and the scenario "A contact key Paul pastes".
2. Paul empties the enquiry types list. Expected: the select falls back to a single "General Enquiry" option. Pinned by the `enquiryTypes` test.
3. An address line with an apostrophe or ampersand. Expected: escaped once, shown correctly. Pinned by the scenario "The footer comes from settings".
4. Screen reader and keyboard users: every field labelled, the honeypot never focusable or announced. Pinned by "Every field is labelled" and "The spam trap is invisible".
5. The redirect pointing at the test URL or a relative path, which Web3Forms rejects. Pinned by "The form posts to Web3Forms and comes back to the real domain".
6. A fixture data folder hiding a real data file it does not replace. Pinned by the `readData` test "fixture files win, the rest still come from site/data".

---

### Task 1: Settings file, layered data and footer

**Files:**
- Create: `site/data/settings.yaml`
- Modify: `config/data.js` (`DATA`), `site/_includes/partials/footer.njk`, `site/_includes/contact.njk` (address from settings)
- Modify: `tests/serve.js` (`--data`), `tests/playwright.config.js`, `tests/steps/fixtures.js`
- Create: `tests/fixtures/data/no-key/settings.yaml`, `tests/fixtures/data/with-key/settings.yaml`
- Create: `tests/unit/data.test.mjs`
- Create: `tests/features/contact.feature`, `tests/steps/contact.js`

**Interfaces:**
- Produces: the global `settings` with the keys above, `DATA` layering in `readData()` and the globals, `tests/serve.js --data <dir>`, `KEYED_SITE`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/data.test.mjs` runs `readData()` in a child process with `DATA=tests/fixtures/data/with-key` (the folder is read at import):

```js
test('fixture files win, the rest still come from site/data', () => {
  const out = execFileSync('node', ['-e', "import('./config/data.js').then((m) => console.log(JSON.stringify(m.readData())))"],
    { env: { ...process.env, DATA: 'tests/fixtures/data/with-key' } });
  const data = JSON.parse(out);
  assert.equal(data.settings.facebook_url, 'https://www.facebook.com/fixture');
  assert.equal(data.site.title, "St Paul's Warton");
  assert.ok(data.topics.website);
});
```

`tests/features/contact.feature`:

```gherkin
Feature: Contact form and site settings

  Scenario: The footer comes from settings
    When I open "/notices" on the site with a contact key
    Then the footer shows "St Paul's & Hall"
    And the footer "Find us on Facebook" link goes to "https://www.facebook.com/fixture"
```

New steps: "I open {string} on the site with a contact key" in `tests/steps/site.js` (`KEYED_SITE`), "the footer shows {string}" and "the footer {string} link goes to {string}" in `tests/steps/contact.js`. Spec 04's contact placeholder scenario ("I see \"PR4 1BD\"") now reads `fixtures/data/no-key`, not Paul's file.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "settings"`
Expected: FAIL. No `DATA` layering, no 1315 server, the footer is hard-coded.

- [ ] **Step 3: Write `settings.yaml`, the layering, `--data`, the third server, and move the footer and contact address into settings**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass, with three servers starting.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Move footer details into an editable settings file"
```

---

### Task 2: Contact form and thanks page

**Files:**
- Create: `config/contact.js`
- Modify: `site/_includes/contact.njk`
- Create: `site/content/contact-thanks.md`, `tests/fixtures/content/contact-thanks.md` (same)
- Modify: `site/assets/css/50-components.css` (form styles), `site/assets/js/site.js` (subject)
- Create: `tests/unit/contact.test.mjs`
- Modify: `tests/features/contact.feature`, `tests/steps/contact.js`, `tests/features/sitemap.feature`

**Interfaces:**
- Consumes: `settings`, `site.url`, `sitemap: false` (spec 05), root `url` files (spec 04).
- Produces: `contactKey(settings): string`, `enquiryTypes(settings): string[]`, `.contact-form` markup used by spec 09's CSP (`form-action`).

- [ ] **Step 1: Write the failing tests**

`tests/unit/contact.test.mjs`:

```js
import { contactKey, enquiryTypes } from '../../config/contact.js';
const KEY = '0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a';

test('only a whole key turns the form on', () => {
  assert.equal(contactKey({ contact_access_key: KEY }), KEY);
  for (const bad of ['', ` ${KEY}\n`, `<input value="${KEY}">`, KEY.slice(0, -1), undefined])
    assert.equal(contactKey({ contact_access_key: bad }), '', JSON.stringify(bad));
});

test('enquiry types fall back to one when empty', () => {
  assert.deepEqual(enquiryTypes({ enquiry_types: ['MU', ''] }), ['MU']);
  assert.deepEqual(enquiryTypes({ enquiry_types: [] }), ['General Enquiry']);
  assert.deepEqual(enquiryTypes({}), ['General Enquiry']);
});
```

Add to `tests/features/contact.feature`:

```gherkin
  Scenario: Without a key the contact page shows the address
    When I open "/contact"
    Then there is no contact form
    And I see "PR4 1BD"
    And the "Church contact list" link goes to "/page/about/contact-list"

  Scenario: The form posts to Web3Forms and comes back to the real domain
    When I open "/contact" on the site with a contact key
    Then the contact form posts to "https://api.web3forms.com/submit"
    And the form sends "access_key" as "0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a"
    And the form sends "from_name" as "St Paul's Warton website"
    And the form sends "redirect" as "https://stpaulswarton.co.uk/contact/thanks"

  Scenario: Every field is labelled
    When I open "/contact" on the site with a contact key
    Then the "Name" field is required
    And the "Enquiry type" field is required
    And the "Message" field is required
    And the "Email" field is required
    And the "Phone (optional)" field is optional
    And the enquiry types are, in order:
      | General Enquiry       |
      | Website Enquiry       |
      | Weddings and Baptisms |
      | MU                    |
      | WI                    |
    And the "privacy policy" link goes to "/page/about/privacy-policy"

  Scenario: The spam trap is invisible
    When I open "/contact" on the site with a contact key
    Then the spam trap is hidden and cannot be reached with Tab

  Scenario: The subject carries the enquiry type
    When I open "/contact" on the site with a contact key
    And I choose "Weddings and Baptisms" as the enquiry type
    Then the form sends "subject" as "Website enquiry: Weddings and Baptisms"

  Scenario: Without script the subject is the plain one
    Given scripts are off
    When I open "/contact" on the site with a contact key
    Then the form sends "subject" as "Website enquiry"

  Scenario: The thanks page
    When I open "/contact/thanks"
    Then the page heading is "Thank you"
```

In `tests/features/sitemap.feature`, add `https://stpaulswarton.co.uk/contact/thanks` to the "does not list" table. The "One small stylesheet and one small deferred script" scenario keeps the script under 2048 bytes. New steps in `tests/steps/contact.js`: "there is no contact form", "the contact form posts to {string}" (`action` and `method`), "the form sends {string} as {string}" (the named control's value), "the {string} field is required" and "the {string} field is optional" (found with `getByLabel`), "the enquiry types are, in order:", "the spam trap is hidden and cannot be reached with Tab" (hidden, `tabindex="-1"`, `aria-hidden="true"`, and pressing Tab through the form never focuses it), "I choose {string} as the enquiry type".

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:unit && npm run test:bdd -- --grep "contact|Contact|thanks|subject|spam"`
Expected: FAIL.

- [ ] **Step 3: Write `contact.js`, the form in `contact.njk`, the thanks page, the CSS and the script change**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add config site tests
git commit -m "Add the contact form behind a settings key"
```

---

### Task 3: Pages CMS entry and how-to

**Files:**
- Modify: `.pages.yml`
- Create: `docs/features/page-cms/page-cms-how-to-set-up-the-contact-form.md`
- Modify: `tests/features/editor.feature`, `tests/steps/editor.js`

- [ ] **Step 1: Write the failing scenarios**

```gherkin
  Scenario: Site settings are one entry Paul cannot delete
    Then the "settings" entry edits the file "site/data/settings.yaml"
    And the "settings" entry has the fields "contact_access_key, contact_subject, enquiry_types, address, facebook_url, map_url, directions_url"

  Scenario: A contact key Paul pastes
    Then a contact key of "0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a" is allowed
    And a contact key of "" is allowed
    And a contact key of " 0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a" is refused
    And a contact key of "<input value=\"0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a\">" is refused
```

The two entry steps come from spec 04. New step "a contact key of {string} is {word}", testing the field's `pattern.regex` as the title step does. The how-to gets no test: it is a document.

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:bdd -- --grep "Pages CMS"`
Expected: FAIL on the new scenarios.

- [ ] **Step 3: Write the entry and the how-to**

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: all pass, including "Whatever Paul has saved builds".

- [ ] **Step 5: Commit**

```bash
git add .pages.yml docs tests
git commit -m "Add Site settings to Pages CMS and a contact form how-to"
git push -u origin <session branch>
```
