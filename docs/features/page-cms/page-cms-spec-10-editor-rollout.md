---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 10: editor rollout

_One session, plus Paul's practice time. Polishes Pages CMS so every section reads clearly, proves that saving migrated content in the editor loses nothing, writes Paul's guide, and gets Paul practising on the test URL. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

Paul can do every routine edit on his own from the guide, and nothing he saves damages migrated content.

## Starting point

- Specs 03 to 09 on `main`. Pages CMS has collections for blog, events, notices, a Pages group, Home page and Site settings, built up spec by spec with the field names in the [site contract](page-cms-spec-conventions.md#front-matter).
- Migrated content is HTML with embeds in fields (spec 07). `docs/features/page-cms/page-cms-migration-report.md` lists policy text that no longer applies.
- Pages CMS (`app.pagescms.org`) cannot be reached from the sandbox. Screenshots and the round-trip check are maintainer steps.
- Paul is not technical and must never need Git, Markdown or a terminal.

## In scope

- `.pages.yml` polish: sidebar order, labels and help text on every field, media upload renaming.
- Round-trip check: the maintainer saves one item of each type without changes, and the agent classifies the resulting diffs.
- `docs/features/page-cms/page-cms-guide-for-editors.md`: Paul's guide, with places marked for the maintainer's screenshots.
- `docs/features/page-cms/page-cms-policy-updates.md`: suggested wording for the privacy policy (and the cookie policy if spec 09 kept it), for the church to adopt.
- Inviting Paul and a practice checklist.

## Out of scope

Cutover (spec 11). Writing the policies on the church's behalf: the suggestions are a starting point only.

---

## Requirements

### Sidebar order and labels

| Order | Entry | Label |
|---|---|---|
| 1 | `notices` | Notices |
| 2 | `events` | Events |
| 3 | `blog` | Blog |
| 4 | `pages` (group) | Pages |
| 5 | `home` | Home page |
| 6 | `settings` | Site settings |

Every field has a `label` in plain words and, where the meaning is not obvious, a `description`. At minimum:

| Field | Description |
|---|---|
| `summary` | Shown in lists and search results. One or two sentences |
| event `date` and `end` | When it starts and ends. It drops off the calendar after it ends |
| topic | Groups items under Website, Church Services, Church Events or Other Events |
| `image_alt` | Describe the picture for people who cannot see it. Leave empty if it is only decoration |
| `header`, `footer` | Tick to show this page in the top menu or the footer |
| `weight` | Lower numbers come first in the menu |
| `embed_src` | Paste the address the calendar or gallery gives you |

### Media

`media` gains `rename: safe` (uploads are slugified, so file names never contain spaces) and `categories: [image, document]`.

### Round-trip check

| Diff after a no-change save | Meaning | Action |
|---|---|---|
| Whitespace, attribute order, `<br />` to `<br>`, entity changes | Cosmetic | Accept. Re-run `migrate.py --check` so cutover day expects the same form, adjusting the migration's HTML normalisation to match the editor's where that is simple |
| Lost element or attribute (iframe, table, `target`, image, class used by CSS) | Lossy | Fix before Paul starts: move the element into a field, or adjust config. Record in the guide if Paul must avoid something |
| Front matter key removed or reordered with a changed value | Lossy | Fix the `.pages.yml` field (missing, wrong type) |

### Guide (`docs/features/page-cms/page-cms-guide-for-editors.md`)

Written for Paul: second person, short sentences, no jargon, no mention of Git, Markdown, Hugo or files. Each task is numbered steps with a `[screenshot: ...]` marker where the maintainer adds an image. Tasks:

1. Signing in for the first time from the email invite, and after that.
2. Adding a notice.
3. Adding an event with start and end times.
4. Writing a blog article with a picture.
5. Changing a page, and adding a new page to the top menu.
6. Adding a picture or a PDF and describing it.
7. Changing the church diary or gallery embed address.
8. Changing contact details or the Facebook link in Site settings.
9. What Save does (the site updates in about two minutes), and that there is no draft or preview.
10. Mistakes: deleted something or broke a page, who to ask, and that every change can be put back.
11. During practice: anything saved before the switchover is thrown away, so use made-up content.

Front matter `tags: [guide, stpauls, editor]`. The maintainer exports it to PDF for Paul.

### Practice checklist

Paul does tasks 2 to 8 on the test URL with made-up content, then deletes what he added. The maintainer ticks each in the guide's appendix and notes anything Paul found confusing. Confusing points become guide fixes or config fixes in this spec.

---

## Manual steps (maintainer)

1. Do the round-trip check: in Pages CMS, open and save without changes one article, one event, one notice, the church diary page, the gallery page, a long page with a table or many images, the home page and Site settings. Tell Claude when done.
2. Add the screenshots to the guide where marked, export it to PDF and send it to Paul.
3. Invite Paul in Pages CMS by email.
4. Watch Paul do the practice checklist, or ask him how it went, and pass on anything confusing.
5. Pass `docs/features/page-cms/page-cms-policy-updates.md` to the church; Paul applies the agreed wording in Pages CMS.

---

## Acceptance

- [ ] `npm test` in `tests/` passes.
- [ ] Sidebar order, labels and descriptions as specified. Media renaming on.
- [ ] Round-trip diffs reviewed, none lossy left unfixed.
- [ ] The guide covers tasks 1 to 11, reads plainly, and has no em dash.
- [ ] Paul has completed the practice checklist.
- [ ] The church has agreed the privacy policy wording.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A clear editor, proof that it is safe on migrated content, and a guide Paul can follow alone.

**Architecture:** Config polish is tested as text. The round-trip check uses real Pages CMS commits on `main`, read back with `git`. The guide is a document, checked for plain language by review and for structure by a doc test.

**Tech Stack:** Pages CMS config, Git, Markdown, Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- No field `name` changes in this spec: only `label`, `description`, order and media options. Renaming a key would strand content.
- The guide never mentions Git, GitHub, Markdown, Hugo, YAML, files or folders.

### Review Focus

1. The editor silently drops something from migrated HTML on save (iframes, tables, `target`). Pinned by the round-trip check before Paul starts.
2. Paul uploads `My Photo (1).JPG`. Expected: renamed to a safe name, works everywhere. Pinned by `test_media_rename_safe`.
3. Paul deletes the Contact Us page or a page type's only page. Expected: menus adjust (spec 04), and the guide tells him how to get it back. Pinned by guide task 10 and `test_guide_covers_tasks`.
4. Labels that use internal words (`weight`, `slug`, `embed_src`) and confuse Paul. Pinned by `test_no_raw_names_as_labels`.
5. Practice content left behind at cutover. Pinned by the guide's practice note and spec 11's cleanup step.

---

### Task 1: Pages CMS polish

**Files:**
- Modify: `.pages.yml`
- Modify: `tests/test_cms_config.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_sidebar_order(self):
    top = re.findall(r"(?m)^  - name: (\S+)$", CFG.split("\ncontent:\n", 1)[1])
    self.assertEqual(top, ["notices", "events", "blog", "pages", "home", "settings"])

def test_every_field_has_a_label(self):
    for m_ in re.finditer(r"(?m)^(\s+)- name: (\w+)\n((?:\1  .*\n)*)", CFG):
        if "type:" in m_.group(3) and "hidden: true" not in m_.group(3):
            self.assertIn("label:", m_.group(3), m_.group(2))

def test_no_raw_names_as_labels(self):
    labels = re.findall(r"(?m)^\s+label: (.+)$", CFG)
    for raw in ("weight", "embed_src", "image_alt", "url", "slug", "header", "footer"):
        self.assertNotIn(raw, [l.strip().strip('"') for l in labels])

def test_key_descriptions(self):
    for text in ("drops off the calendar", "people who cannot see it", "Lower numbers come first"):
        self.assertIn(text, CFG)

def test_media_rename_safe(self):
    media = CFG.split("\ncontent:\n", 1)[0]
    self.assertIn("rename: safe", media)
    self.assertIn("categories: [image, document]", media)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npm test -- cms_config.feature` in `tests/`

- [ ] **Step 3: Reorder, label and describe**

- [ ] **Step 4: Run the full suite, then commit**

```bash
git add .pages.yml tests
git commit -m "Order, label and explain every Pages CMS field"
```

---

### Task 2: Guide and policy suggestions

**Files:**
- Create: `docs/features/page-cms/page-cms-guide-for-editors.md`, `docs/features/page-cms/page-cms-policy-updates.md`
- Modify: `tests/test_docs.py`

- [ ] **Step 1: Write the failing doc tests**

```python
def test_guide_covers_tasks(self):
    g = (REPO / "docs/features/page-cms/page-cms-guide-for-editors.md").read_text()
    self.assertEqual(len(re.findall(r"(?m)^## \d+\. ", g)), 11)
    self.assertIn("[screenshot:", g)
    for banned in ("Git", "GitHub", "Markdown", "Hugo", "YAML", "folder", "file name"):
        self.assertNotRegex(g, rf"\b{banned}\b")
    self.assertNotIn("\u2014", g)

def test_policy_updates(self):
    p = (REPO / "docs/features/page-cms/page-cms-policy-updates.md").read_text()
    self.assertIn("## Privacy policy", p)
    self.assertNotIn("\u2014", p)
```

- [ ] **Step 2: Run them and watch them fail**

- [ ] **Step 3: Write both documents**

`page-cms-policy-updates.md` takes each sentence from the report's policy section, says why it no longer applies, and proposes replacement wording, plus one new paragraph on the contact form (what is collected, that it is emailed to the church through Web3Forms, how long it is kept is the church's call). Run the humanizer skill over both documents.

