# Two-player score, games.json and the refresh command

Type: task
Status: ready-for-agent
Blocked by: 01

## What

Build `python scraper/refresh.py`, the one command the human runs each week.

## Acceptance

- Keeps only Two-player eligible games with Votes at 2 ≥ 15.
- Computes the Two-player score as in the spec: Wilson 95% lower bound, range −1..1. Ties go to the game with more Votes at 2. Assigns # from 1 upward.
- Writes `web/public/games.json` with the dump date, the scrape date and a `games` array. Document the schema in `scraper/README.md` or a TS type that `web/` can reuse.
- **Abort rule:** if any batch fails after retries, or fewer than 2,500 games are listed, the command exits non-zero, leaves `games.json` untouched, and does not commit.
- On success, it runs `git add web/public/games.json`, then commits with the message "Data refresh <dump date>", then pushes.
- Unit tests cover the score (known values from feasibility #05, e.g. Patchwork ranks above Kelp), tie order, the Vote floor and the abort threshold.
