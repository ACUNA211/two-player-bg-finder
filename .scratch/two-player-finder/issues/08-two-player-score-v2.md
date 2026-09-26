# Two-player score v2: blend in the Geek rating

Type: task
Status: resolved
Blocked by: 07

## What

2p-only games crowd the top because a 2p-only game is rarely voted Not Recommended at 2. Rank by a blend of the Poll score and the Geek rating (see CONTEXT.md).

## Acceptance

- `rank.py`: rename the old score to `poll_score`. `score = round(100 × (0.5·poll_pct + 0.5·geek_pct), 1)`. Percentiles are taken over the listed games, as `rank/(n−1)`, with ties given the average rank.
- JSON gains `poll_score`, `poll_pct` and `geek_pct` (each 0–100). `score` runs 0–100.
- Sort by score, then poll_score, then votes2.
- Twilight Struggle ranks above 7 Wonders Duel. Patchwork, Jaipur and Hive drop out of the top 8.
- Tests cover the percentile math, ties and the blend order. The README schema and `types.ts` are updated.

## Answer

- `rank.percentiles()` computes rank/(n−1), with ties given the average rank. `rank_games` sorts on the **unrounded** blend, because the rounded values tie: 7 Wonders Duel and Twilight Struggle are both 99.7.
- `games.json` was re-ranked offline from the 2026-09-25 data (the inputs are unchanged, so no refetch was needed). The new top 4: Star Wars: Rebellion, War of the Ring, Twilight Struggle, 7 Wonders Duel. Patchwork moved from 2 to 14, Jaipur from 4 to 22, Hive from 5 to 55.
- The footer wording now mentions the Geek rating. The score filter step is 0.1, and the table shows 1 decimal.
- `python -m unittest discover scraper`: 27 tests OK. `npm test`: 19 OK.
