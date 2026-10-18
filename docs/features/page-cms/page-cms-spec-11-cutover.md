---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 11: cutover

_One session to prepare, then cutover day itself with the maintainer and Paul. Puts the bare domain on the Static Web App, sets up Cloudflare for HTTPS and the `www` redirect, writes the cutover runbook, and switches the live site over with a short freeze and a tested rollback. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

`https://stpaulswarton.co.uk` serves the new site, `http://` and `www` redirect to it, every live URL still works, Paul edits only in Pages CMS, and the old site can be brought back within minutes if needed.

## Starting point

> **Blocked by spec 01.** The DNS move is in progress (`status: in-progress` in [how to move DNS to Cloudflare](page-cms-how-to-move-dns-to-cloudflare.md)). Do not start this spec until that how-to's Outcome is filled in and its status is `stable`.

- Specs 01 to 10 done. DNS is on Cloudflare, DNS only, pointing at the old App Service; today's records are in `docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md`.
- Static Web App `swa-stpauls-web`, default host `brave-coast-006318103.5.azurestaticapps.net`, no custom domain.
- `baseURL` is already `https://stpaulswarton.co.uk/`. HSTS is `max-age=300` (spec 09).
- `scripts/migrate.py` (with `--check`), `scripts/check_urls.py`, `tests/fixtures/live-urls.txt`.
- Paul has practised on the test URL (spec 10). His practice items are listed by the migration report as files the script did not write.
- Microsoft's apex domain steps (from `MicrosoftDocs/azure-docs`, `articles/static-web-apps/apex-domain-external.md`): add the domain with **TXT** validation, put the generated value in a `TXT` record at host `@`, then point `@` at the default host with `ALIAS`, `ANAME` or CNAME flattening. Cloudflare flattens a `CNAME` at the apex.

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
| Parameter file | `param customDomain = 'stpaulswarton.co.uk'`, set only after the domain shows **Ready** in Azure (see the runbook). Bicep then keeps it, and the TXT record stays in Cloudflare for renewals |
| Why not create it from Bicep first | A TXT-validated domain stays in a validating state until the record exists, which would hold the deploy job. The first creation is a one-off command with `--no-wait` |

### Cloudflare (all by the maintainer, in the runbook)

| When | Setting |
|---|---|
| A week ahead | SSL/TLS mode **Full (strict)**. It only affects proxied records, and none are proxied yet |
| A week ahead | `TXT` at `@` with the Static Web Apps validation value, kept for good, alongside any SPF record |
| A week ahead | Single Redirect rule "www to bare domain", disabled: when hostname equals `www.stpaulswarton.co.uk`, dynamic redirect to `concat("https://stpaulswarton.co.uk", http.request.uri.path)`, status 301, preserve query string |
| Cutover | `@` becomes `CNAME` to `brave-coast-006318103.5.azurestaticapps.net`, **Proxied** |
| Cutover | `www` becomes `CNAME` to `stpaulswarton.co.uk`, **Proxied** (created if spec 01 found none) |
| Cutover | Enable the redirect rule. **Always Use HTTPS** on. Cloudflare HSTS off (the site sends its own) |
| Cutover | Anything else the legacy site needed (`asuid` records) stays until spec 12 |

### Cutover day order

| Step | Who | What | Check |
|---|---|---|---|
| 1 | Paul | Stops editing the old site at the agreed time | Confirmed by message |
| 2 | Claude | `python3 scripts/migrate.py --dates scripts/legacy-dates.csv --check`, then the real run | List of changed files reviewed with the maintainer |
| 3 | Maintainer with Paul | Decide on each file the report lists as not written by the script: delete practice items, keep anything real | Report section empty or every entry decided |
| 4 | Claude | Full test suite, local build, `check_urls.py --built` | `0 failed` |
| 5 | Maintainer | Merge to `main`, watch the deploy | Workflow green |
| 6 | Claude | `check_urls.py --base https://brave-coast-006318103.5.azurestaticapps.net` | `0 failed` |
| 7 | Maintainer | Cloudflare cutover settings above | Records saved |
| 8 | Claude | `check_urls.py --base https://stpaulswarton.co.uk`, `curl -sI http://stpaulswarton.co.uk/blog` (301 to `https://`), `curl -sI https://www.stpaulswarton.co.uk/blog/article/church-roof-completed` (301 to the bare domain, same path), headers present | All pass |
| 9 | Paul | Adds a real notice in Pages CMS | Live within 5 minutes |
| 10 | Maintainer | Sends Paul the "you're live" message | Sent |

