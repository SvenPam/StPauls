---
date: 2026-10-18
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 11: cutover

_One session to prepare, then cutover day itself with the maintainer and Paul. Puts the bare domain on the Static Web App, sets up Cloudflare for HTTPS and the `www` redirect, writes the cutover runbook, and switches the live site over with a short freeze and a tested rollback. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

_Rewritten for Eleventy on 2026-10-18. The order of the domain steps follows the maintainer's own cutover of another Static Web App (tranquility, `docs/runbook-cutover.md`)._

---

## Goal

`https://stpaulswarton.co.uk` serves the new site, `http://` and `www` redirect to it, every live URL still works, Paul edits only in Pages CMS, and the old site can be brought back within minutes if needed.

## Starting point

> **Blocked by spec 01.** The DNS move is in progress (`status: in-progress` in [how to move DNS to Cloudflare](page-cms-how-to-move-dns-to-cloudflare.md)). Do not start this spec until that how-to's Outcome is filled in and its status is `stable`.

- Specs 01 to 10 done. DNS is on Cloudflare, DNS only, pointing at the old App Service; today's records are in `docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md`.
- Static Web App `swa-stpauls-web`, default host `brave-coast-006318103.5.azurestaticapps.net`, no custom domain. `infra/main.bicep` declares only the site (`Microsoft.Web/staticSites@2025-03-01`) with parameters `name`, `location`, `tags`.
- Bicep stays in CI: the `deploy` job runs `az deployment group create` with `infra/main.bicep` and `infra/main.bicepparam` on every deploy, signed in by OIDC. Its identity holds `StPauls Static Web App deployer` on the site, which already grants `Microsoft.Web/staticSites/customDomains/*`, and `StPauls template deployer` on the resource group. No role change is needed for a custom domain.
- Canonical links, feeds and the site maps already use `site.url` (`https://stpaulswarton.co.uk`, spec 05).
- HSTS follows spec 09's check, recorded in [checked facts](page-cms-spec-conventions.md#azure-static-web-apps): either our `max-age=300` replaces the platform's header, or the platform's `max-age=10886400; includeSubDomains; preload` stays and there is no short HSTS.
- `scripts/migrate.mjs` (with `--check`), `scripts/check-urls.mjs` (`--built`, `--base`), `tests/fixtures/live-urls.txt`. Behind the sandbox proxy, Node's `fetch` needs `NODE_USE_ENV_PROXY=1`.
- Paul has practised on the test URL (spec 10). His practice items are listed by the migration report as files the script did not write.
- Microsoft's apex domain steps (from `MicrosoftDocs/azure-docs`, `articles/static-web-apps/apex-domain-external.md`): add the domain with **TXT** validation, put the generated value in a `TXT` record at host `@`, then point `@` at the default host with `ALIAS`, `ANAME` or CNAME flattening. Cloudflare flattens a `CNAME` at the apex. On the tranquility cutover the portal asked for the record at `_dnsauth`: use the host name Azure shows.
- Tranquility's order, kept here: validate with TXT well before the day, wait for **Ready** (the certificate can be issued before the record moves), write down the current records, then flip, then check, then turn on extras.

## In scope

- Bicep: optional `customDomain` parameter adding `Microsoft.Web/staticSites/customDomains@2025-03-01` with `validationMethod: 'dns-txt-token'`.
- `docs/features/page-cms/page-cms-runbook-cutover.md`: preparation a week ahead, cutover day, checks, rollback, and the messages to Paul.
- The cutover itself.

## Out of scope

Decommissioning the old site and raising HSTS (spec 12, four weeks later).

---

## Requirements

### Bicep

| | |
|---|---|
| Parameter | `@description('Custom apex domain. Empty until its TXT validation has been done by hand.') param customDomain string = ''` |
| Resource | `resource domain 'Microsoft.Web/staticSites/customDomains@2025-03-01' = if (!empty(customDomain))`, `parent: site`, `name: empty(customDomain) ? 'unused' : customDomain`, `properties: { validationMethod: 'dns-txt-token' }` |
| Parameter file | `param customDomain = 'stpaulswarton.co.uk'`, set only after the domain shows **Ready** in Azure (see the runbook). The deploy job then applies it on every deploy and Bicep keeps it, and the TXT record stays in Cloudflare for renewals |
| Rights | The deploy identity's `StPauls Static Web App deployer` role already covers `Microsoft.Web/staticSites/customDomains/*`. If a deploy is refused on a custom domain action, add that one action to `infra/roles/stpauls-static-web-app-deployer.json` and `tests/unit/roles.test.mjs`, and the maintainer runs `az role definition update` |
| Why not create it from Bicep first | A TXT-validated domain stays in a validating state until the record exists, which would hold the deploy job. The first creation is a one-off command with `--no-wait` |

