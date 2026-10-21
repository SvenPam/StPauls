---
date: 2026-10-21
tags: [plan, stpauls, design]
status: options with Paul
---

# Redesign (phase 2)

_Phase 2 is built after Page CMS spec 12, once Paul is settled in Pages CMS. Until then the site keeps the live colours and layout, with readability fixes only (see the "Look" decision in `CLAUDE.md`). Choosing a direction has started early, so the build can begin as soon as phase 1 ends._

## Where it stands

Ten mockups of the home page and one article go to Paul with the email of 2026-10-21, as one link he opens on his own. Full detail, and how to rebuild them, in `docs/features/design-options/design-options-feature.md` on branch `claude/design-options`.

| Group | Designs |
|---|---|
| Where we are now | 1 Original |
| Small changes: blue and gold, same layout | 2 Tidied up, 3 Traditional, 4 Easy reading |
| Same colours, new layout | 5 Welcome first, 6 Parish magazine, 7 Signposts |
| Something new: new colours and layout | 8 Churchyard, 9 Stained glass, 10 Estuary |

Paul was asked for his two or three favourites and anything he would keep or avoid. Mixing parts of different designs is allowed.

## Decided

- **Who signs off:** Paul, for the church. He works with others at the church (the vicar, the church contact who holds the domain), so he may want them to see the options too.
- **How options are shown:** a private claude.ai page shared by link, with a screenshot of each design and a home page and article to click through. The same files are in `docs/features/design-options/mockups/` on branch `claude/design-options` if they need to go on the test site instead.
- **Colours:** fair game for the overhaul options (maintainer, 2026-10-20). The small changes and new layouts keep blue and gold.

## To decide when this starts

- Scope, once Paul has picked: look only, or also structure and navigation. Designs 5 to 10 change the home page layout, and 7 replaces the dropdown menus.
- Whether the Pages CMS fields Paul uses change. They should not, unless a design needs it. Designs 5, 6, 8, 9 and 10 need service times in Site settings.
- How the changes are tested against the current behaviour suite.
- Fonts: the mockups load Google Fonts. The build would host them on the site, as it does Muli today, so the cookie note stays true.
