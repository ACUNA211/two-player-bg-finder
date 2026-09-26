import { useId, useMemo, useState } from "react";
import { GamesTable } from "./GamesTable";
import {
  applyFilters,
  emptyFilters,
  RANGE_FIELDS,
  TAG_FIELDS,
  TYPES,
  VOTE_FLOOR,
  type Filters,
  type Range,
  type RangeKey,
  type TagKey,
} from "./filters";
import type { Game } from "./types";

// Ranges shown in the always-visible bar; the rest (and Votes at 2 max) live in the panel.
const BAR_RANGES: RangeKey[] = ["weight", "playtime"];
const MAX_OPTIONS = 50;

export function GamesBrowser({ games }: { games: Game[] }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const filtered = useMemo(() => applyFilters(games, filters), [games, filters]);

  const tagOptions = useMemo(() => {
    const out = {} as Record<TagKey, string[]>;
    for (const { key } of TAG_FIELDS) out[key] = [...new Set(games.flatMap((g) => g[key]))].sort((a, b) => a.localeCompare(b));
    return out;
  }, [games]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const setRange = (key: RangeKey, r: Range) => setFilters((f) => ({ ...f, ranges: { ...f.ranges, [key]: r } }));
  const setTag = (key: TagKey, values: string[]) => setFilters((f) => ({ ...f, tags: { ...f.tags, [key]: values } }));
  const votes = filters.ranges.votes2 ?? {};

  return (
    <>
      <div className="filter-bar">
        <label className="field">
          <span>Name</span>
          <input type="search" value={filters.name} onChange={(e) => update({ name: e.target.value })} placeholder="Search…" />
        </label>
        <fieldset className="types">
          <legend>Type</legend>
          {TYPES.map((t) => (
            <label key={t} className="chip">
              <input
                type="checkbox"
                checked={filters.types.includes(t)}
                onChange={(e) => update({ types: e.target.checked ? [...filters.types, t] : filters.types.filter((x) => x !== t) })}
              />
              {t}
            </label>
          ))}
        </fieldset>
        {BAR_RANGES.map((key) => (
          <RangeInput key={key} field={key} value={filters.ranges[key]} onChange={(r) => setRange(key, r)} />
        ))}
        <label className="field">
          <span>Min votes</span>
          <input
            type="number"
            min={VOTE_FLOOR}
            value={votes.min ?? ""}
            onChange={(e) => setRange("votes2", { ...votes, min: toNum(e.target.value) })}
            onBlur={() => setRange("votes2", { ...votes, min: Math.max(VOTE_FLOOR, votes.min ?? VOTE_FLOOR) })}
          />
        </label>
        <button type="button" aria-expanded={panelOpen} aria-controls="filter-panel" onClick={() => setPanelOpen((o) => !o)}>
          Filters
        </button>
        <button type="button" onClick={() => setFilters(emptyFilters())}>
          Clear all
        </button>
      </div>
      <p className="count">{filtered.length.toLocaleString()} games</p>

      <aside id="filter-panel" className="filter-panel" hidden={!panelOpen} aria-label="More filters">
        <div className="panel-head">
          <h2>Filters</h2>
          <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters">
            ×
          </button>
        </div>
        <label className="chip">
          <input type="checkbox" checked={filters.twoOnly} onChange={(e) => update({ twoOnly: e.target.checked })} />
          2-player only
        </label>
        {RANGE_FIELDS.filter((r) => !BAR_RANGES.includes(r.key) && r.key !== "votes2").map((r) => (
          <RangeInput key={r.key} field={r.key} value={filters.ranges[r.key]} onChange={(v) => setRange(r.key, v)} />
        ))}
        <label className="field">
          <span>Max votes</span>
          <input type="number" min={VOTE_FLOOR} value={votes.max ?? ""} onChange={(e) => setRange("votes2", { ...votes, max: toNum(e.target.value) })} />
        </label>
        {TAG_FIELDS.map(({ key, label }) => (
          <MultiSelect key={key} label={label} options={tagOptions[key]} value={filters.tags[key] ?? []} onChange={(v) => setTag(key, v)} />
        ))}
      </aside>

      <GamesTable games={filtered} />
    </>
  );
}

const toNum = (s: string) => (s === "" || Number.isNaN(Number(s)) ? undefined : Number(s));

function RangeInput({ field, value = {}, onChange }: { field: RangeKey; value?: Range; onChange: (r: Range) => void }) {
  const { label, step } = RANGE_FIELDS.find((r) => r.key === field)!;
  return (
    <fieldset className="range">
      <legend>{label}</legend>
      <input type="number" step={step} aria-label={`${label} min`} placeholder="min" value={value.min ?? ""} onChange={(e) => onChange({ ...value, min: toNum(e.target.value) })} />
      <span aria-hidden>–</span>
      <input type="number" step={step} aria-label={`${label} max`} placeholder="max" value={value.max ?? ""} onChange={(e) => onChange({ ...value, max: toNum(e.target.value) })} />
    </fieldset>
  );
}

function MultiSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [query, setQuery] = useState("");
  const listId = useId();
  const q = query.trim().toLowerCase();
  const matches = q ? options.filter((o) => !value.includes(o) && o.toLowerCase().includes(q)).slice(0, MAX_OPTIONS) : [];

  return (
    <div className="multi">
      <label className="field">
        <span>{label}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-controls={listId} />
      </label>
      {value.length > 0 && (
        <ul className="selected">
          {value.map((v) => (
            <li key={v}>
              <button type="button" className="chip" aria-label={`Remove ${label} ${v}`} onClick={() => onChange(value.filter((x) => x !== v))}>
                {v} ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {matches.length > 0 && (
        <ul id={listId} className="options" aria-label={`${label} options`}>
          {matches.map((o) => (
            <li key={o}>
              <button
                type="button"
                onClick={() => {
                  onChange([...value, o]);
                  setQuery("");
                }}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
