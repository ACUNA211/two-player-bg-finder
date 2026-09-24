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
The number a game is ranked by. It is derived from the Player-count poll at 2 and takes both Best and Recommended votes into account. Its exact formula is not yet decided.
_Avoid_: rating, BGG rating (that is a different BGG number)

**Vote floor**:
The minimum Votes at 2 a game needs before it is ranked. Tentatively 30.

**Two-player eligible**:
A game whose publisher-stated player range includes 2. Only these games are listed.

**Seed set**:
The fixed list of games (top N by BGG rank) whose data is collected ahead of time.

## Relationships

- A game appears in the list only if it is **Two-player eligible** and meets the **Vote floor**.
- The list is sorted by **Two-player score**.
- The **Seed set** bounds which games can appear at all.

## Flagged ambiguities

- "Best at 2" was first used to mean Best votes only; resolved: ranking uses the **Two-player score**, which also takes Recommended votes into account. **Best-at-2 %** remains a displayed figure.
