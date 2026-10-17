---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 08: contact form and site settings

_One session. Adds a Site settings file that Paul edits in Pages CMS, moves the footer details into it, and builds the contact form on Web3Forms with a placeholder key, so the form switches on when someone pastes a real key. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

`/contact` has a working, accessible form the moment a Web3Forms key is set in Settings, and shows the address and contact list until then. Changing the inbox, the enquiry types, the address or the Facebook link needs no code.

## Starting point

- Spec 04 contact placeholder: `site/content/page/about/contact-us.md` (`url: /contact`, `layout: contact`), template `site/layouts/contact.html` showing the address and a link to `/page/about/contact-list`.
- Footer address, map link, directions link and Facebook link are written in `site/layouts/_partials/footer.html`.
- Live form fields: Name, Enquiry Type (General Enquiry, Website Enquiry, Weddings and Baptisms, MU, WI), Message, Email, Phone. Believed not to deliver.
- Web3Forms behaviour: see [checked facts](page-cms-spec-conventions.md#web3forms-docs-mirror-surjithctlyweb3forms-docs).
- Decision: one inbox for every enquiry type. The inbox is not known yet.

## In scope

- `site/data/settings.yaml` and a "Site settings" file entry in Pages CMS.
- Footer and contact page read from settings.
- The form, a thanks page at `/contact/thanks`, the subject line carrying the enquiry type when script runs.
- `build_site(..., data_dir=...)` so tests use fixture settings.
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

### Pages CMS entry

| | |
|---|---|
| Entry | `name: settings`, `label: Site settings`, `type: file`, `path: site/data/settings.yaml`, `format: yaml`, `operations: { delete: false }` |
| `contact_access_key` | `string`, label "Contact form key", description "From web3forms.com. Leave empty to hide the form.", `pattern: { regex: "^$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", message: "Paste the whole key, or leave it empty" }` |
| `contact_subject` | `string`, required, label "Email subject" |
| `enquiry_types` | `string`, `list: true`, label "Enquiry types" |
| `address` | `string`, `list: true`, label "Address lines" |
| `facebook_url`, `map_url`, `directions_url` | `string`, labels "Facebook page", "Map link", "Directions link" |

### When the form shows

The form renders only when `contact_access_key` matches the UUID pattern above. Otherwise the contact page shows the address and the contact list link, as now. A key that fails the pattern is treated as empty.

### Form

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
| Enquiry type | `enquiry_type` | `select` with `enquiry_types` | yes | |
| Message | `message` | `textarea rows=6` | yes | |
| Email | `email` (Web3Forms uses it as reply-to) | `input type=email` | yes | `email` |
| Phone | `phone` | `input type=tel` | no, label says "(optional)" | `tel` |

Every field has a visible `<label for>`. Above the button: one sentence saying the message is emailed to the church and linking to `/page/about/privacy-policy`. `.contact-form__trap` is `display: none` in CSS (no inline style). `redirect` uses `absURL`, so it follows `baseURL`.

### Script

`site.js`: when `.contact-form` exists, on `change` of `enquiry_type`, set the hidden `subject` to `{contact_subject}: {type}`. Without script the subject stays `{contact_subject}` and the type is still in the email body. Stay under the 2,048 byte budget.

### Thanks page

`site/content/contact-thanks.md`: `title: Thank you`, `url: /contact/thanks`, body "Thank you for getting in touch. Someone from the church will reply as soon as they can." plus a link home. Not in Pages CMS. Excluded from `sitemap.xml`.

### How-to (`docs/features/page-cms/page-cms-how-to-set-up-the-contact-form.md`)

Who does it (whoever will receive enquiries, with the maintainer), creating the key at web3forms.com with the receiving address, pasting it into Site settings in Pages CMS, sending a test message, what the free plan allows (about 250 a month), what to do about spam (turn on hCaptcha in the Web3Forms dashboard and ask the maintainer to add its script and CSP entry), and how to change the inbox (new key, paste, done).

### Test helper

`build_site(dest, content_dir=None, *, data_dir=None, uploads_dir=None, minify=False, strict=True)`: when `data_dir` is given, the temporary TOML mounts `data_dir` to `data` first and `site/data` to `data` second, so fixture files override real ones of the same name and the rest still come from `site/data`.

---

## Manual steps (maintainer)

1. After merge, check Site settings appears in Pages CMS and that changing the Facebook link changes the footer after the deploy (then change it back).
2. When the church picks an inbox: follow the how-to with them.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] With the real (empty) key, `/contact` has no `<form>` and shows the address and the contact list link.
- [ ] With a fixture key, `/contact` has the form posting to Web3Forms with every field labelled and the honeypot hidden.
- [ ] The footer address and Facebook link come from settings.
- [ ] `/contact/thanks` exists and is not in `sitemap.xml`.
- [ ] Site settings appears in Pages CMS (maintainer).

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Settings Paul can edit, and a contact form that turns on with one pasted key.

