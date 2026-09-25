# Pull a real sample of BGG game data and measure throughput

Type: task
Labels: wayfinder:task
Status: resolved
Blocked by: 01, 02, 03

## Question

With a throwaway Python script, fetch `/thing?stats=1` data for a sample of Two-player eligible games spread across rank bands (e.g. ~50 each around ranks 1–500, 1000, 2000, 3000, 5000, 8000). Save the raw results as a sample file and record:

- per band: the distribution of Votes at 2, Best / Recommended / Not Recommended splits, and how many games clear a 30-vote floor
- whether weight, playtime, thumbnail and min/max players are present and sane
- measured throughput (games/minute under the rate limits), extrapolated to a full scrape of 3,000, 5,000 and 8,000 games

## Answer

Ran 2026-09-25 with `scripts/sample_pull.py`. It sampled 60 random games from each band (ranks 1–500, then ±50 around 1000/2000/3000/5000/8000), 20 IDs per call, one call every 5 s. Raw XML and parsed `games.json` are in `data/sample/` (gitignored). Re-print the report with `python scripts/sample_pull.py --report`.

**Throughput:** 360 games in 88 s from 18 requests, all HTTP 200: no 202s, 429s or 5xx. Median latency 1.3 s, so the 5 s spacing is the bottleneck. That gives **~244 games/min**: 3,000 games ≈ 12 min, 5,000 ≈ 20 min, 8,000 ≈ 33 min. All three are well under the 2 h bar.

**Two-player eligible:** 314 of 360. Most of the rest are solo-only games.

**Votes at 2 per band** (eligible games only; Best/Rec/NotRec are per-game medians of share):

| Band | n | min | p25 | median | p75 | max | ≥30 votes | Best % | Rec % | NotRec % |
|---|---|---|---|---|---|---|---|---|---|---|
| 1–500 | 57 | 60 | 160 | 248 | 422 | 2043 | 57 (100%) | 24 | 56 | 8 |
| ~1000 | 52 | 15 | 62 | 78 | 98 | 359 | 50 (96%) | 30 | 47 | 7 |
| ~2000 | 50 | 8 | 26 | 37 | 51 | 171 | 32 (64%) | 32 | 43 | 9 |
| ~3000 | 55 | 3 | 15 | 22 | 33 | 65 | 19 (35%) | 30 | 48 | 9 |
| ~5000 | 48 | 2 | 8 | 11 | 16 | 38 | 1 (2%) | 32 | 39 | 6 |
| ~8000 | 52 | 0 | 5 | 6 | 9 | 99 | 1 (2%) | 43 | 33 | 0 |

A 30-vote floor holds until about rank 2,000. Past about rank 3,000 almost nothing clears it, so a Seed set bigger than ~3–4k adds scrape time but few ranked games (input for #05 and #06). At ranks 5000+, the shares come from very few votes and are noisy.

**Field sanity (all 360):** min/max players, playtime (min ≤ max), weight (1–5) and thumbnail URL are present and sane in every game. The one outlier is a playtime > 600 min for a deluxe wargame at #7962, which is real rather than an error. 11 games have no 2-player poll votes. 10 of them are solo-only, and 1 is 2p-only with an empty poll (#7998).
