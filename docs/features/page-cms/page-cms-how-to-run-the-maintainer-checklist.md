---
date: 2026-10-21
tags: [how-to, stpauls, checklist]
---

# How to run the maintainer checklist

Every step only the maintainer can do, from every spec, in the order to do them. Tick each one when it is done and tell Claude what the last column asks for. Specs keep their own "Manual steps" for detail, but this is the list to work from. New specs add their steps here.

Ticked on 2026-10-21 from what the repo and the maintainer's Cloudflare screen show. Everything else is open until the maintainer confirms it.

## 1. Already set up, confirm

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [x] | Resource group, OIDC app registration, `AZURE_*` secrets and variable | Spec 00, steps 2 to 4 | Nothing. The workflow deploys, so these work |
| [x] | Workflow run, test URL noted. Now `https://agreeable-island-0c85bb703.4.azurestaticapps.net` | Spec 00, step 5 | Nothing |
| [x] | Pages CMS GitHub App installed on this repo | Spec 00, step 6 | Nothing. Saves land on `main` as "via Pages CMS" commits |
| [x] | Trial editor invited by email | Spec 00, step 7 | Nothing |
| [x] | Ruleset on `main` as the [Azure and Pages CMS how-to](page-cms-how-to-set-up-azure-and-pages-cms.md) says | Parity 01, step 1 | That it is on |
| [x] | One save signed in with GitHub and one as an email collaborator, both land on `main`. If yours is refused, set the admin bypass to "Always" | Parity 01, step 2 | Whether both landed |
| [x] | The next content-only deploy skips "Deploy infrastructure" and reports the site URL | Parity 01, step 3 | The run link if it did not |
| [x] | `/account/login` on the test URL lands on Pages CMS | Parity 01, step 4 | Where it landed if not |

## 2. Test site checks

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [x] | A test notice with "Show until" yesterday is gone from home and `/notices` after the next build, and its page shows the Expired box. Delete it | Parity 02, step 1 | Anything that did not happen |
| [x] | A test event starting in 2 hours shows "Soon" on home and "2 hours to go" on its page. Delete it | Parity 02, step 2 | Anything that did not happen |
| [x] | The home page picture is edge to edge on a phone and a big screen | Parity 03, step 1 | A screenshot if not |
| [x] | Ticking "Hidden" on a page takes it out of the menu and gives "not found". Untick it | Parity 03, step 2 | Anything that did not happen |
| [ ] | View Source on an article on the test URL shows the `og:` tags | Parity 04 | When checking IG Image checker.Image is invalid "fetch failed". X card type is missing. Site name is missing. However, it is possibly due to domain: <meta property="og:image" content="https://stpaulswarton.co.uk/images/e0602c3ff16aebee9d69855cf771ce34-1024.a725c874.jpg"> |
| [x] | Site settings shows in Pages CMS, and changing the Facebook link changes the footer after the deploy. Change it back | Spec 08, step 1 | Anything that did not happen |

## 3. Security

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [x] | `curl -sI` the test URL's home page and `/notices` | Spec 09, step 1 | Every `strict-transport-security` line you see: strict-transport-security: max-age=300 |
| [x] | `curl -sI` the test URL and check the headers. Open the church diary and gallery pages: the embeds still load. The contact form posts (with a test key, if one exists) | Spec 09, step 2 | Embded social partial loads, error Content-Security-Policy: The page’s settings blocked an inline script (script-src-elem) from being executed because it violates the following directive: “script-src 'self'”. Consider using a hash ('sha256-vesi7z35ZKiipLsMDZDIikfPxhWHQUOl04AmhP+gi60=') or a nonce. (It also does not work on live). |
| [x] | The [cookie check](page-cms-how-to-check-cookies.md) | Spec 09, step 3 | The filled-in table |
| [x] | In GitHub settings: Dependabot alerts and secret scanning on, the Pages CMS app limited to this repo | Spec 09, step 4 | Nothing |
| [x] | `audit` is not a required check. Its red check on pull requests is expected | Spec 09, step 5 | Nothing |

