---
date: 2026-10-17
tags: [how-to, stpauls, dns]
status: draft
---

# How to move DNS to Cloudflare

_The manual steps for [spec 01](page-cms-spec-01-dns-preparation.md): copy today's DNS for `stpaulswarton.co.uk` into a Cloudflare Free zone, every record DNS only, still pointing at the old site, so visitors and email users notice nothing. [Spec 11](page-cms-spec-11-cutover.md) reads the records table below on cutover day._

---

## Before you start

| Step | Who | What | Section |
|---|---|---|---|
| 1 | Maintainer | Record today's DNS and fill in the records table | [Current records](#current-records) |
| 2 | Maintainer | Find the registrar | [Find the registrar](#find-the-registrar) |
| 3 | Maintainer | Send the message to the church contact | [Message to the church](#message-to-the-church) |
| 4 | Maintainer | Create a Cloudflare account and add the zone on the Free plan | [Create the Cloudflare zone](#create-the-cloudflare-zone) |
| 5 | Maintainer | Compare the imported records with the table, add anything missing, set every record to DNS only | [Create the Cloudflare zone](#create-the-cloudflare-zone) |
| 6 | Maintainer | Leave SSL/TLS, Always Use HTTPS and redirect rules untouched | [Create the Cloudflare zone](#create-the-cloudflare-zone) |
| 7 | Church contact with maintainer | Replace the nameservers at the registrar with Cloudflare's two | [Change the nameservers](#change-the-nameservers) |
| 8 | Maintainer | Check the zone is active, the site loads, email arrives | [Check it worked](#check-it-worked) |
| 9 | Maintainer | Record the outcome here and in the [way forward](page-cms-discovery-way-forward.md) | [Outcome](#outcome) |

| | |
|---|---|
| Tools | A terminal with `dig` and `whois` (macOS, Linux), or `nslookup` (Windows). A browser |
| Accounts | A new Cloudflare account (free). The church contact's registrar login for step 7 |
| Time | 30 minutes for steps 1 to 6. 10 minutes on a call for step 7. Up to 48 hours of waiting before step 8 |
| Not in this how-to | Proxying, HTTPS, redirect rules, the Static Web App custom domain. All of that is spec 11 |

Nothing here was looked up from the build sandbox, which cannot run DNS lookups or `whois`. Every value below comes from you.

---

## Current records

**Step 1.** Run each lookup, then add one row to the table per answer. Leave nothing out: the `NS` row is how you roll back, and mail and `asuid` records are the ones most likely to be missed later.

| Record | Names to query |
|---|---|
| `NS`, `SOA` | `stpaulswarton.co.uk` |
| `A`, `AAAA`, `CNAME` | `stpaulswarton.co.uk`, `www.stpaulswarton.co.uk` |
| `MX` | `stpaulswarton.co.uk` |
| `TXT` | `stpaulswarton.co.uk`, `_dmarc.stpaulswarton.co.uk`, `asuid.stpaulswarton.co.uk`, `asuid.www.stpaulswarton.co.uk` |
| `CNAME` | `autodiscover.stpaulswarton.co.uk`, `mail.stpaulswarton.co.uk` (only if email is on the domain) |
| `DS` | `stpaulswarton.co.uk` (DNSSEC, see the note below) |

macOS or Linux:

```bash
D=stpaulswarton.co.uk
for t in NS SOA A AAAA CNAME MX TXT DS; do echo "== $t $D"; dig +noall +answer $t $D; done
for t in A AAAA CNAME; do echo "== $t www.$D"; dig +noall +answer $t www.$D; done
for n in _dmarc asuid asuid.www; do echo "== TXT $n.$D"; dig +noall +answer TXT $n.$D; done
for n in autodiscover mail; do echo "== CNAME $n.$D"; dig +noall +answer CNAME $n.$D; done
```

Windows (one per line, change the type and name each time):

```text
nslookup -type=NS stpaulswarton.co.uk
nslookup -type=MX stpaulswarton.co.uk
nslookup -type=TXT _dmarc.stpaulswarton.co.uk
nslookup -type=TXT asuid.www.stpaulswarton.co.uk
```

`dig` prints the TTL as the second column. `nslookup` does not; use `nslookup -debug` or write `auto`.

Then check by hand what an import would miss:

| Check | Where | Why |
|---|---|---|
| Host names the legacy App Service expects | Azure portal, the legacy App Service, **Custom domains** | Each bound name needs its `A` or `CNAME`, and usually an `asuid` TXT record. Lose those and Azure drops the binding |
| `asuid.stpaulswarton.co.uk`, `asuid.www.stpaulswarton.co.uk` | The `TXT` lookups above | Cloudflare's import only finds common names, so these are added by hand in step 5 |
| SPF | `TXT` on `stpaulswarton.co.uk` starting `v=spf1` | Without it, mail from church addresses lands in spam |
| DKIM | `TXT` or `CNAME` at `<selector>._domainkey.stpaulswarton.co.uk`. Selectors are not discoverable by lookup. Ask whoever runs church email, or read the headers of a mail sent from a church address (`DKIM-Signature: ... s=<selector>`) | Signed mail fails checks without it |
| DMARC | `TXT` on `_dmarc.stpaulswarton.co.uk` | Same as SPF |
| MX | `MX` on `stpaulswarton.co.uk` | No MX means no incoming mail. If there is none, the domain has no email and step 8's email check is skipped |
| DNSSEC | `DS` on `stpaulswarton.co.uk` | If a `DS` record exists, DNSSEC must be turned off at the registrar and the `DS` record gone before step 7, or the domain stops resolving. Turn it back on from Cloudflare later |

Use `@` for the bare domain in the Name column.

| Type | Name | Value | TTL | Notes |
|---|---|---|---|---|
| NS | @ | | | Mandatory. Every nameserver, one row each. Used to roll back |
| SOA | @ | | | Primary nameserver and contact, for reference only |
| A | @ | | | Legacy App Service |
| | | | | |

Add a row for every other answer, including `www`, `MX`, every `TXT` (SPF, DKIM, DMARC, `asuid`), `autodiscover`, `mail` and `DS`. Write "none" in Notes for a lookup that returned nothing, so spec 11 knows it was checked.

---

## Find the registrar

**Step 2.** Run `whois stpaulswarton.co.uk`, or use the Nominet WHOIS lookup at `https://www.nominet.uk/whois/`. Copy these into the [Outcome](#outcome) table:

| Field in the WHOIS output | Why |
|---|---|
| Registrar | Where the church contact logs in |
| Renewal date (shown as `Expiry date`) | A lapsed domain takes the site and email down. Tell the church if it is within three months |
| Name servers | Must match the `NS` rows in the records table |
| DNSSEC | `Signed` means do the DNSSEC step before step 7 |

---

## Message to the church

**Step 3.** Send this to whoever at the church is most likely to know.

> Hi [name],
>
> I'm helping move the St Paul's website off an old paid server onto a free one that the church stays in control of. To get it ready I need a hand from whoever looks after the church's web address, stpaulswarton.co.uk. That's usually a login with a company like 123 Reg, GoDaddy or Fasthosts, often set up years ago.
>
> Do you know who that might be, or where the login is kept? Once we find it, the job takes about ten minutes and means changing two settings. I'm happy to do it with them over a phone or video call.
>
> Nothing on the website or church email changes at this stage. Doing it now means the switch later is a five-minute job rather than a hunt for passwords.
>
> Thanks,
> [your name]

---

## Create the Cloudflare zone

**Step 4.** Sign up at `https://dash.cloudflare.com/sign-up`, then **Add a domain**, enter `stpaulswarton.co.uk`, pick **Free**. Let it scan for records. Cloudflare shows the zone as **Pending** and lists two nameservers ending `.ns.cloudflare.com`. Write both in the [Outcome](#outcome) table.

Cloudflare removes a zone that stays pending too long (weeks, not months), taking any records you added with it. If the church takes a while to reply, do step 5 shortly before the step 7 call, or check the zone is still there first. If it has gone, add it again and redo step 5 from the table.

**Step 5.** Open **DNS**, **Records**, and go through the records table one row at a time.

| Do | Why |
|---|---|
| Add every row the scan missed, with the same type, name and value. `asuid` TXT records and DKIM will almost certainly be missing | Missing `asuid` drops the old site's Azure binding. Missing mail records break church email |
| For anything the scan found that is not in the table, run `dig +short <type> <name> @<old nameserver>` with an old nameserver from the `NS` row. If it answers, add it to the table and keep it. Delete it only if it does not | The scan reads live DNS, so its extras are usually real records (`webmail`, `ftp`, Microsoft 365 `SRV` or `selector1._domainkey`) that your lookups did not guess |
| Set every record to **DNS only** (grey cloud). The scan often marks `A` and `CNAME` records as Proxied; do not leave any record Proxied | The old site is HTTP only. With proxying on, Cloudflare would start answering for it and could redirect or fail TLS |
| Leave TTL on **Auto** | Matches closely enough, and is easy to change on cutover day |
| Do not add NS records for `@` | Cloudflare manages those itself |

Done when the Cloudflare list matches the table one for one, and no record shows the orange cloud. Do not switch any record to the orange cloud until spec 11.

**Step 6.** Change nothing else. In particular:

| Setting | Leave it |
|---|---|
| SSL/TLS | As created |
| **Always Use HTTPS** | Off |
| Redirect rules, page rules | None |
| Email Routing | Off. Turning it on replaces the MX records |
| DNSSEC in Cloudflare | Off for now |

With every record DNS only, none of these touch visitor traffic, but leaving them alone keeps spec 11 a clean start.

---

## Change the nameservers

**Step 7.** On a call with the church contact, logged in at the registrar:

1. Open the registrar's DNS settings and compare the registrar's own record list with the Cloudflare zone. It is the only complete list of the zone (use its export if it has one). Add anything missing to the table and to Cloudflare first. Ask whether church email is a forward provided by the registrar: if so, it may stop when the nameservers move, so set it up in Cloudflare's records (the registrar's help pages give the `MX` values) or stop and ask before going on.
2. If WHOIS showed DNSSEC as signed: turn DNSSEC off (or delete the `DS` record) first, then wait until `dig DS stpaulswarton.co.uk` returns nothing.
3. Find the domain's nameserver settings (often **Manage DNS**, **Nameservers**, or **Use custom nameservers**).
4. Replace the existing nameservers with the two Cloudflare ones from step 4. Remove any others.
5. Save. Check the registrar now lists only the two Cloudflare nameservers.

Leave the registrar's own DNS records in place if it lets you. Many registrars clear them when custom nameservers are set, which is why the records table matters for rolling back.

---

## Check it worked

**Step 8.** The change can take up to 48 hours to reach everyone. Cloudflare emails when the zone is active. Then, from the repo root on macOS or Linux:

```bash
scripts/check-dns-cloudflare.sh
```

It checks the delegation and DNSSEC at the .uk registry, asks Cloudflare's nameservers for every filled-in row of the records table, and checks the old site still answers over HTTP without Cloudflare in the way. It prints PASS or FAIL per check and exits non-zero on any failure. The email check stays manual.

| Check | How | Pass |
|---|---|---|
| Zone active | Cloudflare dashboard, the zone overview. Or `dig NS stpaulswarton.co.uk +short` | Status **Active**, and `dig` shows only the two Cloudflare nameservers |
| Site loads as before | `curl -sI http://stpaulswarton.co.uk`, then open `http://stpaulswarton.co.uk` in a browser | `200`, IIS headers and the `ARRAffinity` cookie as before. No redirect to `https`, no Cloudflare page |
| Email arrives | Send a test email from an outside address to a church address on the domain, and ask for a reply | Both arrive, not in spam. Skip if the domain has no `MX` |
| Records match | The script, or re-run the step 1 lookups | Same values as the table |

If any check fails and you cannot fix it by correcting a record in Cloudflare within an hour, roll back.

---

## Roll back

To undo step 7, put the old nameservers back at the registrar:

1. Log in at the registrar with the church contact.
2. Replace the Cloudflare nameservers with the old nameservers from the `NS` rows of the records table, exactly as recorded.
3. If the old nameservers are the registrar's own, open its DNS editor and re-enter every record from the records table that is missing. Registrars often empty the zone when nameservers move away.
4. If DNSSEC was on before, turn it back on at the registrar.
5. Wait up to 48 hours, then check `dig NS stpaulswarton.co.uk +short` shows the old nameservers again.

Once the old nameservers answer with the records in the table, the old DNS works as it did. Cloudflare marks the zone as moved and removes it later, so a second attempt starts again at step 4.

---

## Outcome

**Step 9.** Fill this in, set `status: stable` in the front matter, and add the date and result to the Decisions table in the [way forward](page-cms-discovery-way-forward.md).

| | |
|---|---|
| Date nameservers changed | |
| Registrar | |
| Renewal date | |
| Who holds the registrar login | |
| Old nameservers | |
| Cloudflare nameservers | |
| DNSSEC before | |
| Zone active on | |
| Site check | |
| Email check | |
| Notes | |
