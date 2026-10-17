---
date: 2026-10-17
tags: [spec, stpauls]
status: agreed
---

# Spec 00: editor trial

_One session. Sets up the static site foundations and proves that a non-technical editor can publish through Pages CMS. See [way forward](../discovery-way-forward.md)._

---

## Goal

Paul (or the maintainer standing in for him) adds a notice in Pages CMS and sees it on the Static Web App URL within a few minutes, without touching Git.

## Starting point

`main` contains only `README.md` and `docs/`. The Umbraco code is on `archive/umbraco-2019`. Legacy CSS and images are copied from that branch where needed.

## In scope

- Hugo site in `site/`, with a Notices section only: list page and single page.
- Minimal layout reusing the legacy `bootstrap.css` and `Site.css` from the archive branch. Header, footer, no personal details, no analytics.
- Three notices copied from the live site as seed content.
- Pages CMS config (`.pages.yml` at repo root) for the Notices collection and a media folder.
- Bicep for the Static Web App in `infra/`.
- GitHub Actions workflow that deploys the Bicep, builds the site and deploys it.
- How-to in `docs/` for the manual Azure and Pages CMS setup.

## Out of scope

Other sections, URL parity with live, DNS and custom domain, style modernisation (spec 06), nightly build.

---

## Requirements

### Content model: notice

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | |
| `date` | date | Yes | Sort order, newest first |
| `summary` | string | No | Shown on the list page |
| `location` | string | No | |
| body | rich text (HTML) | Yes | Stored as the file body. Hugo must render raw HTML |

Files live at `site/content/notices/{slug}.md`. Uploaded images go to `site/static/uploads/`.

### Infrastructure (`infra/`)

| | |
|---|---|
| File | `infra/main.bicep`, resource group scope |
| Resource | `Microsoft.Web/staticSites`, SKU `Free`, latest GA API version |
| Parameters | `name`, `location` (default `westeurope`), `tags` |
| Outputs | Site name, default hostname |
| Not included | Custom domain (spec 09), linked backends, app settings |

### Pipeline (`.github/workflows/deploy.yml`)

| | |
|---|---|
| Triggers | Push to `main` touching `site/**`, `infra/**`, `.pages.yml` or the workflow. Manual dispatch |
| Azure sign in | `azure/login` with OIDC. No client secret, no stored SWA deployment token |
| Infra step | Deploy `infra/main.bicep` to the resource group (idempotent) |
| Build step | Pinned Hugo extended version, `hugo --minify` in `site/`. No npm |
| Deploy step | Read the SWA deployment token at run time with Azure CLI, mask it, deploy `site/public` with `Azure/static-web-apps-deploy` (`skip_app_build: true`) |
| Config | `staticwebapp.config.json` with a 404 page |
| Secrets | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` |
| Variables | `AZURE_RESOURCE_GROUP` |
| Permissions | `id-token: write`, `contents: read` |

### Pages CMS

- Notices collection: create, edit, delete. Fields as above.
- Media: upload to `site/static/uploads/`, referenced as `/uploads/...`.
- Commits go to `main`.

---

## Manual steps (maintainer)

1. GitHub: set the default branch to `main`. Optionally delete `master`.
2. Azure: create a resource group (e.g. `rg-stpauls-web`, West Europe).
3. Entra ID: create an app registration with a federated credential for `repo:SvenPam/StPauls:ref:refs/heads/main`. Grant it Contributor on the resource group.
4. GitHub: add the three `AZURE_*` secrets and the `AZURE_RESOURCE_GROUP` variable.
5. Run the workflow. Note the `*.azurestaticapps.net` URL.
6. Sign in at `app.pagescms.org` with GitHub and install the Pages CMS GitHub App on this repo.
7. In Pages CMS, invite the trial editor by email.

---

## Acceptance

- [ ] Workflow creates the Static Web App from Bicep on first run and is a no-op on later runs.
- [ ] Push to `main` deploys the site to its `*.azurestaticapps.net` URL.
- [ ] Notices list and single pages render with the legacy styling.
- [ ] A notice created in Pages CMS, with an image, appears on the site within 5 minutes with no other action.
- [ ] Editing and deleting a notice in Pages CMS is reflected on the site.
- [ ] The email-invited editor can do the above without a GitHub account.
- [ ] Maintainer records go or no-go in the way forward doc.