**Architecture:** One YAML data file feeds the footer and the contact page. The contact template decides between form and placeholder from the key's shape. Tests swap the data file through a layered mount, never touching Paul's copy.

**Tech Stack:** Hugo extended 0.167.0, Web3Forms (plain HTML form), Pages CMS file entry, Python 3 `unittest`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- Settings keys exactly as in the YAML block. Form field `name`s exactly as in the field table.
- No third-party script. The form is plain HTML that works with script off.
- Tests never read `site/data/settings.yaml` values; they build with `data_dir`.

### Review Focus

1. Paul pastes the key with a space or a line break, or pastes the whole HTML snippet Web3Forms shows. Expected: Pages CMS refuses it, and if it gets through, the form stays hidden rather than posting to a broken key. Pinned by `test_bad_key_hides_form`.
2. Paul empties the enquiry types list. Expected: the select falls back to a single "General Enquiry" option, never an empty required select that blocks sending. Pinned by `test_empty_enquiry_types`.
3. An address line with an apostrophe or ampersand. Expected: escaped once, shown correctly. Pinned by `test_settings_are_escaped`.
4. Screen reader and keyboard users: every field labelled, the honeypot never focusable or announced. Pinned by `test_fields_are_labelled` and `test_trap_is_hidden`.
5. The redirect pointing at the test URL or a relative path, which Web3Forms rejects. Pinned by `test_redirect_is_absolute_on_real_domain`.

---

### Task 1: Settings file and footer

**Files:**
- Create: `site/data/settings.yaml`
- Modify: `site/layouts/_partials/footer.html`
- Modify: `tests/helpers.py` (`data_dir`)
- Create: `tests/fixtures/data/with-key/settings.yaml` (every key; `contact_access_key: 0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a`, the five live enquiry types, `address: ["St Paul's & Hall", Church Road, Warton, PR4 1BD]`, `facebook_url: https://www.facebook.com/fixture`)
- Create: `tests/fixtures/data/bad-key/settings.yaml` (key ` 0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a\n`), `tests/fixtures/data/no-types/settings.yaml` (key set, `enquiry_types: []`)
- Create: `tests/test_settings.py`

**Interfaces:**
- Produces: `site.Data.settings` with the keys above; `build_site(..., data_dir=...)`.

- [ ] **Step 1: Write the failing tests**

```python
def test_footer_from_settings(self):
    foot = self.with_key_404.split("<footer", 1)[1]
    self.assertIn('href="https://www.facebook.com/fixture"', foot)

def test_settings_are_escaped(self):
    self.assertIn("St Paul&#39;s &amp; Hall", self.with_key_404)
    self.assertNotIn("&amp;amp;", self.with_key_404)

def test_real_settings_file_shape(self):
    # Shape only, never values: Paul edits this file.
    text = (REPO / "site/data/settings.yaml").read_text()
    for key in ("contact_access_key:", "contact_subject:", "enquiry_types:", "address:",
                "facebook_url:", "map_url:", "directions_url:"):
        self.assertIn(key, text)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_settings.py' -v`

- [ ] **Step 3: Write `settings.yaml`, move the footer values into it, extend `build_site`**

Once the footer reads settings, the footer assertions in `test_layout.py` (`PR4 1BD`, the Facebook URL) and the contact placeholder assertion in `test_pages.py` read Paul's file. Move them to builds with `data_dir=FIXTURES / "data/with-key"`.

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Move footer details into an editable settings file"
```

---

### Task 2: Contact form and thanks page

**Files:**
- Modify: `site/layouts/contact.html`
- Create: `site/content/contact-thanks.md`, `tests/fixtures/content/contact-thanks.md` (same)
- Modify: `site/layouts/sitemap.xml` (skip `/contact/thanks`)
- Modify: `site/assets/css/50-components.css` (form styles), `site/assets/js/site.js` (subject)
- Modify: `tests/test_settings.py`

**Interfaces:**
- Consumes: `site.Data.settings`, `absURL`.
- Produces: `.contact-form` markup used by spec 09's CSP test (`form-action`).

- [ ] **Step 1: Write the failing tests**

```python
def test_no_key_shows_placeholder(self):
    page = build_and_read(data_dir=None, path="contact/index.html")
    self.assertNotIn("<form", page)
    self.assertIn('href="/page/about/contact-list"', page)

