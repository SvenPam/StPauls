---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 12: handover and decommission

_One session, about four weeks after cutover. Removes the old site and its Azure resources, raises HSTS to a year, sends the note to the old subscribers and deletes their export, and leaves the maintainer and the church a short runbook so the site needs almost nothing from anyone. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

Nothing of the old site is left running or costing money, personal data from it is gone, and anyone picking the site up later can find what they need in two documents.

## Starting point

- Spec 11 done at least four weeks ago, with no rollback needed since.
- The old App Service, its plan, database and storage are still in Azure. `asuid` and any legacy-only records are still in Cloudflare.
- HSTS is `max-age=300` (`hsts_max_age` in `site/hugo.toml`).
- The maintainer holds an export of three or four old subscribers.
- Phase 2 (design options) is next, but not planned.

## In scope

- `hsts_max_age = 31536000`.
- The note to the old subscribers.
- `docs/features/page-cms/page-cms-runbook-maintainer.md` and `docs/features/page-cms/page-cms-handover-for-the-church.md`.
- Decommission checklist for the maintainer.
- Repo tidy: `CLAUDE.md`, `README.md`, the way forward doc, and status of every spec.

## Out of scope

Phase 2 design work. HSTS preload.

---

## Requirements

### HSTS

`hsts_max_age = 31536000` in `site/hugo.toml`. Still no `includeSubDomains`, no `preload`. Done only when the maintainer confirms there will be no rollback.

### Subscriber note

Humanised, no em dash, under 120 words, from the church (signed `[name], St Paul's Warton`). Says the website has moved to a new system, that site accounts and email updates have ended, where to follow news instead (the website, the Facebook page, and the RSS feeds at `/blog/index.xml`, `/calendar/index.xml` and `/notices/index.xml` for anyone who uses a feed reader), and that their details have been deleted. Sent by the maintainer or the church with every address in `Bcc`. Then the export is deleted from wherever it was saved.

### Decommission checklist (maintainer)

| Step | What | Check |
|---|---|---|
| 1 | Confirm nothing points at the old App Service: Cloudflare records, any other church sites on the multi-tenant legacy CMS | None found, or the other sites have their own plan |
| 2 | Export anything the church wants to keep from the legacy database (not subscriber data). Store it where the church keeps records | Done or not needed |
| 3 | Stop the App Service and wait a week | No complaints |
| 4 | Delete the App Service, its plan, database, storage and any resource group that only held them | Azure cost for them is zero next month |
| 5 | Remove `asuid` and other legacy-only records in Cloudflare | Only records the new site and mail need remain |
| 6 | Delete the old source in Azure DevOps or TFS if nothing else uses it, or mark it archived | Done |

The legacy CMS is multi-tenant (`/Areas/St_Pauls/`). Step 1 matters: other sites may share the App Service.

### `docs/features/page-cms/page-cms-runbook-maintainer.md`

| Section | Contents |
|---|---|
| What runs where | GitHub repo and Actions, Static Web App (Free), Cloudflare (Free), Pages CMS (hosted), Web3Forms (free). Monthly cost: none |
| Routine | Merge the monthly Dependabot pull request after its checks pass. Nothing else |
| Updating Hugo | Every place the version appears (workflow `HUGO_VERSION` and `HUGO_SHA256`, `CLAUDE.md`, `docs/features/page-cms/page-cms-spec-conventions.md`), where to get the checksum |
| Editors | Inviting or removing someone in Pages CMS |
| Mistakes | Restoring a deleted or broken page from Git history |
| If Pages CMS is down or goes away | Edit through the GitHub web editor in the meantime; swap the editor without touching content (way forward doc) |
| Contact form | Changing the inbox (new Web3Forms key in Site settings), turning on hCaptcha |
| Domain | Registrar, who holds the login (as a role, never a name), renewal date (from spec 01), Cloudflare account owner |
| Checks | `scripts/check_urls.py --base https://stpaulswarton.co.uk` any time something seems off |

### `docs/features/page-cms/page-cms-handover-for-the-church.md`

For the church, not technical, short: who looks after what (Paul edits, the maintainer looks after the technical side), where the domain is registered and when it renews, what to do if the maintainer steps away (the repo, Cloudflare and Azure owners to transfer, in plain words), and that the guide for editors is the place to start for anyone new.

### Repo tidy

- `CLAUDE.md`: decisions table gains the decisions made in this project (publish emails dropped, logins removed, contact form on Web3Forms, embeds as fields, short HSTS at cutover then one year). "Next steps" becomes phase 2. Environment notes updated.
- `README.md`: what the site is, how it is edited, where the runbooks are.
- `docs/features/page-cms/page-cms-discovery-way-forward.md`: status line that phase 1 is complete, with the date.
- Every spec in `docs/features/page-cms/` from 01 to 12: `status: done`.

