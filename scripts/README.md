---
date: 2026-10-17
tags: [reference, stpauls, scripts]
status: stable
---

# Scripts

_Hand-run tools for the maintainer and agent sessions. None of them run in CI._

| Script | What it does | How to run | CI |
|---|---|---|---|
| `check-dns-cloudflare.sh` | Checks each record in the DNS how-to against Cloudflare's nameservers after the move | `scripts/check-dns-cloudflare.sh [domain] [how-to]`. Needs `dig` and `curl` | Never |
| `screenshots.py` | Full-page screenshots of live and new pages at several widths, for sign-off | `python3 scripts/screenshots.py --out <dir> --width 390 --width 1280 <name>=<url> ...`. Needs `pip install playwright`, Chromium from `/opt/pw-browsers` | Never |
