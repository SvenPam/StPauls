---
date: 2026-10-17
tags: [spec, plan, stpauls]
status: agreed
---

# Spec 01: DNS preparation

_One session, mostly writing. Gets the domain's DNS onto Cloudflare early, still pointing at the old site, so cutover day (spec 11) is a record change and not a hunt for registrar logins. See the [design](page-cms-feature.md) and [conventions](page-cms-spec-conventions.md)._

---

## Goal

The maintainer has a how-to, with instructions for the login holder, that, once followed, put `stpaulswarton.co.uk` on a Cloudflare Free zone with every existing record copied across, and nothing visitors or email users can notice.

## Starting point

- DNS is controlled by the church. The registrar is 123 Reg (found 2026-10-17, see the how-to). A church contact holds the login. They are known to the maintainer and are not named in the repo.
- The live site answers on `http://stpaulswarton.co.uk` (HTTP only, Azure App Service, `ARRAffinity` cookie, IIS headers).
- `www.stpaulswarton.co.uk` appears in links inside live content. It exists (a `CNAME` to the bare domain), but the App Service answers it with `403`.
- The sandbox's own resolver only answers `A` queries. With the environment on full network access, `dns.google` (DNS over HTTPS) and `rdap.nominet.uk` work, and steps 1 and 2 were done from there.

## In scope

- `docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md`: record the current DNS, find the registrar, create the Cloudflare zone, copy and check records, change nameservers, verify, roll back.
- Instructions in the how-to that the maintainer emails to the login holder, written for someone non-technical. The first approach to the church is the maintainer's own email and is not kept in the repo.
- A table in the how-to for the maintainer to fill in with today's records, so spec 11 knows exactly what to change.
- `scripts/check-dns-cloudflare.sh`: a hand-run check for step 8 that reads the records table. Doc tests were written and run during the build, then dropped at the maintainer's request.

## Out of scope

Proxying (orange cloud), HTTPS settings, redirect rules, the Static Web App custom domain, any change to what visitors see. All of that is spec 11.

---

## Requirements

### Order of work in the how-to

| Step | Who | What | Done when |
|---|---|---|---|
| 1 | Maintainer | Record today's DNS with the commands below and fill in the records table | Table filled in, including MX, TXT and `asuid` records if any |
| 2 | Maintainer | Find the registrar (`whois stpaulswarton.co.uk`, or the Nominet WHOIS web lookup) | Registrar name and renewal date written in the how-to |
| 3 | Maintainer | Contact the login holder (own email, not in the repo) | Login holder agrees to help |
| 4 | Maintainer | Create a Cloudflare account and add the zone on the Free plan | Cloudflare shows the zone as pending, with two assigned nameservers |
| 5 | Maintainer | Compare Cloudflare's imported records with the table and add anything missing. Every record is **DNS only** (grey cloud) | Records match the table one for one |
| 6 | Maintainer | Turn off anything Cloudflare enables that changes traffic while DNS only: leave SSL/TLS, Always Use HTTPS and redirect rules untouched | Settings unchanged from defaults, zone still DNS only |
| 7 | Login holder, by email | Send a screenshot of the current records, then replace the nameservers with Cloudflare's two, following the how-to's instructions | Registrar shows the Cloudflare nameservers |
| 8 | Maintainer | Verify: Cloudflare shows the zone active, the site loads over HTTP as before, email still arrives at any church addresses on the domain | All three checks pass |
| 9 | Maintainer | Record the outcome and date in the how-to and in `docs/features/page-cms/page-cms-discovery-way-forward.md` | Recorded |

### Lookups the how-to gives

All runnable on macOS or Linux (`dig`) with Windows equivalents (`nslookup -type=<T>`):

