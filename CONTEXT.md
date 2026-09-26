# Two-Player Board Game Finder

A site that helps people who play board games as a pair find games that are best at two players, ranked by BoardGameGeek community votes.

## Language

**Player-count poll**:
BGG's per-game community poll in which each voter rates every player count as Best, Recommended, or Not Recommended.
_Avoid_: suggested players, numplayers poll

**Votes at 2**:
The total number of Best + Recommended + Not Recommended votes cast for the 2-player count in a game's Player-count poll.

**Best-at-2 %**:
The share of Votes at 2 that are Best.

**Poll score**:
The Player-count poll at 2 as one number. It counts Best as 1, Recommended as 0.75 and Not Recommended as −1, then divides by the Votes at 2. A Wilson lower bound (95%) then lowers the score of games with few votes. It runs from −1 to 1. It is not shown. It feeds the Two-player score and breaks ties.

**Geek rating**:
BGG's Bayesian average rating, taken from the ranks dump. It pulls games with few ratings toward the middle.
_Avoid_: BGG average (that is the raw, unadjusted mean)

**Two-player score**:
The number a game is ranked by: `100 × (0.5 × percentile of Poll score + 0.5 × percentile of Geek rating)`. Both percentiles are taken over all listed games. It runs from 0 to 100 with 1 decimal. Filtering never changes a game's score.
_Avoid_: rating, BGG rating (that is a different BGG number)

**2p-only game**:
A game whose publisher-stated maximum is 2 players.

**Must play**:
A filter on player counts other than 2. A game passes only if its player range includes **every** checked count. With nothing checked, nothing is filtered.

**Vote floor**:
The minimum Votes at 2 a game needs before it is ranked: 15.

**Two-player eligible**:
A game whose publisher-stated player range includes 2. Only these games are listed.

**Seed set**:
The list of games whose data is collected ahead of time: the top 5,000 by BGG rank in the latest ranks dump. It is rebuilt each week, so a game that falls below rank 5,000 drops off.

## Relationships

- A game appears in the list only if it is **Two-player eligible** and meets the **Vote floor**.
- The list is sorted by **Two-player score**, then **Poll score**, then **Votes at 2**.
- The **Seed set** bounds which games can appear at all.

## Flagged ambiguities

- "Best at 2" was first used to mean Best votes only; resolved: ranking uses the **Two-player score**, which also takes Recommended votes into account. **Best-at-2 %** remains a displayed figure.
- The **Two-player score** was first just the Poll score, which put 2p-only games on top (a 2p-only game is rarely voted Not Recommended at 2). Resolved: it now blends in the **Geek rating**.