- [ ] **Step 4: Run the full suite, commit and push**

```bash
git add docs tests
git commit -m "Add the editor guide and suggested policy wording"
git push -u origin <session branch>
```

---

### Task 3: Round-trip check

**Files:**
- Modify (as needed): `.pages.yml`, `scripts/migrate.py`, `docs/features/page-cms/page-cms-guide-for-editors.md`

- [ ] **Step 1: Ask the maintainer to do the round-trip saves** (manual step 1) and wait.

- [ ] **Step 2: Read the commits**

Run: `git fetch origin main && git log --format='%h %s' origin/main | grep 'via Pages CMS' | head -20`, then `git show <sha>` for each.
Expected: one commit per saved item. Classify each diff with the round-trip table.

- [ ] **Step 3: Fix anything lossy**, with a test where the fix is in config or the migration script, then run the full suite.

- [ ] **Step 4: If the editor normalises HTML cosmetically, match it in `migrate.py`** where a simple rule does it (for example `<br />` to `<br>`), so `migrate.py --check` on cutover day only shows real content changes. Add a unit test per rule.

- [ ] **Step 5: Commit and push**, then tell the maintainer the editor is ready for Paul (manual steps 2 to 5).

```bash
git add -A .pages.yml scripts tests docs
git commit -m "Fix issues found saving migrated content in Pages CMS"
git push -u origin <session branch>
```
