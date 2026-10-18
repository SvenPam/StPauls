---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 12: handover and decommission

_One session, about four weeks after cutover. Removes the old site and its Azure resources, raises HSTS to a year, sends the note to the old subscribers and deletes their export, and leaves the maintainer and the church a short runbook so the site needs almost nothing from anyone. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18._

---

## Goal

Nothing of the old site is left running or costing money, personal data from it is gone, and anyone picking the site up later can find what they need in two documents.

## Starting point

- Spec 11 done at least four weeks ago, with no rollback needed since.
- The old App Service, its plan, database and storage are still in Azure. `asuid` and any legacy-only records are still in Cloudflare.
- HSTS follows spec 09's recorded check: either `hsts_max_age: 300` in `site/data/site.yaml`, sent by `buildSwaConfig` as `Strict-Transport-Security: max-age=300`, or no `hsts_max_age` and Static Web Apps' own `max-age=10886400; includeSubDomains; preload`.
- The site is Eleventy on Node 26 with one root `package.json`. Dependabot opens one grouped pull request a month for npm and one for GitHub Actions (actions pinned to SHAs since spec 09). The `audit` job fails only the weekly scheduled run.
- The deploy identity holds two custom roles from `infra/roles/`: `StPauls Static Web App deployer` on the site and `StPauls template deployer` on the resource group.
- `scripts/compare-hugo.mjs` is still in the repo from the switch to Eleventy (2026-10-18), with its README row and a Local tools row in the conventions. Nothing has used it since.
- The maintainer holds an export of three or four old subscribers.
- Phase 2 (design options) is next, but not planned.

## In scope

- HSTS to one year through `hsts_max_age`, only if spec 09 found our header wins.
- The note to the old subscribers.
- `docs/features/page-cms/page-cms-runbook-maintainer.md` and `docs/features/page-cms/page-cms-handover-for-the-church.md`.
- Decommission checklist for the maintainer.
- Repo tidy: `CLAUDE.md`, `README.md`, the way forward doc, status of every spec, and removing the one-off parity script.

## Out of scope

Phase 2 design work. HSTS preload.

---

## Requirements

### HSTS

