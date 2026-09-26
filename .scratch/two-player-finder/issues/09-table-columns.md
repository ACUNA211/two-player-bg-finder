# Web: table columns cleanup

Type: task
Status: resolved
Blocked by: 08

## Acceptance

- Remove Votes at 2, Best %, Rec %, Not-rec %, Weight and Playtime. Their filters stay.
- Add **Players**: `1–4`, or `2` with a "2p only" pill.
- Add **Poll at 2**: a stacked bar (Best, Rec, Not rec). The exact percentages show on hover or tap.
- **Two-player score** shows 0–100 with 1 decimal. The header ⓘ explains the formula. Hovering or tapping a cell shows that game's percentiles. It must work by tap on a phone.
- Column order: #, thumb, Name, Year, Players, Poll at 2, BGG rank, BGG rating, Two-player score.

## Answer

- `GamesTable.tsx` has a new `Info` component: a button that shows a popover on hover (via CSS) or tap (toggles `aria-expanded`), and closes on blur. It is used by the poll bar, the score cells and the score header ⓘ.
- Players sorts by max players. Poll at 2 sorts by `poll_score`.
- Bar colors are the tokens `--best`, `--rec` and `--notrec`, with dark-mode variants.
- Tests: 21 passing, and the build is clean. The layout has not been checked in a browser.
