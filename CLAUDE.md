# St Paul's Warton website

Rebuild of `stpaulswarton.co.uk` as a static site. Read `docs/features/page-cms/page-cms-discovery-way-forward.md` first, then the spec you were asked to build in `docs/features/page-cms/`.

## Decisions already made

Do not reopen these without being asked.

| Topic | Decision |
|---|---|
| Direction | Static site, not Umbraco. Umbraco 17 is the fallback only if the editor trial (spec 00) fails |
| Generator | Hugo, extended, version pinned. No npm in the build |
| Editor | Pages CMS (hosted, `app.pagescms.org`), editors invited by email. No self-hosted Postgres |
| Hosting | Azure Static Web Apps, Free plan. Maintainer has Azure credits |
| Infrastructure | Bicep in `infra/`. GitHub Actions with OIDC sign in to Azure. No long-lived deployment token stored as a secret |
| DNS | Cloudflare Free for DNS and caching only. Church controls the domain registrar side |
| Branch | `main` is the default and deploy branch. Umbraco code is archived on `archive/umbraco-2019` and must not be merged back |
| Comments | Disqus removed |
| Analytics | Universal Analytics removed. Nothing in its place for now |
| Personal details | Do not put the maintainer's name, LinkedIn or personal site in the site. The legacy footer has them; leave them out |
| Content source | The live site is the source of truth. Content is small and mostly HTML blocks. URLs must stay identical to live (`/blog/article/{slug}`, `/calendar/event/{id}/{slug}`, `/notices/notice/{id}/{slug}`, `/page/{type}/{slug}`) |
| Subscribers | Export found three or four old subscribers. Publish emails dropped. RSS feeds instead, a one-off note to them, then the export is deleted (spec 12) |
| Trial | Go for the static site (2026-10-17). Phase 1 plan in `docs/features/page-cms/page-cms-feature.md` |
| Look | Keep the colours and general layout. Readability fixes only. Formal design options are phase 2, after Paul is settled |
| Logins | Removed. Paul is a Pages CMS collaborator. `/account/*` redirects home |
| Contact form | Web3Forms, one inbox, key in Site settings, hidden until a real key is set |
| Domain | Bare `stpaulswarton.co.uk` is primary. Cloudflare redirects `www` to it |
| Cookie policy | Dropped if the site and its embeds set no cookies (spec 09) |
| Cutover | DNS to Cloudflare early, Paul practises on the test URL, short freeze and re-extraction on the day |

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

## Python tests

Verification only. Not part of the repo or the workflow.

- While building a spec, write its tests and fixtures under `tests/` as the spec says, and run them (`python3 -m unittest discover -s tests -v`) to prove the work.
- Never commit `tests/`. Add `tests/` to `.git/info/exclude` at the start of the session.
- Earlier specs' tests are in git history (`git archive f1adc44 tests | tar -x` has spec 00's). Restore only what the current spec needs.
- When the branch is verified, delete `tests/` and any scratch workspace. Say in the final message what was run and its result.

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
| `.claude/skills/` | Imported obra/superpowers skills, see `.claude/skills/SUPERPOWERS.md` |
| `site/` | Hugo site |
| `infra/` | Bicep for the Static Web App |
| `.pages.yml` | Pages CMS config |
| `scripts/` | Hand-run tools (screenshots, URL check, migration). Never run in CI |
| `.github/workflows/deploy.yml` | Test, deploy Bicep, build and deploy the site |

The legacy CSS, images and views needed for reference are on `archive/umbraco-2019` under `StPauls.Web/` (`Content/`, `Views/`). Read them with `git show archive/umbraco-2019:StPauls.Web/Content/Site.less` or check the branch out into a worktree.

## Environment notes (cloud sandbox, checked 2026-10-17)

- `hugo`, `az` and `bicep` were not installed. `node` was.
- Downloads from `github.com/.../releases` returned 403 through the sandbox proxy, and `pagescms.org` did not resolve. PyPI and the npm registry were reachable.
- Install tools outside the repo. Hugo and actionlint from PyPI: `python3 -m venv <dir> && <dir>/bin/pip install hugo==0.167.0 actionlint-py`. Bicep 0.48.1 from NuGet: `https://api.nuget.org/v3-flatcontainer/azure.bicep.commandline.linux-x64/0.48.1/azure.bicep.commandline.linux-x64.0.48.1.nupkg`, extract `tools/bicep` with `python3 -m zipfile -e`, `chmod +x`.
- `az`, Azure and Pages CMS cannot be reached from the sandbox. Say plainly what was not run locally.
- The live site `http://stpaulswarton.co.uk` was reachable with `curl`. `www.stpaulswarton.co.uk` did not resolve (the sandbox resolver only answers `A` for some names). It does exist: see the DNS how-to.
- Later on 2026-10-17: GitHub release downloads and `git ls-remote` worked, and `raw.githubusercontent.com` served docs sources (Pages CMS, Static Web Apps, Hugo, Web3Forms). The test site `brave-coast-006318103.5.azurestaticapps.net` was reachable. `calendar.google.com`, `embedsocial.com`, `web3forms.com` and DNS-over-HTTPS were blocked. Details in `docs/features/page-cms/page-cms-spec-conventions.md`.
- With the environment on full network access (2026-10-17): `dns.google` DNS over HTTPS and `rdap.nominet.uk` worked. Raw DNS on port 53 and `whois` on port 43 are still intercepted. `dig` is not installed.

## Next steps

1. Spec 03 is done. Next is spec 04, `docs/features/page-cms/page-cms-spec-04-pages-home-and-menus.md`. Build the rest in order, one per session. Read `docs/features/page-cms/page-cms-spec-conventions.md` first.
2. Each spec ends with the maintainer's manual steps. Say plainly when blocked on one.
3. After spec 12, phase 2 (design options) gets its own design.

## Open items

- Event and notice dates are not shown on the live site. Spec 07 needs a date export from the legacy database, or it infers and flags them.
- The contact form inbox is not chosen yet. The form stays hidden until a Web3Forms key is set.
- Easter 2026 and other seasonal pages are still being edited in the legacy back office by the church. Spec 11 re-extracts on cutover day.
