---
date: 2026-10-21
tags: [runbook, stpauls, cloudflare]
status: placeholder
---

# Cloudflare runbook

_Placeholder. The maintainer is writing this in another session. When it lands, it replaces this file and covers the Cloudflare side of spec 01 (DNS move) and spec 11 (cutover settings, `www` redirect, rollback)._

Until then, see [how to move DNS to Cloudflare](page-cms-how-to-move-dns-to-cloudflare.md) and the Cloudflare table in [spec 11](page-cms-spec-11-cutover.md#cloudflare-all-by-the-maintainer-in-the-runbook).

## Status so far (2026-10-21)

| | |
|---|---|
| Account | Created. Email address not yet verified (dashboard banner) |
| Zone | `stpaulswarton.co.uk` on the Free plan, DNS setup **Full**, status **Pending** until the nameservers change |
| Records | Scanned by Cloudflare. Still to compare with the [DNS how-to's records table](page-cms-how-to-move-dns-to-cloudflare.md#current-records) (steps 5 and 6) |
| Cloudflare nameservers | `ben.ns.cloudflare.com`, `melinda.ns.cloudflare.com` |
| Nameservers to remove | `ns47.domaincontrol.com`, `ns48.domaincontrol.com` |
| DNSSEC | Off at the registrar (unsigned), so nothing to turn off first |
| Nameserver change | Instructions go to the church contact who holds the 123 Reg login, in one email: screenshot of **Manage DNS**, then the change, then a screenshot of the new names |
| Proxy | Records not proxied yet. Proxy settings belong to cutover (spec 11) |
| Workers, Under Attack Mode | Not used |
