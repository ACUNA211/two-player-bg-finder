# Web: ranked table

Type: task
Status: resolved
Blocked by: 02

## What

Scaffold `web/` with Vite, React, TypeScript and TanStack Table. Render `games.json` as the ranked table described in the spec.

## Acceptance

- Columns in the spec's order, ending with the Two-player score. The name links to the BGG page. Thumbnails are hotlinked from BGG with `loading="lazy"`.
- The default sort is by score, highest first. Clicking any header toggles sorting by that column.
- 100 rows per page, with pagination controls.
- # is the overall position from the JSON and is never renumbered.
- On phone widths, only #, thumbnail, name and score are shown.
- Title "Board Games for Two".
- Works with a small checked-in fixture JSON until real data exists.

## Answer

- `web/`: Vite 8, React 19, TypeScript, TanStack Table **v9** (`useTable` + `tableFeatures`, not the v8 API). `src/GamesTable.tsx` holds the columns, sorting and pagination. `src/types.ts` mirrors the schema in `scraper/README.md`.
- Default sort is score, highest first. Numeric headers sort descending on the first click (# and BGG rank sort ascending first), and nulls always sort last. The thumbnail header is blank and can't be sorted.
- Phones (≤640px): non-phone columns get the `wide` class, which CSS hides.
- Fixture: `web/public/games.json` has the 207 listed games from the feasibility sample. The first real refresh (issue 07) overwrites it.
- Tests: `cd web && npm test` (8 Vitest tests: column order, default sort, 100 per page, paging, # never renumbered, header toggle, BGG link, lazy thumbnail, null order, phone columns). `npm run build` is clean.
