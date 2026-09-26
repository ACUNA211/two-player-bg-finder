import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useEffect, useState, type ReactNode } from "react";
import type { Game } from "./types";

export const PAGE_SIZE = 100;

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { basic: sortFn_basic, text: sortFn_text },
});

const col = createColumnHelper<typeof features, Game>();

// Nulls become undefined so they sort last in either direction.
const num = (v: number | null) => v ?? undefined;
const fixed = (digits: number) => (v: number | undefined) => (v === undefined ? "–" : v.toFixed(digits));
const numeric = { sortFn: "basic", sortUndefined: "last", sortDescFirst: true } as const;

// A trigger that reveals a small popover on hover (mouse) or tap (touch/keyboard).
export function Info({ label, children, name }: { label: ReactNode; children: ReactNode; name?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`info${open ? " open" : ""}`}>
      <button type="button" aria-label={name} aria-expanded={open} onClick={() => setOpen(!open)} onBlur={() => setOpen(false)}>
        {label}
      </button>
      <span role="tooltip" className="info-pop">
        {children}
      </span>
    </span>
  );
}

function players({ minplayers: lo, maxplayers: hi }: Game) {
  const range = lo === hi ? `${hi}` : `${lo}–${hi}`;
  if (hi > 2) return range;
  return (
    <>
      {range} <span className="pill">2p only</span>
    </>
  );
}

const pct = (v: number) => `${v.toFixed(1)}%`;

function PollBar({ g }: { g: Game }) {
  const text = `Best ${pct(g.best_pct)} · Rec ${pct(g.rec_pct)} · Not rec ${pct(g.notrec_pct)}`;
  return (
    <Info
      name={`Poll at 2: ${text}`}
      label={
        <span className="poll-bar">
          <span className="best" style={{ width: `${g.best_pct}%` }} />
          <span className="rec" style={{ width: `${g.rec_pct}%` }} />
          <span className="notrec" style={{ width: `${g.notrec_pct}%` }} />
        </span>
      }
    >
      {text} ({g.votes2} votes)
    </Info>
  );
}

export const SCORE_HELP =
  "Average of two percentiles among all listed games: where the game's player-count poll at 2 ranks, and where its BGG Geek rating ranks. 100 = top of both.";

const columns = col.columns([
  col.accessor("pos", { header: "#", ...numeric, sortDescFirst: false }),
  col.display({
    id: "thumbnail",
    header: "",
    cell: ({ row }) =>
      row.original.thumbnail ? (
        <img src={row.original.thumbnail} alt="" loading="lazy" width={48} height={48} />
      ) : null,
  }),
  col.accessor("name", {
    header: "Name",
    sortFn: "text",
    cell: ({ row }) => (
      <a href={`https://boardgamegeek.com/boardgame/${row.original.id}`} target="_blank" rel="noreferrer">
        {row.original.name}
      </a>
    ),
  }),
  col.accessor((g) => num(g.year), { id: "year", header: "Year", ...numeric, cell: (c) => c.getValue() ?? "–" }),
  col.accessor("maxplayers", { id: "players", header: "Players", ...numeric, cell: ({ row }) => players(row.original) }),
  col.accessor("poll_score", { id: "poll", header: "Poll at 2", ...numeric, cell: ({ row }) => <PollBar g={row.original} /> }),
  col.accessor("bgg_rank", { header: "BGG rank", ...numeric, sortDescFirst: false }),
  col.accessor("bgg_rating", { header: "BGG rating", ...numeric, cell: (c) => fixed(3)(c.getValue()) }),
  col.accessor("score", {
    header: "Two-player score",
    ...numeric,
    cell: ({ row: { original: g } }) => (
      <Info label={fixed(1)(g.score)} name={`Two-player score ${fixed(1)(g.score)}: show breakdown`}>
        Poll at 2 beats {pct(g.poll_pct)} of games · Geek rating beats {pct(g.geek_pct)}
      </Info>
    ),
  }),
]);

// Columns kept on phone widths; the rest get the "wide" class and are hidden by CSS.
const PHONE_COLUMNS = new Set(["pos", "thumbnail", "name", "score"]);
const cls = (id: string) => `col-${id}${PHONE_COLUMNS.has(id) ? "" : " wide"}`;

export function GamesTable({ games }: { games: Game[] }) {
  const table = useTable({
    features,
    columns,
    data: games,
    initialState: {
      sorting: [{ id: "score", desc: true }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  // A new (filtered) games list always starts on page 1.
  useEffect(() => table.firstPage(), [games]);

  const { pageIndex } = table.state.pagination;
  const pageCount = table.getPageCount();

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cls(header.column.id)}
                      aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
                    >
                      {header.column.getCanSort() ? (
                        <button type="button" onClick={header.column.getToggleSortingHandler()}>
                          <table.FlexRender header={header} />
                          <span className="sort-mark">{sorted === "asc" ? " ▲" : sorted === "desc" ? " ▼" : ""}</span>
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                      {header.column.id === "score" && (
                        <Info label="ⓘ" name="How the Two-player score is calculated">
                          {SCORE_HELP}
                        </Info>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className={cls(cell.column.id)}>
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="pager" aria-label="Pagination">
        <button type="button" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
          «
        </button>
        <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          ‹ Prev
        </button>
        <span>
          Page {pageCount ? pageIndex + 1 : 0} of {pageCount}
        </span>
        <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next ›
        </button>
        <button type="button" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
          »
        </button>
      </nav>
    </>
  );
}