| Spec 09 found | Change |
|---|---|
| Our header replaces the platform's | `hsts_max_age: 31536000` in `site/data/site.yaml`. Still no `includeSubDomains`, no `preload`. Done only when the maintainer confirms there will be no rollback |
| The platform's header stays | No change. Static Web Apps keeps sending `max-age=10886400; includeSubDomains; preload`. Record in the maintainer runbook that HSTS is the platform's and why |

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
| Routine | Merge the two monthly Dependabot pull requests (npm, GitHub Actions) once the `build` check is green. A red `build` on one: leave it open, ask for help or wait for the next month's. Nothing else |
| Red weekly audit | The Monday run (`41 4 * * 1`) fails when `npm audit` finds something. Deploys keep working. Usually the next Dependabot pull request fixes it; otherwise update the package or its `overrides` entry in `package.json` and check `npm audit` reports 0. A red `audit` check on a pull request is expected and is not a required check |
| Azure roles | What the two roles in `infra/roles/` allow and where each is assigned, how to change one (fill the `<SUB>` and `<RG>` placeholders with the `sed` command from the how-to's section 4, then `az role definition update --role-definition @/tmp/<file>.json`) when Bicep needs a new action, and that the identity never gets `Contributor` |
| Updating Node or Eleventy | Node: `.nvmrc`, `engines` in `package.json`, `CLAUDE.md` and the conventions' Build section. Eleventy and the other packages: Dependabot's pull request, or `npm install --save-exact <pkg>@<version>` then `npm audit`. The conventions' package table lists every pin |
| Editors | Inviting or removing someone in Pages CMS |
| Mistakes | Restoring a deleted or broken page from Git history |
| If Pages CMS is down or goes away | Edit through the GitHub web editor in the meantime; swap the editor without touching content (way forward doc) |
| Contact form | Changing the inbox (new Web3Forms key in Site settings), turning on hCaptcha |
| Domain | Registrar, who holds the login (as a role, never a name), renewal date (from spec 01), Cloudflare account owner |
| Checks | `npm ci && npm run build && node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --base https://stpaulswarton.co.uk` any time something seems off |

### `docs/features/page-cms/page-cms-handover-for-the-church.md`

For the church, not technical, short: who looks after what (Paul edits, the maintainer looks after the technical side), where the domain is registered and when it renews, what to do if the maintainer steps away (the repo, Cloudflare and Azure owners to transfer, in plain words), and that the guide for editors is the place to start for anyone new.

### Repo tidy

- `CLAUDE.md`: decisions table gains the decisions made in this project (publish emails dropped, logins removed, contact form on Web3Forms, embeds as fields, the HSTS outcome from spec 09). "Next steps" becomes phase 2. Environment notes updated, and the Hugo install note goes.
- Delete `scripts/compare-hugo.mjs` and its row in `scripts/README.md`, and the Hugo rows in the conventions' Local tools and Tests tables. It was a one-off check for the switch to Eleventy; nothing needs it now.
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

- [ ] `npm test` passes.
- [ ] The live site sends `Strict-Transport-Security: max-age=31536000`, or, if spec 09 found the platform's header wins, the runbook records that its `max-age=10886400` stays.
- [ ] The subscriber note has been sent and the export deleted (maintainer).
- [ ] The decommission checklist is complete and the legacy resources are gone (maintainer).
- [ ] Both documents exist, follow the docs conventions and have no em dash.
- [ ] `CLAUDE.md`, `README.md`, the way forward doc and every spec status are updated, and `scripts/compare-hugo.mjs` is gone.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nothing legacy left, HSTS at its final value, and short documents that make the site easy to hand on.

**Architecture:** One data change (or a recorded decision not to make it), three documents, a repo tidy, and a checklist the maintainer runs in Azure and Cloudflare.

**Tech Stack:** Eleventy site data, `node:test`, Markdown documents (reviewed, not tested).

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- No personal data in any document: no subscriber addresses, no maintainer contact details beyond "the maintainer".
- The HSTS change ships only after the maintainer confirms manual step 1, and only if spec 09 found our header wins.

### Review Focus

1. Another church site still served by the shared legacy App Service is taken down with it. Pinned by decommission step 1.
2. The subscriber export lingering in a downloads folder or email. Pinned by the note's last line and manual step 2.
3. HSTS raised while a rollback is still possible, or raised in data when the platform's header is the one sent. Pinned by the global constraint and "HSTS is a year".
4. A runbook that goes stale when Node or a package is bumped. Pinned by the runbook naming every place a version lives (review).
5. The church not knowing who owns the domain once the maintainer steps away. Pinned by the church handover naming the registrar, Cloudflare, Azure and GitHub owners as roles (review).

---

### Task 1: Documents

**Files:**
- Create: `docs/features/page-cms/page-cms-runbook-maintainer.md`, `docs/features/page-cms/page-cms-handover-for-the-church.md`, `docs/features/page-cms/page-cms-subscriber-note.md`

- [ ] **Step 1: Write the three documents** from the tables above. Run the humanizer skill over the note and the church handover.

- [ ] **Step 2: Check them by reading**

The note is under 120 words, names the three feeds and holds no address. The runbook names `.nvmrc`, `package.json`, `CLAUDE.md`, the conventions, the weekly audit and both roles. The handover names the registrar, Cloudflare, Azure, GitHub and the guide for editors. Then run `grep -nP '\x{2014}' docs/features/page-cms/page-cms-runbook-maintainer.md docs/features/page-cms/page-cms-handover-for-the-church.md docs/features/page-cms/page-cms-subscriber-note.md`.
Expected: no output. These are review checks: the conventions keep docs out of `npm test`.

- [ ] **Step 3: Commit**

```bash
git add docs
git commit -m "Add maintainer runbook, church handover and subscriber note"
git push -u origin <session branch>
```

---

### Task 2: HSTS to one year

**Files:**
- Modify: `site/data/site.yaml`, `tests/unit/swa-config.test.mjs` (only if spec 09 found our header wins)
- Modify: `docs/features/page-cms/page-cms-runbook-maintainer.md` (otherwise)

- [ ] **Step 1: Only after the maintainer confirms no rollback.** If spec 09 recorded that the platform's header wins, skip to Step 3.

Change spec 09's test:

```js
test('HSTS is a year, with no subdomains or preload', () => {
  assert.equal(config.globalHeaders['Strict-Transport-Security'], 'max-age=31536000');
});
```

- [ ] **Step 2: Run it and watch it fail, set `hsts_max_age: 31536000`, run `npm test`, commit**

Run: `npm run test:unit`
Expected: FAIL with `max-age=300`, then PASS after the change.

```bash
git add site tests
git commit -m "Raise HSTS to a year now the old site is gone"
git push -u origin <session branch>
```

- [ ] **Step 3: Otherwise record it.** Add to the runbook's Checks row that HSTS is Static Web Apps' own `max-age=10886400; includeSubDomains; preload` and that `site/data/site.yaml` has no `hsts_max_age` on purpose (spec 09). Commit `Record that HSTS is the platform's` and push.

- [ ] **Step 4: After the deploy**, `curl -sI https://stpaulswarton.co.uk/` and paste the `strict-transport-security` line into the hand-off.

---

### Task 3: Repo tidy

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `docs/features/page-cms/page-cms-discovery-way-forward.md`, `docs/features/page-cms/page-cms-spec-*.md` (status), `docs/features/page-cms/page-cms-spec-conventions.md` (Local tools and Tests rows), `scripts/README.md`
- Delete: `scripts/compare-hugo.mjs`

- [ ] **Step 1: Make the edits listed under Repo tidy.** Check nothing else refers to the parity script: `git grep -n compare-hugo` should list only history (the switch plan and done specs).

- [ ] **Step 2: Run the full suite**

Run: `npm ci && npm test`
Expected: all pass. No test imports the parity script.

- [ ] **Step 3: Commit** `Record phase 1 as done`, push with `git push -u origin <session branch>`, and tell the maintainer which manual steps remain.