DNS changes on Cloudflare usually apply within minutes because the zone is already there; the runbook still allows an hour before declaring a problem.

### Rollback

When step 8 or 9 fails and cannot be fixed within an hour: set `@` (and `www` if it existed) back to the values in the spec 01 records table, **DNS only**, and disable the redirect rule. The old site is still running until spec 12, and the five-minute HSTS means browsers stop insisting on HTTPS almost at once. Tell Paul to keep using the old site until a new date.

### Messages

Two short messages in the runbook, humanised, no em dash: to Paul the day before (what will happen, when to stop editing the old site, that the new site looks the same with some tidying, that the guide still applies), and the "you're live" message (the old back office is retired, use Pages CMS from now on, who to ask).

---

## Manual steps (maintainer)

1. A week ahead: in Azure Cloud Shell, run `az staticwebapp hostname set --name swa-stpauls-web --resource-group <rg> --hostname stpaulswarton.co.uk --validation-method dns-txt-token --no-wait`, then `az staticwebapp hostname show --name swa-stpauls-web --resource-group <rg> --hostname stpaulswarton.co.uk --query validationToken -o tsv`, and add the value as a `TXT` record at `@` in Cloudflare. Wait for the domain status **Ready** in the portal. Then merge the parameter change.
2. The Cloudflare preparation and cutover settings.
3. Agree the cutover date and time with Paul.
4. Run cutover day with Claude and Paul.

---

## Acceptance

- [ ] `npm test` in `tests/` passes, including the infra tests with Bicep on `PATH`.
- [ ] The runbook covers preparation, the day's order, checks, rollback and both messages, with no em dash.
- [ ] On the day: `check_urls.py --base https://stpaulswarton.co.uk` reports `0 failed`, `http://` and `www` redirect as specified, the headers from spec 09 are present on the bare domain, and Paul publishes a notice through Pages CMS.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The custom domain in Bicep, a tested runbook, and a clean switchover with a rollback ready.

**Architecture:** The Static Web App learns the domain once by hand (so validation never blocks a deploy), then Bicep declares it. Cloudflare does HTTP to HTTPS and `www` to bare domain at the edge, so the site config stays host-agnostic. The scripts from specs 05 and 07 do the day's heavy lifting.

**Tech Stack:** Bicep 0.48.1, Azure CLI (maintainer), Cloudflare dashboard (maintainer), Python 3 scripts.

**Spec:** the sections above, from Goal to Acceptance. Shared rules and names in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- `customDomain` defaults to empty, so a fresh environment deploys without a domain.
- Nothing in this spec changes what the site renders.
- The runbook gives exact values (host names, record types, rule expression), not descriptions of them.

### Review Focus

1. The parameter set before validation is Ready, so the deploy job hangs. Pinned by the runbook's order and `test_custom_domain_is_optional` (an empty value adds no resource).
2. An old `http://www.stpaulswarton.co.uk/Areas/st_pauls/Uploads/...` link from Facebook. Expected: `http` to `https` and `www` to bare at Cloudflare, then the legacy rewrite at Static Web Apps, ending in 200. Pinned by step 8 with one such URL added to the check.
3. Mail on the domain breaking because a record was edited at cutover. Pinned by the runbook touching only `@` and `www` and stating that MX, SPF and other TXT records are left alone.
4. Rollback needed after visitors have seen the new site. Expected: works within minutes because HSTS is five minutes. Pinned by `test_runbook_rollback_uses_recorded_values` and spec 09's `max-age=300`.
5. Paul's practice items published by accident. Pinned by step 3 and the migration report.

---

### Task 1: Custom domain in Bicep

**Files:**
- Modify: `infra/main.bicep`
- Modify: `tests/test_infra.py`

- [ ] **Step 1: Write the failing tests**

