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
import { useEffect } from "react";
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

function playtime(g: Game) {
  const { minplaytime: lo, maxplaytime: hi } = g;
  if (lo == null && hi == null) return "–";
  if (lo == null || hi == null || lo === hi) return `${lo ?? hi} min`;
  return `${lo}–${hi} min`;
}

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
  col.accessor("votes2", { header: "Votes at 2", ...numeric }),
  col.accessor("best_pct", { header: "Best %", ...numeric, cell: (c) => fixed(1)(c.getValue()) }),
  col.accessor("rec_pct", { header: "Rec %", ...numeric, cell: (c) => fixed(1)(c.getValue()) }),
  col.accessor("notrec_pct", { header: "Not-rec %", ...numeric, cell: (c) => fixed(1)(c.getValue()) }),
  col.accessor((g) => num(g.weight), { id: "weight", header: "Weight", ...numeric, cell: (c) => fixed(2)(c.getValue()) }),
  col.accessor((g) => num(g.maxplaytime ?? g.minplaytime), {
    id: "playtime",
    header: "Playtime",
    ...numeric,
    cell: ({ row }) => playtime(row.original),
  }),
  col.accessor("bgg_rank", { header: "BGG rank", ...numeric, sortDescFirst: false }),
  col.accessor("bgg_rating", { header: "BGG rating", ...numeric, cell: (c) => fixed(3)(c.getValue()) }),
  col.accessor("score", { header: "Two-player score", ...numeric, cell: (c) => fixed(3)(c.getValue()) }),
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
