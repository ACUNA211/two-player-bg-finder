# Map: BGG data feasibility

Labels: wayfinder:map

## Destination

A yes / no / "yes, but…" verdict on whether we can get the BGG data a public two-player game finder needs, and how, judged against the feasibility bar in Notes. It includes the Two-player score formula, the Vote floor and the Seed set size, all chosen from real data.

## Notes

- Domain: board games, BoardGameGeek (BGG) XML API2. Glossary in `CONTEXT.md`: use its terms (Player-count poll, Votes at 2, Best-at-2 %, Two-player score, Vote floor, Two-player eligible, Seed set).
- Language: Python for any scripts; JSON as the page's data format.
- The site is intended to be **public and non-commercial**, with low traffic.
- Feasibility bar (all must hold, or the verdict says "yes, but…" with the workaround):
  1. Legal to use BGG API data on a public, non-commercial site (registration and attribution handled).
  2. The Seed set (top-N ranked game IDs) can be obtained without HTML scraping.
  3. A full Seed set scrape finishes in under ~2 hours and can run unattended weekly.
  4. Per game we get: Player-count poll, weight, playtime, thumbnail, min/max players.
  5. Real poll data supports a meaningful Two-player score, with enough games above the Vote floor.
- Skills: `grilling` + `domain-modeling` for grilling tickets; `research` for research tickets. Research findings go in `research/` in this folder (no git repo yet, so no research branches).

## Decisions so far

- [BGG XML API2 access rules, terms and limits](issues/01-bgg-api-access-rules-and-limits.md): Registration + Bearer token is now required (no commercial license needed if non-commercial), but exact rate limits, max batch size, and full Terms-of-Use wording (attribution/logo/caching) could not be confirmed against BGG's own pages due to bot-protection blocking automated fetches — needs empirical/manual follow-up; `/thing?stats=1` does return the Player-count poll, averageweight, playtime, thumbnail, and min/maxplayers.
- [Where to get the Seed set of ranked game IDs](issues/02-seed-set-source.md): BGG's own `bg_ranks` CSV dump is the best source (id, name, year, rank; no min/max players) but its download page requires a logged-in BGG session, so it isn't fetchable by a plain unattended GET — needs a login-session workaround or fallback; stale third-party datasets exist only as a bootstrap.

## Not yet specified

- Workarounds for any other bar item that fails, e.g. if rate limits push a full scrape far past 2 hours, or the terms rule out a public site. (The ranks-dump login problem has graduated into "How the weekly run gets the ranks dump".)
- Whether a resumable working store (e.g. SQLite) matters for feasibility. It's only in scope if the scrape turns out long or fragile enough that restarting from scratch is unacceptable.

## Out of scope

- BGG username / owned-games cross-reference. Dropped for now. If it returns, the decided behaviour is to **filter the list to owned games only** ("which of my games is best at 2?").
- Building the site: page UI, hosting, the weekly scheduling setup, choosing the scraper's storage format. These are build decisions for after the verdict.
