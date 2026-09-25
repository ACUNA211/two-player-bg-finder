# Decide the Seed set size

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 04, 05

## Question

Given the chosen Vote floor and the per-rank-band data, at what rank does it stop being worth collecting games? Does that size still fit the ~2-hour weekly scrape budget?

## Answer

Grilled 2026-09-25, using the #04 sample and the #05 Vote floor.

**Seed set size: N = 5,000.** The scrape takes about 20 min at 244 games/min, well under the ~2-hour bar. About 3,300 games are expected to be listed. Estimates by N: 3k ≈ 2,450 listed (12 min), 5k ≈ 3,300 (20 min), 8k ≈ 3,700 (33 min), all 31k ≈ 4,300 (~2.1 h). Going past 5k adds few games but more load on BGG (revocation risk) and noisier polls.

**The Seed set is rebuilt weekly:** each week it is the top 5,000 from that week's ranks dump. If no new dump can be had, the run uses the last one it has (see #08).

**Churn:** A game that falls below rank 5,000 drops off the list. This is accepted because only about 27% of eligible games near rank 5,000 clear the Vote floor.