| Record | Names to query |
|---|---|
| `NS`, `SOA` | `stpaulswarton.co.uk` |
| `A`, `AAAA`, `CNAME` | `stpaulswarton.co.uk`, `www.stpaulswarton.co.uk` |
| `MX` | `stpaulswarton.co.uk` |
| `TXT` | `stpaulswarton.co.uk`, `_dmarc.stpaulswarton.co.uk`, `asuid.stpaulswarton.co.uk`, `asuid.www.stpaulswarton.co.uk` |
| `CNAME` | `autodiscover.stpaulswarton.co.uk`, `mail.stpaulswarton.co.uk` (only if email is on the domain) |

Plus: the Azure portal's custom domains blade for the legacy App Service, which lists the host names it expects. Cloudflare's import only finds common names, so `asuid` TXT records and anything unusual must be checked by hand.

### Records table

The how-to has an empty table with columns `Type`, `Name`, `Value`, `TTL`, `Notes`, and one row per record found. The maintainer fills it in during step 1. Spec 11 reads it.

### Instructions for the login holder

- Dropped from the first build: a message to the church inside the how-to. The maintainer writes that email and keeps it out of the repo, along with the names of church contacts.
- Step 7 and the rollback are done by email, so the how-to has ready-to-send instructions: numbered, plain words, the button names to look for, a screenshot at the end of each part, and "stop and email me" if anything looks different. No names or contact details.

### Rollback

The how-to says how to undo step 7: put the old nameservers back at the registrar. The old values come from step 1, which is why the NS row is mandatory.

---

## Manual steps (maintainer)

All of steps 1 to 9 above. This spec only writes the documents; nothing in it can be run from the sandbox.

---

## Acceptance

- [ ] `python3 -m unittest discover -s tests -v` passes.
- [ ] The how-to exists, follows the docs conventions, and covers every row of the step table, the lookup table, the records table and the rollback.
- [ ] The login holder instructions read plainly, have no em dash and contain no names or contact details.
- [ ] After the maintainer completes the steps: the zone is active on Cloudflare, all records are DNS only, the old site and email work as before, and the outcome is recorded.

---

## Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tested how-to and message that let the maintainer move DNS to Cloudflare with no visible change.

**Architecture:** One how-to document with an empty records table the maintainer fills in. Doc tests guard the parts that matter on cutover day.

**Tech Stack:** Markdown, Python 3 `unittest`.

**Spec:** the sections above, from Goal to Acceptance. Shared rules in [conventions](page-cms-spec-conventions.md).

### Global Constraints

