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
| `compare-hugo.mjs` | Compares a Hugo build with an Eleventy build page by page, after normalising asset hashes, image names, whitespace between tags, quoting and entity spelling. Lists files in only one build and prints a diff per file. Exits 1 on any difference. Used once, to check the switch to Eleventy | `node scripts/compare-hugo.mjs <hugo out> <eleventy out>`. Needs `npm ci` | Never |
