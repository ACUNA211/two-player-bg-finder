# Web: ranked table

Type: task
Status: ready-for-agent
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