- Everything in [conventions: global constraints](page-cms-spec-conventions.md#global-constraints).
- The how-to is `docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md`, front matter `tags: [how-to, stpauls, dns]`, `status: draft` until the maintainer records the outcome.
- No em dash anywhere in the how-to, including the message.
- Cloudflare records stay **DNS only** in this spec. The words "Proxied" and "orange cloud" appear only to say not to use them yet.

### Review Focus

1. Church email on the domain breaks because MX, SPF or DKIM records were not copied. Pinned by `test_mail_records_are_checked`.
2. The legacy App Service loses its domain binding because an `asuid` TXT record was missed by Cloudflare's import. Pinned by `test_asuid_records_are_checked`.
3. Nameservers changed with no record of the old ones, so there is no way back. Pinned by `test_rollback_uses_recorded_nameservers`.
4. Someone switches on proxying early and the HTTP-only old site starts redirecting or failing TLS. Pinned by `test_records_stay_dns_only`.
5. The message leaks the maintainer's details or reads like a form letter. Pinned by `test_message_has_no_personal_details` and the reviewer reading it aloud.

---

### Task 1: DNS how-to and church message

**Files:**
- Create: `docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md`
- Modify: `tests/test_docs.py` (add `DnsHowToTests`)

**Interfaces:**
- Consumes: `REPO` from `tests/helpers.py`.
- Produces: a records table under the heading `## Current records` with the header row `| Type | Name | Value | TTL | Notes |`. Spec 11 reads it. A heading `## Message to the church` holding the message as a blockquote.

- [ ] **Step 1: Write the failing tests in `tests/test_docs.py`**

```python
DNS = REPO / "docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md"

class DnsHowToTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = DNS.read_text(encoding="utf-8")

    def test_front_matter_and_title(self):
        self.assertTrue(self.doc.startswith("---\n"))
        self.assertIn("tags: [how-to, stpauls, dns]", self.doc)
        self.assertEqual(len(re.findall(r"(?m)^# ", self.doc)), 1)

    def test_no_em_dash(self):
        self.assertNotIn("\u2014", self.doc)

    def test_records_table(self):
        self.assertIn("## Current records", self.doc)
        self.assertIn("| Type | Name | Value | TTL | Notes |", self.doc)

    def test_mail_records_are_checked(self):
        for name in ("MX", "_dmarc.stpaulswarton.co.uk", "SPF", "DKIM"):
            self.assertIn(name, self.doc)

    def test_asuid_records_are_checked(self):
        self.assertIn("asuid.stpaulswarton.co.uk", self.doc)
        self.assertIn("asuid.www.stpaulswarton.co.uk", self.doc)

    def test_rollback_uses_recorded_nameservers(self):
        self.assertIn("## Roll back", self.doc)
        self.assertRegex(self.doc, r"(?s)## Roll back.*old nameservers")

    def test_records_stay_dns_only(self):
        self.assertIn("DNS only", self.doc)
        for line in self.doc.splitlines():
            if "Proxied" in line or "orange cloud" in line:
                self.assertRegex(line, r"(?i)\b(not|don't|do not)\b", line)

    def test_message_has_no_personal_details(self):
        msg = self.doc.split("## Message to the church", 1)[1].split("\n## ", 1)[0]
        self.assertLess(len(msg.split()), 170)
        for term in ("pammenter", "ste-pam", "linkedin", "@"):
            self.assertNotIn(term, msg.lower())
        self.assertIn("[name]", msg)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python3 -m unittest discover -s tests -p 'test_docs.py' -v`
Expected: `DnsHowToTests` errors with `FileNotFoundError`.

- [ ] **Step 3: Write the how-to**

Sections in this order: summary line, `## Before you start` (who does what, time needed), `## Current records` (lookup commands from the spec's lookup table, then the empty records table), `## Find the registrar`, `## Message to the church`, `## Create the Cloudflare zone` (Free plan, review imported records against the table, every record DNS only, leave SSL/TLS and redirect settings alone), `## Change the nameservers`, `## Check it worked` (zone active, `http://stpaulswarton.co.uk` loads, a test email to a church address arrives if the domain has email), `## Roll back`, `## Outcome` (date, registrar, nameservers before and after, left blank). Step numbers match the spec's order of work table.

Write the message to the brief in the spec. Run the humanizer skill over it before committing.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `python3 -m unittest discover -s tests -v`
Expected: all tests pass (Hugo-dependent tests need Hugo on `PATH`).

- [ ] **Step 5: Commit**

```bash
git add docs/features/page-cms/page-cms-how-to-move-dns-to-cloudflare.md tests/test_docs.py
git commit -m "Add how-to for moving DNS to Cloudflare"
```

---

### Task 2: Hand-off

**Files:**
- Modify: `docs/features/page-cms/page-cms-discovery-way-forward.md` (one line under Decisions: DNS move in progress, link to the how-to)

- [ ] **Step 1: Add the line and run the full test suite**

Run: `python3 -m unittest discover -s tests -v`
Expected: all pass.

- [ ] **Step 2: Commit and push the branch**

```bash
git add docs/features/page-cms/page-cms-discovery-way-forward.md
git commit -m "Link the DNS how-to from the way forward"
git push -u origin <session branch>
```

- [ ] **Step 3: Tell the maintainer** that steps 1 to 9 are theirs, that the message is ready to send, and that nothing was looked up from the sandbox.
