# Feasibility verdict

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06, 08

## Question

Checking each item of the feasibility bar in the map's Notes: is the data feasible (yes / no / yes, but…)? For each item that fails, what's the workaround?

## Answer

Grilled 2026-09-25.

**Verdict: "yes, but…"**. The data is feasible, with two caveats: the weekly ranks dump is downloaded manually, and BGG may revoke the license.

| Bar item | Verdict | Workaround / note |
|---|---|---|
| 1. Legal on a public non-commercial site | Yes, but… | Revocation risk (BGG may revoke apps that compete with it). Mitigation: "Powered by BGG" logo, link each game to BGG, show BGG rank/rating unaltered, no ads or affiliate links. If the site is taken down, that's acceptable: this is an experiment. |
| 2. Seed set without HTML scraping | Yes | The `bg_ranks` CSV dump is a download, not a scrape (#02, #08). |
| 3. Full scrape < ~2 h, unattended weekly | Yes, but… | ~20 min at N = 5,000. Needs a manual weekly dump refresh (#08). |
| 4. Per-game fields | Yes | All present and sane in the 360-game sample (#04). |
| 5. Meaningful Two-player score | Yes | Wilson-bound score, Vote floor 15, ~3,300 listed games (#05, #06). |

**Resumable working store (SQLite):** not needed for feasibility. A failed 20-min scrape is cheap to rerun. Deferred to the build.
