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
| `screenshots.mjs` | Full-page screenshots of live and new pages at several widths, for sign-off. Writes `<out>/<name>-<width>.png` | `node scripts/screenshots.mjs --out <dir> --width 390 --width 1280 <name>=<url> ...`. Needs `npm ci`. Uses Playwright's Chromium (`/opt/pw-browsers` in the sandbox), or `--chromium <path>` | Never |
| `compare-hugo.mjs` | Compares a Hugo build with an Eleventy build page by page, after normalising asset hashes, image names, whitespace between tags, quoting and entity spelling. Lists files in only one build and prints a diff per file. Exits 1 on any difference. Used once, to check the switch to Eleventy | `node scripts/compare-hugo.mjs <hugo out> <eleventy out>`. Needs `npm ci` | Never |
| `check-urls.mjs` | Checks every path in a list (`tests/fixtures/live-urls.txt`, the live sitemap plus old link variants) against a build or a deployed host. `--built` passes a path with a built page or file or a matching route in the built `staticwebapp.config.json`. `--base` passes on 200, or on a redirect to the target its route names (routes read from a local build). `--redirects-to` expects every path to 301 to the same path on another host. Prints each failure and `N checked, M failed`, exits 1 on any failure. Used in specs 07 and 11 | `npm run build`, then `node scripts/check-urls.mjs --list tests/fixtures/live-urls.txt --built _site`, or `--base https://<host> [--config _site/staticwebapp.config.json]`, or `--base https://www.stpaulswarton.co.uk --redirects-to https://stpaulswarton.co.uk`. Node only. Behind the sandbox proxy add `NODE_USE_ENV_PROXY=1` | Never |
| `migrate.mjs` | Extracts every article, event, notice and page from the live site into `site/content/` as Markdown bodies, keeping the event and notice dates and event locations already written (from the SQL export, spec 07a; a fresh export in `--db` wins), downloads uploads and hot-linked images into `site/static/uploads/`, appends extra legacy upload spellings to `site/data/legacy.yaml`, and writes `docs/features/page-cms/page-cms-migration-report.md`. Re-runnable: a second run changes nothing. `--check` writes nothing, lists what would change and exits 1 if anything would. Spec 07, run again on cutover day (spec 11) | `NODE_USE_ENV_PROXY=1 node scripts/migrate.mjs [--live http://stpaulswarton.co.uk] [--db docs/features/migration/data] [--site site] [--report <file>] [--check]`. Needs `npm ci` | Never |
