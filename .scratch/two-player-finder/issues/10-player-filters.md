# Web: player-count filters

Type: task
Status: resolved
Blocked by: 08

## Acceptance

- **Must play** checkboxes for 1, 3, 4, 5 and 6+. A game passes only if its range includes **every** checked count; 6+ means max ≥ 6. With none checked, nothing is filtered.
- The "2-player only" checkbox becomes a 3-way toggle: **2p-only games: Any · Only · Hide**. Only keeps max ≤ 2; Hide keeps max > 2.
- The old Players range filter is removed.

## Answer

- `filters.ts` adds `MUST_PLAY`, `mustPlay: number[]` (a game must play every checked count) and `twoOnly: "any" | "only" | "hide"`. The `players` range is removed. "6+" is the same as "plays 6", because every listed game has min ≤ 2.
- Both controls sit in the always-visible bar, for now. Issue 11 moves them into a Players section.
- Counts on real data: Must play 4 gives 3,149 games; 1 and 4 gives 1,273; 6+ gives 651. 451 games are 2p-only.
- Tests: 22 passing, and the build is clean.
