---
date: 2026-10-19
tags: [spec, plan, stpauls, parity]
status: agreed
---

# Spec 01: repo and build

_One session. Part 0 of the [parity design](parity-check-feature.md): Bicep runs only when `infra/` changes, code owners guard everything Pages CMS does not write, and old admin and login links land in Pages CMS. Needed before Paul's first save. Conventions: [page-cms-spec-conventions.md](../page-cms/page-cms-spec-conventions.md)._

---

## Goal

A Pages CMS save reaches the test site in about 3 minutes with the tests still run, code changes on `main` need the maintainer's approval, and anyone following an old admin or login link arrives at Pages CMS.

## Starting point

- `.github/workflows/deploy.yml`: `build`, `audit`, `deploy`. The deploy job checks out (default depth 1), signs in, runs "Deploy infrastructure" (`az deployment group create --name stpauls-web`, writes `name` and `hostname` outputs), "Read deployment token" (uses `steps.infra.outputs.name`), then uploads. Runs on push to `main` (path filter includes `infra/**`), pull requests, two schedules (`17 3 * * *` nightly rebuild, `41 4 * * 1` audit only) and `workflow_dispatch`.
- Last run on `main` (run 38): Bicep 55s of about 4 minutes.
- `infra/roles/stpauls-template-deployer.json` grants `Microsoft.Resources/deployments/*`, so `az deployment group show` is allowed. No role change.
- `tests/unit/workflow.test.mjs` parses the workflow and asserts its shape. `tests/unit/swa-config.test.mjs` builds the fixture site and asserts `staticwebapp.config.json`.
- `site/data/legacy.yaml` `redirects` become 301 routes in `buildSwaConfig` (`config/swa.js`). It holds `/account*` and `/Account*` to `/`.
- `.pages.yml` writes to `site/static/uploads` (`media.input`), `site/content/...` (every collection and the home file) and `site/data/settings.yaml`.
- No `.github/CODEOWNERS`. No ruleset on `main`. The Azure how-to (section 6, line 146) says no ruleset may require pull requests.

## In scope

1. Bicep only on `infra/` changes.
2. `.github/CODEOWNERS` and a test that keeps it in step with `.pages.yml`.
3. 302 redirects from admin and login links to Pages CMS.
4. The ruleset how-to for the maintainer.

## Out of scope

- Any other redirect. Old-link and email variants are dropped (design, "Non-goals").
- Dropping or trimming tests.

## Requirements

### Bicep only when `infra/` changes

- New first step after checkout in the deploy job, `id: changes`, writes `infra=true` or `infra=false` to `$GITHUB_OUTPUT`:
  - `workflow_dispatch`: `true`.
  - `schedule`: `false`.
  - `push`: `true` when `github.event.before` is empty, all zeros, not a commit in the clone, or `git diff --quiet "$BEFORE" "$GITHUB_SHA" -- infra/` reports a change; else `false`.
  - The script lives in `.github/scripts/infra-changed.sh` (args: event name, before SHA, head SHA) so a unit test can run it. It runs no npm code.
- Deploy job checkout gets `fetch-depth: 0` so `before` is in the clone.
- "Deploy infrastructure" gets `if: steps.changes.outputs.infra == 'true'`.
- New step "Read last deployment", `if: steps.changes.outputs.infra != 'true'`, runs `az deployment group show --resource-group "$AZURE_RESOURCE_GROUP" --name stpauls-web --query properties.outputs` and writes the same `name` and `hostname` outputs and summary line.
- Later steps read `steps.infra.outputs.name || steps.last.outputs.name` (same for `hostname`).
- Known gap, written in the Azure how-to troubleshooting table: an `infra/` push replaced in the queue by a save skips Bicep; run the workflow by hand.

### Code owners

`.github/CODEOWNERS`, exactly:

```
# Everything needs the maintainer's review, except what Pages CMS writes (.pages.yml).
* @SvenPam
/site/content/
/site/static/uploads/
/site/data/settings.yaml
```

### Admin and login links

- `site/data/legacy.yaml` gains:

```yaml
# Old admin and login links go to Pages CMS. Temporary, so the target can change.
editor:
  url: https://app.pagescms.org/svenpam/stpauls/main
  routes:
    - /account*
    - /Account*
    - /management*
    - /Management*
```

  plus, for each of `calendar`, `notices`, `page` and their capitalised spellings, `/{s}/list`, and for each of `blog`, `calendar`, `notices`, `page` and capitalised, `/{s}/create`, `/{s}/edit/*`, `/{s}/delete/*`, with an action part capitalised to match (`/Calendar/Create`, `/Calendar/Edit/*`). Written out in full in the YAML; no generation.
- The `/account*` and `/Account*` entries leave `redirects`.
- `buildSwaConfig` emits each editor route as `{ route, redirect: editor.url, statusCode: 302 }`, after the `redirects` routes.
- `tests/fixtures/live-urls.txt` keeps `/account/login` and friends; the URL check already accepts 302 to a matching route's target.

