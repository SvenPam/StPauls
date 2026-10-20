---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 10: editor rollout

_One session, plus Paul's practice time. Polishes Pages CMS so every section reads clearly, proves that saving migrated content in the editor loses nothing, writes Paul's guide, and gets Paul practising on the test URL. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

Paul can do every routine edit on his own from the guide, and nothing he saves damages migrated content.

## Starting point

- Specs 00 to 09 on `main`, on Eleventy. Pages CMS has collections for blog, events, notices, a Pages group, Home page and Site settings, built up spec by spec with the field names in the [site contract](page-cms-spec-conventions.md#front-matter). `settings.content.merge: true` keeps keys a form does not show.
- `tests/features/editor.feature` and `tests/steps/editor.js` check what `.pages.yml` produces, looking through groups as well as the top level (spec 04).
- `scripts/migrate.mjs` (with `--check`) and `scripts/check-urls.mjs` are hand-run tools. `npm run build` builds the real content into `_site/`.
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
| Whitespace, attribute order, `<br />` to `<br>`, entity changes | Cosmetic | Accept. Re-run `node scripts/migrate.mjs --check` so cutover day expects the same form, adjusting the migration's HTML normalisation to match the editor's where that is simple |
| Lost element or attribute (iframe, table, `target`, image, class used by CSS) | Lossy | Fix before Paul starts: move the element into a field, or adjust config. Record in the guide if Paul must avoid something |
| Front matter key removed or reordered with a changed value, or a date written in a form the build reads differently | Lossy | Fix the `.pages.yml` field (missing, wrong type, wrong `format`) |

After the saves, `npm run build` on `main` must still pass and show each saved item at its live URL.

### Guide (`docs/features/page-cms/page-cms-guide-for-editors.md`)

Written for Paul: second person, short sentences, no jargon, no mention of Git, Markdown, Eleventy, YAML, files or folders. Each task is numbered steps with a `[screenshot: ...]` marker where the maintainer adds an image. Tasks:

1. Signing in for the first time from the email invite, and after that.
2. Adding a notice, with "Show from" and "Show until". A notice appears or goes away overnight, or at the next save (parity spec 02).
3. Adding an event with start and end times.
4. Writing a blog article with a picture, and the Author box (parity spec 03).
5. Changing a page, adding a new page to the top menu, and hiding a page with the Hidden tick box (parity spec 03). Renaming anything keeps its web address.
6. Adding a picture, a PDF or a Word document and describing it.
7. Changing the church diary or gallery embed address.
8. Changing contact details or the Facebook link in Site settings.
9. What Save does (the site updates in about three minutes), and that there is no draft or preview.
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

- [ ] `npm test` passes.
- [ ] Sidebar order, labels and descriptions as specified. Media renaming on.
- [ ] Round-trip diffs reviewed, none lossy left unfixed.
- [ ] The guide covers tasks 1 to 11, reads plainly, never names the banned words, and has no em dash (checked in review, not by a test).
- [ ] Paul has completed the practice checklist.
- [ ] The church has agreed the privacy policy wording.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A clear editor, proof that it is safe on migrated content, and a guide Paul can follow alone.

**Architecture:** Config polish is checked by scenarios over what `.pages.yml` produces. The round-trip check uses real Pages CMS commits on `main`, read back with `git` and rebuilt with `npm run build`. The guide and the policy suggestions are documents, checked by review, never by tests.

**Tech Stack:** Pages CMS config, Git, Eleventy (`npm run build`), Playwright with playwright-bdd (see [conventions: tests](page-cms-spec-conventions.md#tests)).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- No field `name` changes in this spec: only `label`, `description`, order and media options. Renaming a key would strand content.
- The guide never mentions Git, GitHub, Markdown, Eleventy, YAML, files or folders.

### Review Focus

1. The editor silently drops something from migrated HTML on save (iframes, tables, `target`). Pinned by the round-trip check before Paul starts.
2. Paul uploads `My Photo (1).JPG`. Expected: renamed to a safe name, works everywhere. Pinned by the scenario "Uploads get safe names".
3. Paul deletes the Contact Us page or a page type's only page. Expected: menus adjust (spec 04), and the guide tells him how to get it back. Pinned by guide task 10 (review) and spec 04's `menuItems` tests.
4. Labels that use internal words (`weight`, `slug`, `embed_src`) and confuse Paul. Pinned by the scenario "Labels are plain words".
5. Practice content left behind at cutover. Pinned by the guide's practice note and spec 11's clean-up step.

---

### Task 1: Pages CMS polish

**Files:**
- Modify: `.pages.yml`
- Modify: `tests/features/editor.feature`, `tests/steps/editor.js`

- [ ] **Step 1: Write the failing scenarios**

```gherkin
  Scenario: The sidebar is in the order Paul uses it
    Then the sidebar is, in order:
      | notices  |
      | events   |
      | blog     |
      | pages    |
      | home     |
      | settings |

  Scenario: Every field Paul sees has a label
    Then every field that is not hidden has a label

  Scenario: Labels are plain words
    Then no label is one of "weight, embed_src, image_alt, url, slug, header, footer"

  Scenario: Fields that need it are explained
    Then a field description says "drops off the calendar"
    And a field description says "people who cannot see it"
    And a field description says "Lower numbers come first"

  Scenario: Uploads get safe names
    Then uploads are renamed to safe names
    And uploads can be images or documents
```

New steps in `tests/steps/editor.js`: "the sidebar is, in order:" (top-level `content` names), "every field that is not hidden has a label" (every field of every collection and file, groups included), "no label is one of {string}", "a field description says {string}", "uploads are renamed to safe names" (`media.rename === 'safe'`), "uploads can be images or documents" (`media.categories` equals `['image', 'document']`).

- [ ] **Step 2: Run them and watch them fail**

Run: `npm run test:bdd -- --grep "Pages CMS"`
Expected: FAIL on the new scenarios.

- [ ] **Step 3: Reorder, label and describe**

- [ ] **Step 4: Run the full suite, then commit**

Run: `npm test`
Expected: all pass, including "Whatever Paul has saved builds".

```bash
git add .pages.yml tests
git commit -m "Order, label and explain every Pages CMS field"
```

---

### Task 2: Guide and policy suggestions

**Files:**
- Create: `docs/features/page-cms/page-cms-guide-for-editors.md`, `docs/features/page-cms/page-cms-policy-updates.md`

- [ ] **Step 1: Write both documents**

The guide has 11 numbered sections (`## 1. Signing in` to `## 11. During practice`), `[screenshot: ...]` markers, and none of the banned words. `page-cms-policy-updates.md` takes each sentence from the report's policy section, says why it no longer applies, and proposes replacement wording, plus one new paragraph on the contact form (what is collected, that it is emailed to the church through Web3Forms, how long it is kept is the church's call). Run the humanizer skill over both documents.

- [ ] **Step 2: Check them by reading**

Run: `grep -n -i -w 'git\|github\|markdown\|eleventy\|yaml\|folder\|file name' docs/features/page-cms/page-cms-guide-for-editors.md` and `grep -nP '\x{2014}' docs/features/page-cms/page-cms-guide-for-editors.md docs/features/page-cms/page-cms-policy-updates.md`
Expected: no output. These are review checks, not tests: the conventions keep docs out of `npm test`.

- [ ] **Step 3: Commit**

```bash
git add docs
git commit -m "Add the editor guide and suggested policy wording"
git push -u origin <session branch>
```

---

### Task 3: Round-trip check

**Files:**
- Modify (as needed): `.pages.yml`, `scripts/migrate.mjs`, `tests/unit/migrate.test.mjs`, `docs/features/page-cms/page-cms-guide-for-editors.md`

- [ ] **Step 1: Ask the maintainer to do the round-trip saves** (manual step 1) and wait.

- [ ] **Step 2: Read the commits and rebuild**

Run: `git fetch origin main && git log --format='%h %s' origin/main | grep 'via Pages CMS' | head -20`, then `git show <sha>` for each, then `git checkout origin/main -- site/content site/data/settings.yaml && npm run build` in a scratch worktree.
Expected: one commit per saved item, and the build passes with each saved item at its live URL. Classify each diff with the round-trip table.

- [ ] **Step 3: Fix anything lossy**, with a scenario where the fix is in `.pages.yml` or a unit test where it is in the migration script, then run `npm test`.

- [ ] **Step 4: If the editor normalises HTML cosmetically, match it in `scripts/migrate.mjs`** where a simple rule does it (for example `<br />` to `<br>`), so `node scripts/migrate.mjs --check` on cutover day only shows real content changes. Add a `node:test` case per rule in `tests/unit/migrate.test.mjs`.

- [ ] **Step 5: Commit**, then tell the maintainer the editor is ready for Paul (manual steps 2 to 5).

```bash
git add -A .pages.yml scripts tests docs
git commit -m "Fix issues found saving migrated content in Pages CMS"
git push -u origin <session branch>
```
