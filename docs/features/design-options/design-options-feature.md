---
date: 2026-10-20
tags: [design, stpauls, phase-2]
status: with Paul
---

# Design options for Paul

_Ten mockups of the home page and one blog article, sent to Paul as a link so he can pick a direction for phase 2. Nothing on the real site changes until he has chosen and a spec is written for it._

---

## What Paul gets

One page, `mockups/index.html`, showing the ten designs in four groups with a screenshot, a two-line note and what each would need from him. Each design opens on its home page; a grey bar at the top switches to the article (Church Roof Completed) and steps through the designs. Words and photos are the real ones from the site. Other links show a "this is a mockup" note.

| # | Name | Group | What changes | Needs from Paul |
|---|---|---|---|---|
| 1 | Original | Where we are now | Nothing: the built site | Nothing |
| 2 | Tidied up | Small changes | Brighter photo, notices as boxes, picture on every blog card | Nothing |
| 3 | Traditional | Small changes | Name in a book typeface under a gold cross, welcome line under the photo | Nothing |
| 4 | Easy reading | Small changes | Larger text in Atkinson Hyperlegible, white header, text size switch | Nothing |
| 5 | Welcome first | Same colours, new layout | Opens with service times, directions and the next four Sundays | Service times in Site settings |
| 6 | Parish magazine | Same colours, new layout | Masthead, newest blog story large, notices and services down the side | Pictures on articles, service times |
| 7 | Signposts | Same colours, new layout | No dropdowns; twelve big buttons to every section, notices open in place | Nothing |
| 8 | Churchyard | Something new | Yew green, crocus purple, pale stone; photo strip from the gallery | Service times |
| 9 | Stained glass | Something new | Ruby, sapphire, emerald, amber; each section its own colour, arched photos | Service times |
| 10 | Estuary | Something new | Slate, sky and sand; big light type, key facts on one line | Service times |

## Calls made without asking

- **Article shown:** Church Roof Completed, the newest article whose picture exists. The CWGC article's image file is not in the site's uploads, so its card shows each design's no-picture tile instead.
- **Upcoming events:** the calendar has nothing after December 2020, so designs that show what's coming list the next four Sundays, worked out from the Regular Church Services pattern (All Aboard on the 2nd Sunday, Remembrance Sunday at 10:30am). A real build would read service times from Site settings.
- **New wording:** apart from section headings, the only words not on the live site are design 5's "Join us on Sunday at 9:30am" and design 7's "Where would you like to go?". Everything else is existing content.
- **Fonts** load from Google Fonts in the mockups. The chosen design would self-host them, as the site does with Muli today, to keep the cookie note accurate.
- **Menus:** the About, Services and Gallery dropdowns are not opened in designs 2 to 10.

## Rebuilding

From the repo root with Node 26 on `PATH`:

```sh
node scripts/design-options/build.mjs [--artifact <file>]
```

It builds the site with Eleventy into a temporary folder, writes every design to `docs/features/design-options/mockups/`, takes the screenshots with Playwright and writes the gallery. `--artifact` also writes the gallery without its document wrapper, for publishing the folder as a claude.ai artifact. Each design is one file in `scripts/design-options/designs/`. Hand-run only, never in CI.

## Next

Paul replies with the two or three he likes. The chosen direction gets its own design document and spec, with tests, before anything on `site/` changes.