### Ruleset how-to

Replace the "no ruleset" paragraph at section 6 of `docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md` with a new section "Protect `main`": the ruleset settings from the design (part 0), the bypass list, and the two-save check. Update the troubleshooting row "Pages CMS save fails" to point at the bypass list.

## Manual steps (maintainer)

1. After this merges, create the ruleset on `main` as the how-to says.
2. Save once in Pages CMS signed in with GitHub, once as an email collaborator. Both must land on `main`. If yours is refused, set the admin bypass to "always".
3. Check the next content-only deploy skips "Deploy infrastructure" and reports the site URL.
4. Open `https://agreeable-island-0c85bb703.4.azurestaticapps.net/account/login`: it lands on Pages CMS.

Not runnable in the sandbox: the workflow on GitHub, Azure, Pages CMS, the ruleset.

## Acceptance

- [ ] A content-only push skips Bicep; an `infra/` push, a manual run and a first push run it.
- [ ] The deploy job still uploads with the right token when Bicep is skipped.
- [ ] `CODEOWNERS` owns everything except the Pages CMS paths, and a test fails if `.pages.yml` gains a path it does not exempt.
- [ ] Admin and login links 302 to Pages CMS.
- [ ] How-to updated. `npm test` green.

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** as above.

**Architecture:** a small shell script decides whether Bicep runs; the deploy job falls back to the last deployment's outputs. A new `editor` block in `legacy.yaml` becomes 302 routes in `buildSwaConfig`. `CODEOWNERS` is checked against `.pages.yml` by a unit test.

**Tech Stack:** GitHub Actions, bash, Azure CLI, Eleventy 3, `node:test`, `yaml`.

**Spec:** this document and [parity-check-feature.md](parity-check-feature.md).

### Global Constraints

- Node 26 on `PATH` (see `CLAUDE.md`, environment notes). Root `npm ci && npm test`.
- The deploy job runs no `npm`, `npx` or `node` (existing test).
- Actions stay pinned to commits.
- Pages CMS address exactly `https://app.pagescms.org/svenpam/stpauls/main`, status `302`.

### Review Focus

- A push whose `before` SHA was force-pushed away: expect Bicep to run (script test "unknown before").
- A push touching `infra/` and content together: expect Bicep (script test).
- A scheduled nightly run: never Bicep, still deploys (script test, workflow test on the fallback step).
- `/account` with no slash and `/Account/Login`: both 302 (config test).
- A new page type added to `.pages.yml` under `site/content/`: still exempt by the prefix (CODEOWNERS test uses prefix matching).

---

### Task 1: Bicep only when `infra/` changes

**Files:**
- Create: `.github/scripts/infra-changed.sh`
- Modify: `.github/workflows/deploy.yml` (deploy job)
- Modify: `docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md` (troubleshooting row for the queue gap)
- Test: `tests/unit/workflow.test.mjs`

**Interfaces:**
- Produces: `infra-changed.sh <event> <before> <head>` prints `infra=true` or `infra=false` on stdout; the workflow appends it to `$GITHUB_OUTPUT`. Step ids `changes`, `infra`, `last`.

- [ ] **Step 1: Write the failing tests** in `tests/unit/workflow.test.mjs`. A helper makes a temp git repo with commit A (`infra/main.bicep`, `site/a.md`), B (changes `site/a.md`), C (changes `infra/main.bicep`), and runs `bash .github/scripts/infra-changed.sh` with `cwd` there.
  - `infra-changed: content-only push skips Bicep`: `push A B` gives `infra=false`.
  - `infra-changed: infra push runs Bicep`: `push B C` gives `infra=true`; `push A C` gives `infra=true`.
  - `infra-changed: unknown before runs Bicep`: `push 0000000000000000000000000000000000000000 C`, `push "" C` and `push deadbeefdeadbeefdeadbeefdeadbeefdeadbeef C` give `infra=true`.
  - `infra-changed: manual runs Bicep, schedule never`: `workflow_dispatch A B` gives `true`; `schedule B C` gives `false`.
  - `the deploy job runs Bicep only when infra changed`: step with id `changes` runs the script; step id `infra` has `if: steps.changes.outputs.infra == 'true'`; step id `last` has `if: steps.changes.outputs.infra != 'true'` and its `run` contains `az deployment group show` and `--name stpauls-web`; the token step's `NAME` env is `${{ steps.infra.outputs.name || steps.last.outputs.name }}`; deploy checkout has `fetch-depth: 0`.

- [ ] **Step 2: Run** `npm run test:unit`. Expected: the five new tests FAIL (script missing, steps missing).