## 4. Contact form

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [x] | The church picks an inbox: `wartonstpauls@gmail.com` (Paul, 2026-10-21) | Spec 08, step 2 | Nothing |
| [x] | At web3forms.com, request a key for `wartonstpauls@gmail.com`. It is emailed to that inbox, so Paul forwards it | [Contact form how-to](page-cms-how-to-set-up-the-contact-form.md) | Nothing |
| [x] | Paste the key into Pages CMS, Site settings, **Contact form key**, and save | Contact form how-to | Nothing |
| [ ] | Send a test message from `/contact` and check it arrives | Contact form how-to | Whether it arrived |

## 5. DNS

Cloudflare side in the [Cloudflare runbook](page-cms-runbook-cloudflare.md), records and checks in the [DNS how-to](page-cms-how-to-move-dns-to-cloudflare.md).

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [x] | Cloudflare account, `stpaulswarton.co.uk` added on the Free plan, records scanned. Nameservers `ben.ns.cloudflare.com` and `melinda.ns.cloudflare.com` | Spec 01, DNS how-to step 4 | Nothing |
| [ ] | Verify the Cloudflare account's email address (the banner on the dashboard) | Cloudflare | Nothing |
| [ ] | Compare the scanned records with the how-to's records table, and the church contact's screenshot of 123 Reg's **Manage DNS** | DNS how-to, steps 5 and 6, and step 7 part 1 | Anything missing from either |
| [ ] | The church contact changes the nameservers at 123 Reg (steps go out in the email to Paul, 2026-10-21) | DNS how-to, step 7 part 2 | Their screenshot |
| [ ] | The checks after the change, then fill in the how-to's Outcome table | DNS how-to, step 8 | The check output |

## 6. Editor rollout

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [ ] | Round-trip check: in Pages CMS, open and save without changes one article, one event, one notice, the church diary page, the gallery page, a long page with a table or many images, the home page and Site settings | Spec 10, step 1 | That it is done. Claude reads the commits |
| [] | Add screenshots to the [editor guide](page-cms-guide-for-editors.md) where marked, export it to PDF and send it to Paul | Spec 10, step 2 | Some screenshots doen't match, mostly with the text editor. You use '/' or select text to format. There are not icons alogn top. My email address needs blurring |
| [ ] | Invite Paul in Pages CMS by email | Spec 10, step 3 | Nothing |
| [ ] | Paul does the practice checklist at the end of the guide, then deletes what he added | Spec 10, step 4 | Anything Paul found confusing |
| [ ] | Send the church the [policy suggestions](page-cms-policy-updates.md). Paul applies the agreed wording in Pages CMS | Spec 10, step 5 | The agreed wording, if it differs |
| [ ] | Send Paul and the church the [site guide](page-cms-guide-to-the-site.md) | Spec 10 | Nothing |

## 7. Cutover

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [ ] | A week ahead: the Azure custom domain and its `TXT` validation record in Cloudflare, until the domain shows **Ready** | Spec 11, step 1 | That it is Ready |
| [ ] | The Cloudflare preparation and cutover settings in the runbook | Spec 11, step 2 | Nothing |
| [ ] | Agree the cutover date and time with Paul | Spec 11, step 3 | The date |
| [ ] | Cutover day, with Claude and Paul | Spec 11, step 4 | Start the session |

## 8. After cutover

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [ ] | Paste an article's address on the real domain into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/): title, description and picture show | Parity 04 | Anything missing |
| [ ] | Confirm there will be no rollback | Spec 12, step 1 | That it is confirmed |
| [ ] | Send the subscriber note, then delete the export | Spec 12, step 2 | Nothing |
| [ ] | The decommission checklist | Spec 12, step 3 | Anything left |
| [ ] | Share the church handover with whoever at the church should have it | Spec 12, step 4 | Nothing |

## 9. Later

| Done | Step | From | Tell Claude |
|---|---|---|---|
| [ ] | Share the design options link from its Share menu, then send it to Paul | [Redesign](../redesign/redesign-feature.md) | Nothing |
| [ ] | Paul's two or three favourites | Redesign | Which ones, and anything he said |
