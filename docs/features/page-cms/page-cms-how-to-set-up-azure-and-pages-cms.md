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
| Azure | Owner on the subscription, so you can create the resources and assign roles |
| GitHub | Admin on `SvenPam/StPauls` |
| Tools | Azure CLI signed in (`az login`), or the Azure portal and Cloud Shell. Run from the repo root, on `main` |
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
```

The identity has no rights yet. Sections 3 and 4 give it two narrow roles. It never gets `Contributor`.

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

## 3. Deploy the Static Web App once, as yourself

A role can only be assigned on a resource that exists. Use your own rights for this one deploy. The workflow does every later one.

```bash
az deployment group create --resource-group $RG --name stpauls-web \
  --template-file infra/main.bicep --parameters infra/main.bicepparam
```

## 4. Give the identity two narrow roles

The role files are in `infra/roles/`. They hold `<SUB>` and `<RG>` placeholders, so `sed` fills them into a temp file and the repo never holds a real ID.

| Role | Grants | Assigned at | Why the workflow needs it |
|---|---|---|---|
| `StPauls template deployer` | `Microsoft.Resources/deployments/*` | The resource group | `az deployment group create` runs the Bicep on every deploy |
| `StPauls Static Web App deployer` | `Microsoft.Web/staticSites/read`, `write`, `customDomains/*`, `listSecrets/action` | The Static Web App only | Bicep updates the site and its domains, and the workflow reads its upload token |

Neither role can touch anything else in the resource group.

Create the roles:

```bash
for f in stpauls-static-web-app-deployer stpauls-template-deployer; do
  sed -e "s|<SUB>|$SUB|" -e "s|<RG>|$RG|" infra/roles/$f.json > /tmp/$f.json
  az role definition create --role-definition @/tmp/$f.json
  rm /tmp/$f.json
done
```

Assign them. Role definitions can take a minute to appear, so retry once if the first call says the role is not found:

```bash
az role assignment create --assignee $APP_ID --role "StPauls template deployer" \
  --scope $(az group show -n $RG --query id -o tsv)
az role assignment create --assignee $APP_ID --role "StPauls Static Web App deployer" \
  --scope $(az staticwebapp show -n swa-stpauls-web -g $RG --query id -o tsv)
```

Already gave the identity `Contributor` from an earlier version of this guide? Remove it:

```bash
az role assignment delete --assignee $APP_ID --role Contributor \
  --scope /subscriptions/$SUB/resourceGroups/$RG
```

Confirm. The table should list the two custom roles and nothing else:

```bash
az role assignment list --assignee $APP_ID --all -o table
```

The action names were checked against Microsoft's docs on 2026-10-18, not against a live tenant. Confirm them once:

```bash
az provider operation show --namespace Microsoft.Web \
  --query "resourceTypes[?name=='staticSites'].operations[].name" -o tsv
az role definition list --custom-role-only true \
  --query "[?roleName=='StPauls Static Web App deployer']"
```

The first list should include `Microsoft.Web/staticSites/listSecrets/action`, `write`, `read` and the `customDomains` operations. The second should show the four actions from the role file.

## 5. Add the GitHub secrets and variable

GitHub: repo Settings, Secrets and variables, Actions.

| Name | Kind | Value |
|---|---|---|
| `AZURE_CLIENT_ID` | Secret | `echo $APP_ID` |
| `AZURE_TENANT_ID` | Secret | `echo $TENANT` |
| `AZURE_SUBSCRIPTION_ID` | Secret | `echo $SUB` |
| `AZURE_RESOURCE_GROUP` | Variable | `rg-stpauls-web` |

Then check Settings, Rules (and Branches): no ruleset or branch protection may require pull requests on `main`. Pages CMS commits straight to `main`, and its saves fail if that is blocked. If you want a rule, add the Pages CMS app to its bypass list.

## 6. Run the workflow

Actions, Deploy, Run workflow, branch `main`. The run updates the Static Web App `swa-stpauls-web` (section 3 created it) and uploads the site. The site URL (`https://<name>.azurestaticapps.net`) is in the run summary. Later runs leave the resource as it is.

## 7. Connect Pages CMS

1. Go to `app.pagescms.org` and sign in with GitHub.
2. Install the Pages CMS GitHub App on `SvenPam/StPauls` only.
3. Open the repo, branch `main`.
4. Check Notices lists the three seed notices and does not show `_index.md`.

## 8. Invite the editor

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
| `AuthorizationFailed` on `Microsoft.Resources/deployments/write` | `StPauls template deployer` is missing, or assigned at the wrong resource group |
| `AuthorizationFailed` on `Microsoft.Web/staticSites/write` or `listSecrets/action` | `StPauls Static Web App deployer` is missing, or assigned on the resource group instead of the Static Web App. Re-run the `az staticwebapp show` assignment |
| `AuthorizationFailed` on a `.../operationResults/...` read while a custom domain is added (spec 11) | Azure polls the async result with an action the role lacks. Add that single action from the error to `infra/roles/stpauls-static-web-app-deployer.json`, fill in the `<SUB>` and `<RG>` placeholders with the `sed` command from section 4, update the role from the filled file with `az role definition update --role-definition @/tmp/<file>.json`, delete that file, and extend the test in `tests/unit/roles.test.mjs` |
| Role not found when assigning | The new role definition has not replicated yet. Wait a minute and retry |
| Pages CMS save fails | A branch rule blocks direct pushes to `main` |
| Pages CMS shows a config error | It names the key to fix in `.pages.yml` |
| Workflow did not run after a save | The save did not touch `site/**`. Check the commit in GitHub |
| Image missing on the site | The body should reference `/uploads/<file>`, and the file should be in `site/static/uploads/` |