- [ ] **Step 3: Write `.github/scripts/infra-changed.sh`** (`set -euo pipefail`, rules from "Requirements"; `git cat-file -e "$before^{commit}"` for "in the clone") **and edit the deploy job**: checkout `fetch-depth: 0`, the `changes` step (`env` EVENT, BEFORE from `github.event.before`; `bash .github/scripts/infra-changed.sh "$EVENT" "$BEFORE" "$GITHUB_SHA" >> "$GITHUB_OUTPUT"`), `if:` on `infra`, the `last` step mirroring `infra`'s output and summary lines, the `||` fallbacks. Add the troubleshooting row "Infra change not applied: a save replaced its run in the queue. Run the workflow by hand."

- [ ] **Step 4: Run** `npm run test:unit` and actionlint (see `CLAUDE.md`) on `deploy.yml`. Expected: all PASS, no actionlint findings.

- [ ] **Step 5: Commit** `git commit -m "Run Bicep only when infra changes"`

### Task 2: Code owners

**Files:**
- Create: `.github/CODEOWNERS`
- Create: `tests/unit/codeowners.test.mjs`

**Interfaces:**
- Consumes: `.pages.yml` `media.input`, every `content[].path` (collections may nest under `content[].items` or similar; read every `path` key in the `content` tree).

- [ ] **Step 1: Write the failing tests**
  - `everything has the maintainer as owner`: the first rule is `*` with owners `['@SvenPam']`.
  - `every path Pages CMS writes has no owner`: for each `.pages.yml` path, the last matching CODEOWNERS rule (prefix match for rules ending `/`, exact otherwise, leading `/` stripped) has no owners.
  - `code paths still need the maintainer`: `config/swa.js`, `.pages.yml`, `.github/workflows/deploy.yml`, `site/_includes/base.njk`, `site/data/legacy.yaml` match a rule with `@SvenPam`.

- [ ] **Step 2: Run** `node --test tests/unit/codeowners.test.mjs`. Expected: FAIL, no CODEOWNERS.

- [ ] **Step 3: Write `.github/CODEOWNERS`** exactly as in "Requirements".

- [ ] **Step 4: Run** `npm run test:unit`. Expected: PASS.

- [ ] **Step 5: Commit** `git commit -m "Require the maintainer's review for anything Pages CMS does not write"`

### Task 3: Admin and login links to Pages CMS

**Files:**
- Modify: `site/data/legacy.yaml`, `config/swa.js` (`buildSwaConfig`)
- Test: `tests/unit/swa-config.test.mjs`, `tests/unit/check-urls.test.mjs` (its fixture config uses `/account*` to `/`; update it to the 302)

**Interfaces:**
- Consumes: `data.legacy.editor` `{ url: string, routes: string[] }`, optional.
- Produces: routes `{ route, redirect: url, statusCode: 302 }`.

- [ ] **Step 1: Write the failing tests** in `swa-config.test.mjs`:
  - `admin and login links go to Pages CMS for now`: for `/account*`, `/Account*`, `/management*`, `/calendar/list`, `/Notices/List`, `/page/list`, `/blog/create`, `/Blog/Edit/*`, `/notices/delete/*`, a route exists with `redirect` `https://app.pagescms.org/svenpam/stpauls/main` and `statusCode` 302.
  - `no account route still goes home`: no route starting `/account` or `/Account` has `redirect` `/`.
  - `/blog/list stays a 404`: no route `/blog/list`.
  - Add to `check-urls.test.mjs`: `checkHost(['/account/login'], ...)` with a fake 302 to the Pages CMS URL passes against a config holding the 302 route.

- [ ] **Step 2: Run** `npm run test:unit`. Expected: the new tests FAIL.

- [ ] **Step 3: Edit `legacy.yaml`** (move the two account entries into `editor.routes`, add the full list) **and `buildSwaConfig`** (append editor routes after `redirects`). The existing "local redirect target exists" test only checks targets starting `/`, so the external URL passes it.

- [ ] **Step 4: Run** `npm test`. Expected: PASS, including the existing "route values are unique" test.

- [ ] **Step 5: Commit** `git commit -m "Send old admin and login links to Pages CMS"`

### Task 4: Ruleset how-to

**Files:**
- Modify: `docs/features/page-cms/page-cms-how-to-set-up-azure-and-pages-cms.md`

- [ ] **Step 1: Write the "Protect `main`" section**: Settings, Rules, Rulesets, New branch ruleset; target `main`; Restrict deletions, Block force pushes, Require a pull request (0 approvals, Require review from Code Owners), Require status checks (`build`); bypass list Pages CMS app (Always) and Repository admin (For pull requests only); the two-save check and the "always" fallback. Replace the line-146 paragraph with a link to it, and update the "Pages CMS save fails" troubleshooting row.

- [ ] **Step 2: Commit** `git commit -m "Document the ruleset that protects main"`

### Finish

- [ ] `npm ci && npm test` green with Node 26. Push the branch. Tell the maintainer the manual steps and that nothing in Azure, GitHub settings or Pages CMS was run from the sandbox.
