# Decide the Two-player score formula and Vote floor

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 04

## Question

Looking at the real sample, what formula should the Two-player score use to combine Best and Recommended votes at 2 (and Not Recommended votes, if they count), and what should the Vote floor be? Does the resulting ranking look right to the human on known games?

## Answer

Grilled 2026-09-25 on the 360-game sample (`data/sample/games.json`).

**Two-player score:**

1. Raw score `s = (Best + 0.75 × Recommended − Not Recommended) ÷ Votes at 2`, which runs from −1 to 1.
2. Map it to 0..1 with `p = (s + 1) / 2`, take the Wilson lower bound at 95% (z = 1.96) with n = Votes at 2, then map it back to −1..1 with `2 × bound − 1`.

- **Recommended at 0.75, not ½:** This favours games that are very good at 2, not just games made for 2. At ½, Spirit Island (1,449 / 579 / 15) ranked 24. At 0.75 it ranks 12, and with Not Recommended at −1 it ranks 8.
- **Not Recommended at −1:** Games that are poor at 2 sink harder. Because the scale is wider, Wilson also takes more off games with few votes (Kelp, 43 votes all Best, goes from 8 to 17).
- **Wilson:** A game with few votes can't reach the top by luck. With Wilson, Patchwork (654 votes) ranks above Kelp.
- A 2 / 1 / 0 point scale was considered. It gives the same order as 1 / ½ / 0, because the scale doesn't change the order.

**Vote floor:** 15 Votes at 2. Wilson already keeps games with few votes low, so the floor only removes games whose poll is too thin to show anything. In the sample, 212 of 314 eligible games clear it (160 at 30). Share of eligible games that clear 15, by band: 1–500 100%, ~1000 100%, ~2000 92%, ~3000 76%, ~5000 27%, ~8000 4% (input for #06).

**Low scores:** No game is removed because of its score. 39 of the 212 score below 0, and they show as negative.

**Ties:** The game with more Votes at 2 goes first.

**Check against known games:** Top of the sample: Patchwork, Android: Netrunner, Watergate, Summoner Wars, Combat Commander: Europe, Morels, Jambo, Spirit Island. Bottom: Lovecraft Letter, ito, Northern Pacific and other group games. The human accepted this order.
