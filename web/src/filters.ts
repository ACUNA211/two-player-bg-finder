import type { Game } from "./types";

// The Vote floor: the scraper already drops games below it, and the UI can't go lower.
export const VOTE_FLOOR = 15;

export const TYPES = ["Strategy", "Family", "Thematic", "Wargames", "Abstract", "Party", "Customizable", "Children's"];

export const TAG_FIELDS = [
  { key: "categories", label: "Category" },
  { key: "mechanics", label: "Mechanic" },
  { key: "designers", label: "Designer" },
  { key: "publishers", label: "Publisher" },
  { key: "artists", label: "Artist" },
  { key: "families", label: "Family" },
] as const;
export type TagKey = (typeof TAG_FIELDS)[number]["key"];

// Each range reads a [low, high] span from the game. A game passes when its span
// sits inside the filter's [min, max]; a null side fails any bound set on it.
type Span = [number | null, number | null];
const point = (v: number | null): Span => [v, v];

export const RANGE_FIELDS = [
  { key: "year", label: "Year", step: 1, span: (g: Game) => point(g.year) },
  { key: "score", label: "Two-player score", step: 0.1, span: (g: Game) => point(g.score) },
  { key: "votes2", label: "Votes at 2", step: 1, span: (g: Game) => point(g.votes2) },
  { key: "best_pct", label: "Best %", step: 1, span: (g: Game) => point(g.best_pct) },
  { key: "rec_pct", label: "Rec %", step: 1, span: (g: Game) => point(g.rec_pct) },
  { key: "notrec_pct", label: "Not-rec %", step: 1, span: (g: Game) => point(g.notrec_pct) },
  { key: "weight", label: "Weight", step: 0.1, span: (g: Game) => point(g.weight) },
  {
    key: "playtime",
    label: "Playtime (min)",
    step: 5,
    span: (g: Game): Span => [g.minplaytime ?? g.maxplaytime, g.maxplaytime ?? g.minplaytime],
  },
  { key: "bgg_rank", label: "BGG rank", step: 1, span: (g: Game) => point(g.bgg_rank) },
  { key: "bgg_rating", label: "BGG rating", step: 0.1, span: (g: Game) => point(g.bgg_rating) },
  { key: "minage", label: "Minimum age", step: 1, span: (g: Game) => point(g.minage) },
] as const;
export type RangeKey = (typeof RANGE_FIELDS)[number]["key"];

export type Range = { min?: number; max?: number };

// One-click spans for the ranges people reach for most.
export const PRESETS: Partial<Record<RangeKey, { label: string; range: Range }[]>> = {
  weight: [
    { label: "Light", range: { max: 2 } },
    { label: "Medium", range: { min: 2, max: 3 } },
    { label: "Heavy", range: { min: 3 } },
  ],
  playtime: [
    { label: "≤ 30 min", range: { max: 30 } },
    { label: "≤ 1 hr", range: { max: 60 } },
    { label: "≤ 2 hr", range: { max: 120 } },
    { label: "2 hr+", range: { min: 120 } },
  ],
};

// Must play: extra player counts a game has to support besides 2. "6+" means it plays 6
// (every listed game has min <= 2, so that's the same as max >= 6).
export const MUST_PLAY = [1, 3, 4, 5, 6];
export const mustPlayLabel = (n: number) => (n === 6 ? "6+" : `${n}`);
const plays = (g: Game, n: number) => g.minplayers <= n && n <= g.maxplayers;

// 2p-only games (max 2 players): show them all, only them, or hide them.
export type TwoOnly = "any" | "only" | "hide";

export type Filters = {
  name: string;
  types: string[];
  ranges: Partial<Record<RangeKey, Range>>;
  tags: Partial<Record<TagKey, string[]>>;
  mustPlay: number[];
  twoOnly: TwoOnly;
};

export const emptyFilters = (): Filters => ({ name: "", types: [], ranges: { votes2: { min: VOTE_FLOOR } }, tags: {}, mustPlay: [], twoOnly: "any" });

const isSet = (r?: Range) => r?.min !== undefined || r?.max !== undefined;

// How many filters differ from the defaults (the name search aside), for the Filters button.
export function activeCount(f: Filters): number {
  const { votes2, ...ranges } = f.ranges;
  return (
    (f.types.length ? 1 : 0) +
    (f.mustPlay.length ? 1 : 0) +
    (f.twoOnly !== "any" ? 1 : 0) +
    Object.values(ranges).filter(isSet).length +
    ((votes2?.min ?? VOTE_FLOOR) > VOTE_FLOOR || votes2?.max !== undefined ? 1 : 0) +
    Object.values(f.tags).filter((v) => v?.length).length
  );
}

function inRange([lo, hi]: Span, { min, max }: Range) {
  if (min !== undefined && (lo === null || lo < min)) return false;
  if (max !== undefined && (hi === null || hi > max)) return false;
  return true;
}

export function applyFilters(games: Game[], f: Filters): Game[] {
  const name = f.name.trim().toLowerCase();
  const votes = f.ranges.votes2 ?? {};
  const ranges = { ...f.ranges, votes2: { ...votes, min: Math.max(VOTE_FLOOR, votes.min ?? VOTE_FLOOR) } };
  const activeRanges = RANGE_FIELDS.filter((r) => ranges[r.key]);
  const activeTags = TAG_FIELDS.filter((t) => f.tags[t.key]?.length);

  return games.filter(
    (g) =>
      (!name || g.name.toLowerCase().includes(name)) &&
      (!f.types.length || f.types.some((t) => g.types.includes(t))) &&
      f.mustPlay.every((n) => plays(g, n)) &&
      (f.twoOnly === "any" || (f.twoOnly === "only") === g.maxplayers <= 2) &&
      activeRanges.every((r) => inRange(r.span(g), ranges[r.key]!)) &&
      activeTags.every((t) => f.tags[t.key]!.every((v) => g[t.key].includes(v))),
  );
}
