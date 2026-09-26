# Two-player score, games.json and the refresh command

Type: task
Status: resolved
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

## Answer

- `scraper/rank.py`: `two_player_score` (Wilson 95%), `is_listed` (eligible + Vote floor 15), and `rank_games`, which sorts by score and then Votes at 2, assigns `pos`, and raises `AbortError` below 2,500 listed.
- `scraper/refresh.py`: newest dump → fetch → rank → write `web/public/games.json` → `git add`, commit "Data refresh <dump date>", push. A `FetchError` or `AbortError` exits 1 before anything is written. The commit is skipped when the file is unchanged. The dump date comes from a `YYYY-MM-DD` in the filename, or else the file's modified date.
- Schema: `scraper/README.md` (TS types, for `web/` to reuse).
- Tests: `scraper/test_rank.py`, covering known-game order, the Wilson value, range, ties, the floor, eligibility and the abort threshold.
- Dry run on the feasibility sample matches #05 (212/360 listed; Patchwork, Netrunner, Watergate… Spirit Island #8). About 1.1 KB per game, so roughly 3 MB of JSON at full size.
- Not run live. The first real run is issue 07.