def test_bad_key_hides_form(self):
    self.assertNotIn("<form", build_and_read(FIXTURES / "data/bad-key", "contact/index.html"))

def test_form_posts_to_web3forms(self):
    f = self.form
    self.assertIn('action="https://api.web3forms.com/submit" method="POST"', f)
    self.assertIn('name="access_key" value="0f9c7a52-1d2e-4c3b-9a8f-6b5e4d3c2b1a"', f)
    self.assertIn('name="from_name" value="St Paul&#39;s Warton website"', f)

def test_redirect_is_absolute_on_real_domain(self):
    self.assertIn('name="redirect" value="https://stpaulswarton.co.uk/contact/thanks"', self.form)

def test_fields_are_labelled(self):
    for fid, name in [("name", "name"), ("enquiry_type", "enquiry_type"), ("message", "message"),
                      ("email", "email"), ("phone", "phone")]:
        self.assertRegex(self.form, rf'<label for="{fid}"')
        self.assertRegex(self.form, rf'id="{fid}"[^>]*name="{name}"|name="{name}"[^>]*id="{fid}"')
    self.assertRegex(self.form, r'<input type="email"[^>]*required')
    self.assertNotRegex(self.form, r'name="phone"[^>]*required')

def test_trap_is_hidden(self):
    trap = re.search(r'<input type="checkbox" name="botcheck"[^>]*>', self.form).group(0)
    self.assertIn('tabindex="-1"', trap)
    self.assertIn('aria-hidden="true"', trap)
    css = built_css()
    self.assertIn(".contact-form__trap{display:none}", css)

def test_enquiry_types(self):
    self.assertEqual(re.findall(r"<option[^>]*>([^<]+)</option>", self.form),
                     ["General Enquiry", "Website Enquiry", "Weddings and Baptisms", "MU", "WI"])

def test_empty_enquiry_types(self):
    form = build_and_read(FIXTURES / "data/no-types", "contact/index.html")
    self.assertEqual(re.findall(r"<option[^>]*>([^<]+)</option>", form), ["General Enquiry"])

def test_privacy_link(self):
    self.assertIn('href="/page/about/privacy-policy"', self.form)

def test_thanks_page_not_in_sitemap(self):
    self.assertTrue((self.out / "contact/thanks/index.html").is_file())
    self.assertNotIn("/contact/thanks", (self.out / "sitemap.xml").read_text())
```

`with-key/settings.yaml` holds the five live enquiry types, so `test_enquiry_types` matches live.

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_settings.py' -v`

- [ ] **Step 3: Write the template, thanks page, CSS and script change**

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit**

```bash
git add site tests
git commit -m "Add the contact form behind a settings key"
```

---

### Task 3: Pages CMS entry and how-to

**Files:**
- Modify: `.pages.yml`
- Create: `docs/features/page-cms/page-cms-how-to-set-up-the-contact-form.md`
- Modify: `tests/test_cms_config.py`, `tests/test_docs.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_settings_entry(self):
    b = block("settings")
    self.assertIn("type: file", b)
    self.assertIn("path: site/data/settings.yaml", b)
    self.assertIn("format: yaml", b)
    self.assertRegex(b, r"operations:\s*\{?\s*delete: false")
    for f in ("contact_access_key", "contact_subject", "enquiry_types", "address",
              "facebook_url", "map_url", "directions_url"):
        self.assertIn(f"- name: {f}", b)
    self.assertIn("^$|^[0-9a-fA-F]{8}-", b)
```

In `test_docs.py`: the how-to exists, has front matter, no em dash, mentions `Site settings`, `hCaptcha` and changing the inbox.

- [ ] **Step 2: Run them and watch them fail**

- [ ] **Step 3: Write the entry and the how-to**

- [ ] **Step 4: Run the full suite**

Run: `python3 -m unittest discover -s tests -v`

- [ ] **Step 5: Commit and push**

```bash
git add .pages.yml docs tests
git commit -m "Add Site settings to Pages CMS and a contact form how-to"
git push -u origin <session branch>
```
