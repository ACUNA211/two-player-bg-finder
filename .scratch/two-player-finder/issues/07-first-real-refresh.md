# First real data refresh

Type: task
Status: resolved
Blocked by: 02, 04, 05, 06

## Checklist (human)

1. Download a fresh `bg_ranks` CSV while logged into BGG, and save it in `data/`.
2. Check that `BGG_TOKEN` is set, then run `python scraper/refresh.py`. It takes about 20 min.
3. Check the live site: about 3,300 games are listed, the top of the list looks right (e.g. Patchwork near the top), the filters work, and the footer shows the logo.

## Comments

**Agent (2026-09-25):** Ran the refresh on `boardgames_ranks_2026_09_25.csv`. All 250 batches succeeded and 3,638 games are listed, a bit more than the ~3,300 estimate. It pushed commit `95ea384`. The live `games.json` matches the local copy: dump and scrape dates are both 2026-09-25, the top 3 are 7 Wonders Duel, Patchwork and Star Wars: Rebellion, and the logo is served. Filters and footer weren't checked in a browser; both are covered by unit tests.
