# St Paul's Warton website

Rebuild of `stpaulswarton.co.uk` as a static site. Read `docs/features/page-cms/page-cms-discovery-way-forward.md` first, then the spec you were asked to build in `docs/features/page-cms/`.

## Decisions already made

Do not reopen these without being asked.

| Topic | Decision |
|---|---|
| Direction | Static site, not Umbraco. Umbraco 17 is the fallback only if the editor trial (spec 00) fails |
| Generator | Eleventy 3.x, exact-pinned, Node 26. npm allowed with `npm audit` and Dependabot (2026-10-18, replaces Hugo) |
| Tests | Playwright with Gherkin scenarios (`playwright-bdd`) in `tests/`, plus `node:test` in `tests/unit/`. Root `npm ci && npm test`. Behaviour only, never docs or Markdown. Run on every pull request and before every deploy (2026-10-18, replaces uncommitted Python tests) |
| Editor | Pages CMS (hosted, `app.pagescms.org`), editors invited by email. No self-hosted Postgres |
| Hosting | Azure Static Web Apps, Free plan. Maintainer has Azure credits |
| Infrastructure | Bicep in `infra/`, run by the deploy job. OIDC sign-in in the deploy job only, with two custom roles: Static Web App deployer on the resource, template deployer on the resource group. No long-lived token stored as a secret |
| DNS | Cloudflare Free for DNS and caching only. Church controls the domain registrar side |
| Branch | `main` is the default and deploy branch. Umbraco code is archived on `archive/umbraco-2019` and must not be merged back |
| Comments | Disqus removed |
| Analytics | Universal Analytics removed. Nothing in its place for now |
| Personal details | Do not put the maintainer's name, LinkedIn or personal site in the site. The legacy footer has them; leave them out |
| Content source | The live site is the source of truth. Content is small and mostly HTML blocks. URLs must stay identical to live (`/blog/article/{slug}`, `/calendar/event/{id}/{slug}`, `/notices/notice/{id}/{slug}`, `/page/{type}/{slug}`). Other live URL variants and old email links are not carried (2026-10-19) |
| Subscribers | Export found three or four old subscribers. Publish emails dropped. RSS feeds instead, a one-off note to them, then the export is deleted (spec 12) |
| Trial | Go for the static site (2026-10-17). Phase 1 plan in `docs/features/page-cms/page-cms-feature.md` |
| Look | Keep the colours and general layout. Readability fixes only. Formal design options are phase 2, after Paul is settled |
| Logins | Removed. Paul is a Pages CMS collaborator. `/account*` and old admin links 302 to Pages CMS (2026-10-19, parity spec 01) |
| Contact form | Web3Forms, one inbox, key in Site settings, hidden until a real key is set |
| Domain | Bare `stpaulswarton.co.uk` is primary. Cloudflare redirects `www` to it |
| Cookie policy | Google Calendar's embed sets `NID`, so the page stays: a short note naming the embeds' cookies, and click-to-load for embeds that set any (spec 09, 2026-10-18) |
| Cutover | DNS to Cloudflare early, Paul practises on the test URL, short freeze and re-extraction on the day |
| Body format | Pure Markdown, no HTML in bodies, Pages CMS `format: markdown`. Simple editing beats looking like live: jump menus, image widths and centring go (2026-10-19, spec 07a) |
| Build | Bicep runs only when `infra/` changes, on a manual run, or when a push cannot be compared. Tests always run (2026-10-19) |
| Repo protection | `.github/CODEOWNERS` plus a ruleset on `main`: maintainer approval for anything Pages CMS does not write. Pages CMS app and admin bypass (2026-10-19) |
| Content edits | Migrated content is never corrected, broken links and typos included. The maintainer is not the author (2026-10-19) |

## Who is who

| | |
|---|---|
| Maintainer | Owns the repo and Azure. Volunteer, wants minimal ongoing work. Does the manual Azure, Entra ID and GitHub setup steps in each spec |
| Paul | Church contact and the editor. Not technical. Must never need Git, Markdown or a terminal |

## Working with the maintainer

- Terse answers. Detail on request.
- Any message written for someone else (email, SMS, Teams, Slack): humanise it and never use an em dash.
- Markdown file names must not contain `:`, `/`, `#` or `^`.
- Docs for the Page CMS migration go in `docs/features/page-cms/` with the `page-cms-` prefix (`page-cms-feature.md` for the plan, `page-cms-spec-` for specs, `page-cms-how-to-` and so on for the rest).
- Do not create a pull request unless asked. Specs are built on a branch and merged to `main` when the maintainer says so.
- Manual steps (Azure portal, Entra ID, GitHub secrets, Pages CMS app install) belong to the maintainer. Document them in the spec or a how-to, and say clearly when you are blocked on one.

## Tests

Committed, and run by `.github/workflows/deploy.yml` on every pull request and before every deploy. Rules in `docs/features/page-cms/page-cms-spec-conventions.md#tests`.

- Gherkin features in `tests/features/`, JavaScript steps in `tests/steps/`, `node:test` unit tests in `tests/unit/`, fixtures in `tests/fixtures/`. Run with `npm ci && npm test` at the repo root (`npm run test:unit`, `npm run test:bdd` for one half).
- Test behaviour in a real browser: what a page shows, where links go, what `site.js` does, what the feeds and `.pages.yml` produce. No tests on docs or Markdown.
- Every spec adds scenarios for what it builds and keeps the whole suite green. Reuse existing steps where they fit.

## When the maintainer gives final approval on a spec

Do all of these on the spec's branch before it merges:

1. Set the spec's front matter to `status: done` and tick its Acceptance boxes.
2. Update "Next steps" below to name the next spec.
3. Push.