### Cloudflare (all by the maintainer, in the runbook)

| When | Setting |
|---|---|
| A week ahead | SSL/TLS mode **Full (strict)**. It only affects proxied records, and none are proxied yet |
| A week ahead | `TXT` at the host Azure shows (`@` or `_dnsauth`) with the Static Web Apps validation value, kept for good, alongside any SPF record |
| A week ahead | Single Redirect rule "www to bare domain", disabled: when hostname equals `www.stpaulswarton.co.uk`, dynamic redirect to `concat("https://stpaulswarton.co.uk", http.request.uri.path)`, status 301, preserve query string |
| Cutover | `@` becomes `CNAME` to `brave-coast-006318103.5.azurestaticapps.net`, **Proxied** |
| Cutover | `www` becomes `CNAME` to `stpaulswarton.co.uk`, **Proxied** (created if spec 01 found none) |
| Cutover | Enable the redirect rule. **Always Use HTTPS** on. Cloudflare HSTS off (the site sends its own) |
| Cutover | Anything else the legacy site needed (`asuid` records) stays until spec 12 |

### Cutover day order

| Step | Who | What | Check |
|---|---|---|---|
| 1 | Paul | Stops editing the old site at the agreed time | Confirmed by message |
| 2 | Claude | Re-export the SQL into `docs/features/migration/data/` (spec 07a), `node scripts/migrate.mjs --check`, then the real run | List of changed files reviewed with the maintainer |
| 3 | Maintainer with Paul | Decide on each file the report lists as not written by the script: delete practice items, keep anything real | Report section empty or every entry decided |
| 4 | Claude | `npm test`, `npm run build`, `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site` | `0 failed` |
| 5 | Maintainer | Merge to `main`, watch the deploy | Workflow green |
| 6 | Claude | `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --base https://brave-coast-006318103.5.azurestaticapps.net` | `0 failed` |
| 6a | Maintainer | Write down the current `@` and `www` records (type, value, proxy status) and the SSL/TLS mode, next to the spec 01 records table | Recorded |
| 7 | Maintainer | Cloudflare cutover settings above | Records saved |
| 8 | Claude | `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --base https://stpaulswarton.co.uk` and `--base https://www.stpaulswarton.co.uk --redirects-to https://stpaulswarton.co.uk` (every path a 301 to the same path on the bare domain, spec 05's `--redirects-to` mode), `curl -sI http://stpaulswarton.co.uk/blog` (301 to `https://`), `curl -sI https://www.stpaulswarton.co.uk/blog/article/church-roof-completed` (301 to the bare domain, same path), one `http://www.stpaulswarton.co.uk/Areas/st_pauls/Uploads/...` link ending in 200, headers from spec 09 present, and `curl -sI https://stpaulswarton.co.uk/` showing exactly one `strict-transport-security` line, `max-age=300` (when spec 09 kept the short HSTS) | All pass. If HSTS on the custom domain is not exactly one `max-age=300`, record it in checked facts and use the Flexible rollback row from now on |
| 9 | Paul | Adds a real notice in Pages CMS | Live within 5 minutes |
| 10 | Maintainer | Sends Paul the "you're live" message | Sent |

DNS changes on Cloudflare usually apply within minutes because the zone is already there; the runbook still allows an hour before declaring a problem.

### Rollback

When step 8 or 9 fails and cannot be fixed within an hour, put `@` (and `www` if it existed) back at the old App Service from the spec 01 records table and disable the redirect rule. How depends on spec 09's HSTS result:

| Spec 09 found | Rollback |
|---|---|
| Our `max-age=300` replaces the platform's header, on `azurestaticapps.net` in spec 09 and on `stpaulswarton.co.uk` in step 8 | Records back to the spec 01 values, **DNS only**. Browsers stop insisting on HTTPS within five minutes, so the old HTTP-only site works again |
| The platform's `max-age=10886400; includeSubDomains; preload` stays, on either host | Browsers that saw the new site insist on HTTPS for about four months on `stpaulswarton.co.uk` and every subdomain (`includeSubDomains`), so plain HTTP cannot come back. Check every name in the spec 01 records table: any that serves only HTTP must be proxied through Cloudflare too. Records back to the old App Service but **Proxied**, SSL/TLS mode **Flexible** (Cloudflare serves HTTPS to visitors and fetches the old site over HTTP), **Always Use HTTPS** stays on. Return SSL/TLS to **Full (strict)** when the new site comes back |

The old site is still running until spec 12. Tell Paul to keep using the old site until a new date.

### Messages

Two short messages in the runbook, humanised, no em dash: to Paul the day before (what will happen, when to stop editing the old site, that the new site looks the same with some tidying, that the guide still applies), and the "you're live" message (the old back office is retired, use Pages CMS from now on, who to ask).

---

## Manual steps (maintainer)

1. A week ahead: in Azure Cloud Shell, run `az staticwebapp hostname set --name swa-stpauls-web --resource-group <rg> --hostname stpaulswarton.co.uk --validation-method dns-txt-token --no-wait`, then `az staticwebapp hostname show --name swa-stpauls-web --resource-group <rg> --hostname stpaulswarton.co.uk --query validationToken -o tsv`, and add the value as a `TXT` record in Cloudflare at the host Azure shows (`@` or `_dnsauth`). Wait for the domain status **Ready** in the portal. Then merge the parameter change.
2. The Cloudflare preparation and cutover settings.
3. Agree the cutover date and time with Paul.
4. Run cutover day with Claude and Paul.

---

## Acceptance

- [ ] `npm test` passes, including `tests/unit/infra.test.mjs` with Bicep on `PATH` (it skips without it).
- [ ] The runbook covers preparation, the day's order, checks, the rollback that matches spec 09's HSTS result and both messages, with no em dash (review).
- [ ] On the day: `check-urls.mjs --base https://stpaulswarton.co.uk` reports `0 failed`, `--base https://www.stpaulswarton.co.uk --redirects-to https://stpaulswarton.co.uk` reports `0 failed`, the bare domain sends the HSTS header spec 09 expects (or the Flexible rollback is recorded as the one to use), `http://` and `www` redirect as specified, the headers from spec 09 are present on the bare domain, and Paul publishes a notice through Pages CMS.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The custom domain in Bicep, a reviewed runbook, and a clean switchover with a rollback ready.

**Architecture:** The Static Web App learns the domain once by hand (so validation never blocks a deploy), then Bicep declares it and the deploy job keeps applying it. Cloudflare does HTTP to HTTPS and `www` to bare domain at the edge, so the site config stays host-agnostic. The scripts from specs 05 and 07 do the day's heavy lifting.

**Tech Stack:** Bicep 0.48.1, Azure CLI (maintainer), Cloudflare dashboard (maintainer), Node 26 scripts, `node:test`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- `customDomain` defaults to empty, so a fresh environment deploys without a domain.
- Nothing in this spec changes what the site renders.
- The runbook gives exact values (host names, record types, rule expression), not descriptions of them.

### Review Focus

1. The parameter set before validation is Ready, so the deploy job hangs. Pinned by the runbook's order and the unit test "the custom domain is optional" (an empty value adds no resource).
2. An old `http://www.stpaulswarton.co.uk/Areas/st_pauls/Uploads/...` link from Facebook. Expected: `http` to `https` and `www` to bare at Cloudflare, then the generated legacy upload redirect at Static Web Apps, ending in 200. Pinned by step 8 with one such URL added to the check.
3. Mail on the domain breaking because a record was edited at cutover. Pinned by the runbook touching only `@` and `www` and stating that MX, SPF and other TXT records are left alone.
4. Rollback needed after visitors have seen the new site. Expected: works within minutes, by the route spec 09's HSTS result allows. Pinned by the runbook's rollback table (review) and spec 09's recorded fact.
5. Paul's practice items published by accident. Pinned by step 3 and the migration report.

---

### Task 1: Custom domain in Bicep

**Files:**
- Modify: `infra/main.bicep`
- Create: `tests/unit/infra.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';

const hasBicep = spawnSync('bicep', ['--version']).status === 0;
const build = () => JSON.parse(execFileSync('bicep', ['build', 'infra/main.bicep', '--stdout'], { encoding: 'utf8' }));
const list = (r) => (Array.isArray(r) ? r : Object.values(r));

test('the custom domain is optional', { skip: !hasBicep && 'bicep not on PATH' }, () => {
  const tpl = build();
  assert.equal(tpl.parameters.customDomain.defaultValue, '');
  const dom = list(tpl.resources).filter((r) => r.type === 'Microsoft.Web/staticSites/customDomains');
  assert.equal(dom.length, 1);
  assert.equal(dom[0].apiVersion, '2025-03-01');
  assert.equal(dom[0].condition, "[not(empty(parameters('customDomain')))]");
  assert.deepEqual(dom[0].properties, { validationMethod: 'dns-txt-token' });
});

test('the site keeps its parameters', { skip: !hasBicep && 'bicep not on PATH' }, () => {
  assert.deepEqual(Object.keys(build().parameters).sort(), ['customDomain', 'location', 'name', 'tags']);
});
```

Bicep is not on `PATH` on the GitHub runner either, so these run where the maintainer or the sandbox has it (see [local tools](page-cms-spec-conventions.md#local-tools)) and skip in CI. The deploy job's `az deployment group create` compiles the same file on every deploy.

- [ ] **Step 2: Run them and watch them fail** (Bicep on `PATH`)

Run: `npm run test:unit`
Expected: FAIL, no `customDomain` parameter.

- [ ] **Step 3: Add the parameter and resource** exactly as in the Bicep table. Leave `main.bicepparam` without `customDomain` for now.

- [ ] **Step 4: Run the tests, `bicep lint infra/main.bicep`, then commit**

Run: `npm run test:unit && bicep lint infra/main.bicep`
Expected: all pass, no lint output.

```bash
git add infra tests
git commit -m "Add an optional custom domain to the Static Web App"
```

---

### Task 2: Cutover runbook

**Files:**
- Create: `docs/features/page-cms/page-cms-runbook-cutover.md`

- [ ] **Step 1: Write the runbook** from the spec's tables, in tranquility's shape: Facts, "A week before" (validate, TXT, Ready, parameter merge, Cloudflare preparation), "Cutover day" (the day's steps as a checklist, each with its check), "Checks", "Roll back" (the table matching spec 09's recorded HSTS result, pointing at the records table in `page-cms-how-to-move-dns-to-cloudflare.md`), and "Messages" (both). Include exactly: `--validation-method dns-txt-token --no-wait`, `concat("https://stpaulswarton.co.uk", http.request.uri.path)`, `Full (strict)`, `brave-coast-006318103.5.azurestaticapps.net`. Run the humanizer skill over the messages.

- [ ] **Step 2: Check it by reading**

Run: `grep -nP '\x{2014}' docs/features/page-cms/page-cms-runbook-cutover.md`
Expected: no output. The runbook gets no test: it is a document.

- [ ] **Step 3: Commit**

```bash
git add docs
git commit -m "Add the cutover runbook"
git push -u origin <session branch>
```

Tell the maintainer the week-ahead steps are theirs, and agree a date.

---

### Task 3: After validation is Ready

**Files:**
- Modify: `infra/main.bicepparam`, `tests/unit/infra.test.mjs`

- [ ] **Step 1:** Only once the maintainer confirms the domain is **Ready**: add `param customDomain = 'stpaulswarton.co.uk'`, add a test that `bicep build-params infra/main.bicepparam --stdout` gives `customDomain` `stpaulswarton.co.uk` (skipped without Bicep), run `npm test`, commit `Declare the custom domain in Bicep`, push. The maintainer merges; the deploy job applies it and the domain stays **Ready**.

---

### Task 4: Cutover day

- [ ] **Step 1:** Follow the runbook's day order with the maintainer and Paul. Run every check command yourself and paste results into the session.
- [ ] **Step 2:** Commit the migrated content and any decided deletions as `Final content sync from the live site`, push with `git push -u origin <session branch>`, and let the maintainer merge.
- [ ] **Step 3:** After step 8 passes, record the date and outcome at the top of the runbook and in `docs/features/page-cms/page-cms-discovery-way-forward.md`, commit and push.
- [ ] **Step 4:** If rollback is used, record why and what to fix, and stop.