---

## Manual steps (maintainer)

1. Confirm there will be no rollback.
2. Send the subscriber note, then delete the export.
3. Work through the decommission checklist.
4. Share the church handover with whoever at the church should have it.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] The live site sends `Strict-Transport-Security: max-age=31536000`.
- [ ] The subscriber note has been sent and the export deleted (maintainer).
- [ ] The decommission checklist is complete and the legacy resources are gone (maintainer).
- [ ] Both documents exist, follow the docs conventions and have no em dash.
- [ ] `CLAUDE.md`, `README.md`, the way forward doc and every spec status are updated.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nothing legacy left, a year of HSTS, and two short documents that make the site easy to hand on.

**Architecture:** One config change, three documents, and a checklist the maintainer runs in Azure and Cloudflare.

**Tech Stack:** Hugo config, Markdown, Python 3 `unittest`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- No personal data in any document: no subscriber addresses, no maintainer contact details beyond "the maintainer".
- The HSTS change ships only after the maintainer confirms manual step 1.

### Review Focus

1. Another church site still served by the shared legacy App Service is taken down with it. Pinned by decommission step 1.
2. The subscriber export lingering in a downloads folder or email. Pinned by the note's last line and manual step 2.
3. HSTS raised while a rollback is still possible. Pinned by the global constraint and `test_hsts_follows_setting`.
4. A runbook that goes stale when Hugo is bumped. Pinned by `test_runbook_lists_every_hugo_version_location`.
5. The church not knowing who owns the domain once the maintainer steps away. Pinned by `test_church_handover_names_the_owners`.

---

### Task 1: Documents

**Files:**
- Create: `docs/features/page-cms/page-cms-runbook-maintainer.md`, `docs/features/page-cms/page-cms-handover-for-the-church.md`, `docs/features/page-cms/page-cms-subscriber-note.md`
- Modify: `tests/test_docs.py`

- [ ] **Step 1: Write the failing doc tests**

```python
def test_runbook_lists_every_hugo_version_location(self):
    r = (REPO / "docs/features/page-cms/page-cms-runbook-maintainer.md").read_text()
    for place in ("HUGO_VERSION", "HUGO_SHA256", "CLAUDE.md", "docs/features/page-cms/page-cms-spec-conventions.md"):
        self.assertIn(place, r)

def test_church_handover_names_the_owners(self):
    h = (REPO / "docs/features/page-cms/page-cms-handover-for-the-church.md").read_text()
    for thing in ("registrar", "Cloudflare", "Azure", "GitHub", "guide for editors"):
        self.assertIn(thing, h)

def test_subscriber_note(self):
    n = (REPO / "docs/features/page-cms/page-cms-subscriber-note.md").read_text()
    body = n.split("\n---\n", 2)[-1]
    self.assertLess(len(body.split()), 140)
    for feed in ("/blog/index.xml", "/calendar/index.xml", "/notices/index.xml"):
        self.assertIn(feed, body)
    self.assertNotIn("@", body)

def test_no_em_dash_in_handover_docs(self):
    for f in ("page-cms-runbook-maintainer.md", "page-cms-handover-for-the-church.md", "page-cms-subscriber-note.md"):
        self.assertNotIn("\u2014", (REPO / "docs/features/page-cms" / f).read_text(), f)
```

- [ ] **Step 2: Run them and watch them fail**

- [ ] **Step 3: Write the three documents.** Run the humanizer skill over the note and the church handover.

- [ ] **Step 4: Run the full suite, commit and push**

```bash
git add docs tests
git commit -m "Add maintainer runbook, church handover and subscriber note"
git push -u origin <session branch>
```

---

### Task 2: HSTS to one year

**Files:**
- Modify: `site/hugo.toml`, `tests/test_headers.py`

- [ ] **Step 1: Only after the maintainer confirms no rollback**, change the test:

```python
def test_hsts_follows_setting(self):
    self.assertEqual(self.cfg["globalHeaders"]["Strict-Transport-Security"], "max-age=31536000")
```

- [ ] **Step 2: Run it and watch it fail, set `hsts_max_age = 31536000`, run the full suite, commit**

```bash
git add site tests
git commit -m "Raise HSTS to a year now the old site is gone"
```

---

### Task 3: Repo tidy

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `docs/features/page-cms/page-cms-discovery-way-forward.md`, `docs/features/page-cms/page-cms-spec-*.md` (status)

- [ ] **Step 1: Make the edits listed under Repo tidy**, run the full suite, commit `Record phase 1 as done`, push, and tell the maintainer which manual steps remain.
