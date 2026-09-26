# Web: filters

Type: task
Status: resolved
Blocked by: 03

## What

All of the filters in the spec's Filters section.

## Acceptance

- The always-visible bar holds name search, Type, weight, playtime and minimum votes. Everything else is in a side panel opened by a "Filters" button.
- A min/max range filter on every numeric field listed in the spec.
- Minimum votes defaults to 15 and can't go below it.
- Type matches **any** selected value. Category, Mechanic, Designer, Publisher, Artist and Family match **all** selected values, using searchable multi-selects.
- A "2-player only" toggle, and a "Clear all" button.
- Filters apply before pagination, and filtering resets to page 1.
- # never changes when filtering.

## Answer

- `web/src/filters.ts`: the `Filters` state, `emptyFilters()` and a pure `applyFilters(games, filters)`. `GamesBrowser.tsx` holds the filter state and the controls, and passes the filtered list to `GamesTable`. The table sorts and paginates that list, so filters apply before pagination.
- Bar: name, Type chips, weight and playtime ranges, Min votes, "Filters" and "Clear all". Panel (a right-hand drawer): 2-player only, the other ranges, Max votes, and searchable multi-selects for the six tag fields (showing up to 50 matches).
- Ranges are inclusive. Playtime and players match when the game's whole min–max span fits inside the filter range, so players max 2 has the same effect as 2-player only. A null value fails any bound set on that field.
- Min votes: `applyFilters` never goes below 15, and the input resets to 15 on blur.
- Page reset: TanStack v9's auto-reset didn't fire when `data` changed, so `GamesTable` calls `firstPage()` in an effect keyed on `games`.
- Tests: `npm test` runs 18 (10 new). `npm run build` is clean. Node isn't on the shell PATH, so use `C:\Program Files\nodejs\npm.cmd`.