## Repo layout

| Path | Purpose |
|---|---|
| `docs/features/page-cms/` | Everything for the Page CMS migration. Every file is named `page-cms-<type>-<topic>.md` |
| `docs/features/page-cms/page-cms-discovery-current-state.md` | Facts about the live site and the 2019 Umbraco port |
| `docs/features/page-cms/page-cms-discovery-way-forward.md` | Options, decisions, original work outline |
| `docs/features/page-cms/page-cms-feature.md` | The plan: decisions, architecture, work outline |
| `docs/features/page-cms/page-cms-spec-NN-*.md` | One spec per working session, 00 to 12 |
| `docs/features/page-cms/page-cms-spec-conventions.md` | Shared rules and the names specs pass between each other |
| `docs/features/design-options/` | Phase 2 design mockups for Paul. Rebuilt by `scripts/design-options/build.mjs` |
| `.claude/skills/` | Imported obra/superpowers skills, see `.claude/skills/SUPERPOWERS.md` |
| `site/` | Eleventy site: `content/` (Paul's), `_includes/`, `pages/`, `data/`, `assets/`, `static/` |
| `config/` | Eleventy modules loaded by `eleventy.config.js`: content (URLs and collections), data, pages, assets, images, dates, filters, topics, `staticwebapp.config.json` |
| `infra/` | Bicep for the Static Web App, custom role definitions in `infra/roles/` |
| `.pages.yml` | Pages CMS config |
| `tests/` | Playwright and Gherkin tests, `node:test` unit tests, fixtures, `serve.js` (builds a fixture folder and serves it) |
| `scripts/` | Hand-run tools (screenshots, URL check, migration). Never run in CI |
| `package.json` | The one npm project: build, tests, scripts. Exact pins |
| `.github/workflows/deploy.yml` | Build and test, audit, then deploy Bicep and the built site |

The legacy CSS, images and views needed for reference are on `archive/umbraco-2019` under `StPauls.Web/` (`Content/`, `Views/`). Read them with `git show archive/umbraco-2019:StPauls.Web/Content/Site.less` or check the branch out into a worktree.

## Environment notes (cloud sandbox, checked 2026-10-17)

- `az` and `bicep` were not installed. The sandbox `node` is 22, too old: install Node 26 outside the repo with `npm i --prefix <dir> node@26` and put `<dir>/node_modules/.bin` first on `PATH` (2026-10-18).
- Downloads from `github.com/.../releases` returned 403 through the sandbox proxy, and `pagescms.org` did not resolve. PyPI and the npm registry were reachable.
- Install tools outside the repo. actionlint from PyPI: `python3 -m venv <dir> && <dir>/bin/pip install actionlint-py`. Hugo (`hugo==0.167.0`, same venv) is needed only for the one-off `scripts/compare-hugo.mjs`. Bicep 0.48.1 from NuGet: `https://api.nuget.org/v3-flatcontainer/azure.bicep.commandline.linux-x64/0.48.1/azure.bicep.commandline.linux-x64.0.48.1.nupkg`, extract `tools/bicep` with `python3 -m zipfile -e`, `chmod +x`.
- Tests: Chromium is preinstalled at `/opt/pw-browsers/chromium` (older than the pinned `@playwright/test`). `tests/playwright.config.js` uses it automatically when present (or `CHROMIUM_PATH`), so do not run `playwright install`. Playwright is not pinned to the sandbox: Dependabot bumps it, CI installs its own browser (2026-10-18). With Node 26 on `PATH`, run `npm ci && npm test` at the repo root.
- `az`, Azure and Pages CMS cannot be reached from the sandbox. Say plainly what was not run locally.
- The live site `http://stpaulswarton.co.uk` was reachable with `curl`. `www.stpaulswarton.co.uk` did not resolve (the sandbox resolver only answers `A` for some names). It does exist: see the DNS how-to.
- Later on 2026-10-17: GitHub release downloads and `git ls-remote` worked, and `raw.githubusercontent.com` served docs sources (Pages CMS, Static Web Apps, Hugo, Web3Forms). The test site `brave-coast-006318103.5.azurestaticapps.net` was reachable. `calendar.google.com`, `embedsocial.com`, `web3forms.com` and DNS-over-HTTPS were blocked. Details in `docs/features/page-cms/page-cms-spec-conventions.md`.
- With the environment on full network access (2026-10-17): `dns.google` DNS over HTTPS and `rdap.nominet.uk` worked. Raw DNS on port 53 and `whois` on port 43 are still intercepted. `dig` is not installed.

## Next steps

1. Parity specs 01 to 04 and Page CMS spec 07a are done. Next is Page CMS spec 10, `docs/features/page-cms/page-cms-spec-10-editor-rollout.md`: it writes the maintainer checklist first, then the Pages CMS guide and the site guide. Specs 08 and 09 are part-built and still need their acceptance checked before 11 (cutover).
2. Every maintainer step lives in one list, `docs/features/page-cms/page-cms-how-to-run-the-maintainer-checklist.md` (from spec 10). New specs add their steps there. Say plainly when blocked on one.
3. The Cloudflare runbook (`page-cms-runbook-cloudflare.md`) is a placeholder; the maintainer is writing it in another session.
4. After Page CMS spec 12, phase 2 (design options) starts from `docs/features/redesign/redesign-feature.md` (placeholder).

## Open items

- Design options (2026-10-20): ten mockups in `docs/features/design-options/`, link sent to Paul. Waiting on his pick before any phase 2 spec.
- The contact form inbox is not chosen yet. The form stays hidden until a Web3Forms key is set.
- Easter 2026 and other seasonal pages are still being edited in the legacy back office by the church. Spec 11 re-extracts on cutover day.