```python
def test_custom_domain_is_optional(self):
    tpl = json.loads(run("bicep", "build", "infra/main.bicep", "--stdout"))
    self.assertEqual(tpl["parameters"]["customDomain"]["defaultValue"], "")
    res = tpl["resources"]
    res = list(res.values()) if isinstance(res, dict) else res
    dom = [r for r in res if r["type"] == "Microsoft.Web/staticSites/customDomains"]
    self.assertEqual(len(dom), 1)
    self.assertEqual(dom[0]["apiVersion"], "2025-03-01")
    self.assertEqual(dom[0]["condition"], "[not(empty(parameters('customDomain')))]")
    self.assertEqual(dom[0]["properties"], {"validationMethod": "dns-txt-token"})
```

Update `test_static_web_app`: two resources now, the Static Web App found by type; parameters `{"name", "location", "tags", "customDomain"}`.

- [ ] **Step 2: Run them and watch them fail** (Bicep on `PATH`, see [local tools](page-cms-spec-conventions.md#local-tools))

Run: `npm test -- infra.feature` in `tests/`

- [ ] **Step 3: Add the parameter and resource** exactly as in the Bicep table. Leave `main.bicepparam` without `customDomain` for now.

- [ ] **Step 4: Run the tests, `bicep lint infra/main.bicep`, then commit**

```bash
git add infra tests
git commit -m "Add an optional custom domain to the Static Web App"
```

---

### Task 2: Cutover runbook

**Files:**
- Create: `docs/features/page-cms/page-cms-runbook-cutover.md`
- Modify: `tests/test_docs.py`

- [ ] **Step 1: Write the failing doc tests**

```python
def test_runbook(self):
    r = (REPO / "docs/features/page-cms/page-cms-runbook-cutover.md").read_text()
    for h in ("## A week before", "## Cutover day", "## Checks", "## Roll back", "## Messages"):
        self.assertIn(h, r)
    self.assertIn("--validation-method dns-txt-token --no-wait", r)
    self.assertIn('concat("https://stpaulswarton.co.uk", http.request.uri.path)', r)
    self.assertIn("Full (strict)", r)
    self.assertIn("brave-coast-006318103.5.azurestaticapps.net", r)
    self.assertNotIn("\u2014", r)

def test_runbook_rollback_uses_recorded_values(self):
    r = (REPO / "docs/features/page-cms/page-cms-runbook-cutover.md").read_text()
    rb = r.split("## Roll back", 1)[1].split("\n## ", 1)[0]
    self.assertIn("page-cms-how-to-move-dns-to-cloudflare.md", rb)
    self.assertIn("DNS only", rb)
```

- [ ] **Step 2: Run them and watch them fail**

- [ ] **Step 3: Write the runbook** from the spec's tables, with the day's steps as a checklist and both messages. Run the humanizer skill over the messages.

- [ ] **Step 4: Run the full suite, commit and push**

```bash
git add docs tests
git commit -m "Add the cutover runbook"
git push -u origin <session branch>
```

Tell the maintainer the week-ahead steps are theirs, and agree a date.

---

### Task 3: After validation is Ready

**Files:**
- Modify: `infra/main.bicepparam`, `tests/test_infra.py` (`test_parameter_file` expects `customDomain` = `stpaulswarton.co.uk`)

- [ ] **Step 1:** Only once the maintainer confirms the domain is **Ready**: add `param customDomain = 'stpaulswarton.co.uk'`, update the test, run the suite, commit `Declare the custom domain in Bicep`, push. The maintainer merges; the deploy should show the domain unchanged.

---

### Task 4: Cutover day

- [ ] **Step 1:** Follow the runbook's day order with the maintainer and Paul. Run every check command yourself and paste results into the session.
- [ ] **Step 2:** Commit the migrated content and any decided deletions as `Final content sync from the live site`, push, and let the maintainer merge.
- [ ] **Step 3:** After step 8 passes, record the date and outcome at the top of the runbook and in `docs/features/page-cms/page-cms-discovery-way-forward.md`, commit, push.
- [ ] **Step 4:** If rollback is used, record why and what to fix, and stop.
