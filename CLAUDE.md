# St Paul's Warton website

Rebuild of `stpaulswarton.co.uk` as a static site. Read `docs/discovery-way-forward.md` first, then the spec you were asked to build in `docs/specs/`.

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
| Subscribers | Maintainer will export the list. Likely empty. Publish emails are dropped if so |

## Who is who

| | |
|---|---|
| Maintainer | Owns the repo and Azure. Volunteer, wants minimal ongoing work. Does the manual Azure, Entra ID and GitHub setup steps in each spec |
| Paul | Church contact and the editor. Not technical. Must never need Git, Markdown or a terminal |

## Working with the maintainer

- Terse answers. Detail on request.
- Any message written for someone else (email, SMS, Teams, Slack): humanise it and never use an em dash.
- Markdown file names must not contain `:`, `/`, `#` or `^`.
- Do not create a pull request unless asked. Specs are built on a branch and merged to `main` when the maintainer says so.
- Manual steps (Azure portal, Entra ID, GitHub secrets, Pages CMS app install) belong to the maintainer. Document them in the spec or a how-to, and say clearly when you are blocked on one.

## Repo layout

| Path | Purpose |
|---|---|
| `docs/discovery-current-state.md` | Facts about the live site and the 2019 Umbraco port |
| `docs/discovery-way-forward.md` | Options, decisions, work outline |
| `docs/specs/` | One spec per working session |
| `.claude/skills/` | Imported obra/superpowers skills, see `.claude/skills/SUPERPOWERS.md` |
| `site/` | Hugo site (to be created in spec 00) |
| `infra/` | Bicep (to be created in spec 00) |
| `.pages.yml` | Pages CMS config (to be created in spec 00) |

The legacy CSS, images and views needed for reference are on `archive/umbraco-2019` under `StPauls.Web/` (`Content/`, `Views/`). Read them with `git show archive/umbraco-2019:StPauls.Web/Content/Site.less` or check the branch out into a worktree.

## Environment notes (cloud sandbox, checked 2026-10-17)

- `hugo`, `az` and `bicep` were not installed. `node` was.
- Downloads from `github.com/.../releases` returned 403 through the sandbox proxy, and `pagescms.org` did not resolve. PyPI and the npm registry were reachable.
- So: check whether Hugo and Bicep can be installed before relying on a local build. If not, write the files carefully, rely on the GitHub Actions run for the real build, and say plainly what was not run locally.
- The live site `http://stpaulswarton.co.uk` was reachable with `curl`.

## Next steps

1. Run spec 00 (`docs/specs/00-editor-trial.md`).
2. Maintainer judges the trial with Paul. Record go or no-go in `docs/discovery-way-forward.md`.
3. On go, write specs 01 to 10 from the work outline, one at a time, each sized for a single session.
4. On no-go, write a spec for a fresh Umbraco 17 build using the live site as the source of truth.

## Open items

- Maintainer to switch the GitHub default branch from `master` to `main`, then delete `master`.
- The maintainer reports all live features are used except the contact form (believed not to send email). The static site has no user accounts or site logins, and topic listings are rebuilt with Hugo taxonomies. Confirm with the maintainer before spec 03 that this is acceptable.
- The contact form on live is believed not to deliver email. A working form is a nice to have (spec 08).
- Easter 2026 and other seasonal pages are still being edited in the legacy back office by the church. Re-extract content from live just before cutover.
