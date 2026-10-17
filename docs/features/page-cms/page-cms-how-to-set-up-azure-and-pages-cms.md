---
date: 2026-10-17
tags: [how-to, stpauls]
status: draft
---

# How to set up Azure and Pages CMS for the editor trial

_The manual steps for [spec 00](page-cms-spec-00-editor-trial.md): Azure, Entra ID, GitHub and Pages CMS, then the trial with Paul._

---

## Before you start

| | |
|---|---|
| Azure | Owner (or User Access Administrator) on the subscription, so you can assign a role |
| GitHub | Admin on `SvenPam/StPauls` |
| Tools | Azure CLI signed in (`az login`), or the Azure portal and Cloud Shell |
| Branch | The spec 00 branch merged to `main`. The workflow only deploys from `main` |
| Time | About 30 minutes, plus the trial |

The commands below use bash. Set these once:

```bash
SUB=$(az account show --query id -o tsv)
TENANT=$(az account show --query tenantId -o tsv)
RG=rg-stpauls-web
```

---

## 1. Create the resource group

```bash
az group create --name $RG --location westeurope
```

Portal: Resource groups, Create, name `rg-stpauls-web`, region West Europe.

## 2. Create the sign-in identity for GitHub Actions

The workflow signs in to Azure with OIDC. No password or token is stored in GitHub.

```bash
APP_ID=$(az ad app create --display-name github-stpauls-deploy --query appId -o tsv)
az ad sp create --id $APP_ID

az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

az role assignment create --assignee $APP_ID --role Contributor \
  --scope /subscriptions/$SUB/resourceGroups/$RG
```

The subject must be exactly `repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main`. GitHub sends this repo's subject with the numeric owner and repo IDs, not the plain `owner/repo` form most guides show. The IDs stay the same if the repo is renamed. If sign in ever fails, copy the `subject claim` line from the azure/login step's log. It only trusts runs on `main`.

Already created the credential with the plain form? Fix it in place:

```bash
az ad app federated-credential update --id $APP_ID --federated-credential-id github-main --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:SvenPam@3789646/StPauls@1423163125:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

## 3. Add the GitHub secrets and variable

GitHub: repo Settings, Secrets and variables, Actions.

| Name | Kind | Value |
|---|---|---|
| `AZURE_CLIENT_ID` | Secret | `echo $APP_ID` |
| `AZURE_TENANT_ID` | Secret | `echo $TENANT` |
| `AZURE_SUBSCRIPTION_ID` | Secret | `echo $SUB` |
| `AZURE_RESOURCE_GROUP` | Variable | `rg-stpauls-web` |

Then check Settings, Rules (and Branches): no ruleset or branch protection may require pull requests on `main`. Pages CMS commits straight to `main`, and its saves fail if that is blocked. If you want a rule, add the Pages CMS app to its bypass list.

## 4. Run the workflow

Actions, Deploy, Run workflow, branch `main`. The first run creates the Static Web App `swa-stpauls-web`. The site URL (`https://<name>.azurestaticapps.net`) is in the run summary. Later runs leave the resource as it is.

## 5. Connect Pages CMS

1. Go to `app.pagescms.org` and sign in with GitHub.
2. Install the Pages CMS GitHub App on `SvenPam/StPauls` only.
3. Open the repo, branch `main`.
4. Check Notices lists the three seed notices and does not show `_index.md`.

## 6. Invite the editor

In the project's Settings, Collaborators, invite Paul by email. He signs in with the emailed link. He does not need a GitHub account.

---

## Trial

Allow up to 5 minutes for each change to appear on the site. Progress is visible under Actions in GitHub.

| # | Paul does | Expected on the site |
|---|---|---|
| 1 | Adds a notice with a title, date, summary and a photo in the body | Listed first on `/notices/`, photo shows on its page |
| 2 | Edits that notice's text | Change shows |
| 3 | Adds a notice dated next month | Listed, not hidden |
| 4 | Deletes the notice from step 1 | Gone from the list, its page returns "Page Not Found" |

Record go or no-go as a new row in the Decisions table of [way forward](page-cms-discovery-way-forward.md), with a line on what Paul found hard.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `AADSTS700213` or `AADSTS70021` at Azure sign in | The federated credential subject does not match. Check case and branch |
| Deploy infrastructure step fails with an authorisation error | The role assignment is missing or on the wrong resource group |
| Pages CMS save fails | A branch rule blocks direct pushes to `main` |
| Pages CMS shows a config error | It names the key to fix in `.pages.yml` |
| Workflow did not run after a save | The save did not touch `site/**`. Check the commit in GitHub |
| Image missing on the site | The body should reference `/uploads/<file>`, and the file should be in `site/static/uploads/` |
