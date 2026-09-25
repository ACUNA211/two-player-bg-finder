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

**Two-player score**:
The number a game is ranked by. It is derived from the Player-count poll at 2 and scores Best as 1, Recommended as 0.75 and Not Recommended as −1, divided by the Votes at 2. A Wilson lower bound (95%) then lowers the score of games with few votes. The score runs from −1 to 1, and a game that is poor at 2 can score below 0.
_Avoid_: rating, BGG rating (that is a different BGG number)

**Vote floor**:
The minimum Votes at 2 a game needs before it is ranked: 15.

**Two-player eligible**:
A game whose publisher-stated player range includes 2. Only these games are listed.

**Seed set**:
The list of games whose data is collected ahead of time: the top 5,000 by BGG rank in the latest ranks dump. It is rebuilt each week, so a game that falls below rank 5,000 drops off.

## Relationships

- A game appears in the list only if it is **Two-player eligible** and meets the **Vote floor**.
- The list is sorted by **Two-player score**.
- The **Seed set** bounds which games can appear at all.

## Flagged ambiguities

- "Best at 2" was first used to mean Best votes only; resolved: ranking uses the **Two-player score**, which also takes Recommended votes into account. **Best-at-2 %** remains a displayed figure.
