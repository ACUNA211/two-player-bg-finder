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
- [Set up BGG API access](issues/03-set-up-bgg-api-access.md): App registered (submitted 2026-09-23, working by 09-24); token in Windows user env var `BGG_TOKEN`, `/thing?stats=1` verified. Terms: credit BGG + "Powered by BGG" logo, no data modification, no AI training, strictly non-commercial, ≤20 IDs per `/thing` call and ~5 s between calls (full 31k-game scrape ≈ 2.2 h, just past the bar); BGG may revoke apps that compete with it. Ranks CSV downloaded manually to `data/` (31,366 ranked games); the dump falls under the API license and may be fetchable with the Bearer token (untested, see #08).
- [Pull a real sample of BGG game data and measure throughput](issues/04-pull-sample-data.md): 360-game sample across rank bands, all HTTP 200 at 20 IDs / 5 s ≈ 244 games/min (8,000 games ≈ 33 min, well under the bar). All needed fields present and sane. Games clearing the 30-vote floor: 100% of ranks 1–500, 96% at ~1000, 64% at ~2000, 35% at ~3000, ~2% at 5000+, so Seed sets past ~3–4k add little.
- [Two-player score formula and Vote floor](issues/05-two-player-score-and-vote-floor.md): Score = Wilson 95% lower bound on (Best + 0.75·Rec − NotRec) ÷ Votes at 2, range −1..1 (negatives kept and shown). Vote floor 15 (212 of 314 eligible sample games; 92% at rank ~2000, 76% at ~3000, 27% at ~5000). Ties: more Votes at 2 first.
- [Decide the Seed set size](issues/06-seed-set-size.md): N = 5,000 (~20 min scrape, ~3,300 listed games). Rebuilt weekly as the top 5,000 of the latest ranks dump, falling back to the last dump if none; games falling below 5,000 drop off.
- [How the weekly run gets the ranks dump](issues/08-ranks-dump-refresh.md): Bearer token is refused on the dump page (tested). Human downloads the dump weekly; the run falls back to the last dump; a dump >30 days old triggers a logged warning + email (email also on run failure; mechanism decided at build). Bar 3 = "yes, but…" (unattended scrape, manual Seed set refresh). Human to ask BGG about token access later.

## Not yet specified

- Workarounds for any other bar item that fails, e.g. if rate limits push a full scrape far past 2 hours, or the terms rule out a public site. (The ranks-dump login problem has graduated into "How the weekly run gets the ranks dump".)
- Whether a resumable working store (e.g. SQLite) matters for feasibility. It's only in scope if the scrape turns out long or fragile enough that restarting from scratch is unacceptable.

## Out of scope

- BGG username / owned-games cross-reference. Dropped for now. If it returns, the decided behaviour is to **filter the list to owned games only** ("which of my games is best at 2?").
- Building the site: page UI, hosting, the weekly scheduling setup, choosing the scraper's storage format, and whether the page shows the Two-player score. These are build decisions for after the verdict.
