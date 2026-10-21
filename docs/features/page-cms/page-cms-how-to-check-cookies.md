---
date: 2026-10-18
tags: [how-to, stpauls]
---

# How to check which cookies the site sets

The site itself sets no cookies, and a test checks that on every pull request. The embedded Google calendar and the EmbedSocial photo gallery may set their own. This check lists them, so the cookie policy page says what is really there. Built in [spec 09](page-cms-spec-09-security-and-delivery.md).

## Who does this

The maintainer, in a desktop browser. The sandbox cannot reach the embeds.

## Check each page

1. Open a private window (Chrome: **Incognito**, Firefox: **Private Window**), so no old cookies get in the way.
2. Open the page, wait for the calendar or gallery to finish loading, and scroll to the bottom.
3. Open developer tools (F12).
   - Chrome: **Application**, then **Storage**, **Cookies**.
   - Firefox: **Storage**, then **Cookies**.
4. Click each domain listed under **Cookies** and note every cookie name with its domain.
5. Close the private window and start a new one for the next page.

- h
- /

Pages, on the test URL `https://agreeable-island-0c85bb703.4.azurestaticapps.net`:

| Page | Embed |
|---|---|
| `/` | None |
| `/page/about/church-diary` | Google Calendar |
| `/page/gallery/church-gallery` | EmbedSocial |

If a page has moved, any page using the same embed will do.

## Record the result

Fill in the table and tell Claude.

| Page | Cookie | Domain | Checked |
|---|---|---|---|
| `/` | | https://agreeable-island-0c85bb703.4.azurestaticapps.net | [x] |
| `/page/about/church-diary` | `NID` | `.google.com` | [x] |
| `/page/about/church-diary` | `OTZ` | `calendar.google.com` | [x] |
| `/page/gallery/church-gallery` | Empty | `embedsocial.com` | [x] |

## What happens next

The choice is already made (2026-10-18): keep the cookie policy page as a short note naming each embed and its cookies, and make any embed that sets cookies click-to-load, so nothing is set until the visitor asks for it. This check decides which embeds need click-to-load.
