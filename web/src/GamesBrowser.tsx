import { useId, useMemo, useState } from "react";
import { GamesTable } from "./GamesTable";
import {
  activeCount,
  applyFilters,
  emptyFilters,
  MUST_PLAY,
  mustPlayLabel,
  PRESETS,
  RANGE_FIELDS,
  TAG_FIELDS,
  TYPES,
  VOTE_FLOOR,
  type Filters,
  type Range,
  type RangeKey,
  type TagKey,
  type TwoOnly,
} from "./filters";
import type { Game } from "./types";

// Mechanics get their own dropdown next to Types; the other tag fields sit under "More tags".
const MORE_TAGS = TAG_FIELDS.filter((t) => t.key !== "mechanics");
const MAX_OPTIONS = 50;
const TWO_ONLY: [TwoOnly, string][] = [["any", "Any"], ["only", "Only"], ["hide", "Hide"]];

export function GamesBrowser({ games }: { games: Game[] }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [panelOpen, setPanelOpen] = useState(false);
  const filtered = useMemo(() => applyFilters(games, filters), [games, filters]);
  const active = activeCount(filters);

  const tagOptions = useMemo(() => {
    const out = {} as Record<TagKey, string[]>;
    for (const { key } of TAG_FIELDS) out[key] = [...new Set(games.flatMap((g) => g[key]))].sort((a, b) => a.localeCompare(b));
    return out;
  }, [games]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const setRange = (key: RangeKey, r: Range) => setFilters((f) => ({ ...f, ranges: { ...f.ranges, [key]: r } }));
  const setTag = (key: TagKey, values: string[]) => setFilters((f) => ({ ...f, tags: { ...f.tags, [key]: values } }));

  return (
    <>
      <div className="filter-bar">
        <label className="field">
          <span>Name</span>
          <input type="search" value={filters.name} onChange={(e) => update({ name: e.target.value })} placeholder="Search…" />
        </label>
        <button type="button" aria-expanded={panelOpen} aria-controls="filter-panel" onClick={() => setPanelOpen((o) => !o)}>
          Filters{active > 0 && ` (${active})`}
        </button>
        <button type="button" onClick={() => setFilters(emptyFilters())}>
          Clear all
        </button>
      </div>
      <p className="count">{filtered.length.toLocaleString()} games</p>

      <aside id="filter-panel" className="filter-panel" hidden={!panelOpen} aria-label="Filters">
        <div className="panel-head">
          <h2>Filters</h2>
          <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters">
            ×
          </button>
        </div>

        <details className="section" open>
          <summary>Players</summary>
          <fieldset className="types">
            <legend>Must play</legend>
            {MUST_PLAY.map((n) => (
              <label key={n} className="chip">
                <input
                  type="checkbox"
                  checked={filters.mustPlay.includes(n)}
                  onChange={(e) => update({ mustPlay: e.target.checked ? [...filters.mustPlay, n] : filters.mustPlay.filter((x) => x !== n) })}
                />
                {mustPlayLabel(n)}
              </label>
            ))}
          </fieldset>
          <fieldset className="types">
            <legend>2p-only games</legend>
            {TWO_ONLY.map(([value, label]) => (
              <label key={value} className="chip">
                <input type="radio" name="two-only" checked={filters.twoOnly === value} onChange={() => update({ twoOnly: value })} />
                {label}
              </label>
            ))}
          </fieldset>
        </details>

        <details className="section">
          <summary>Types &amp; Mechanics</summary>
          <CheckList label="Types" hint="matches any" options={TYPES} value={filters.types} onChange={(types) => update({ types })} />
          <CheckList
            label="Mechanics"
            hint="matches all"
            options={tagOptions.mechanics}
            value={filters.tags.mechanics ?? []}
            onChange={(v) => setTag("mechanics", v)}
          />
        </details>

        <details className="section">
          <summary>Ranges</summary>
          {RANGE_FIELDS.map((r) => (
            <RangeInput
              key={r.key}
              field={r.key}
              value={filters.ranges[r.key]}
              floor={r.key === "votes2" ? VOTE_FLOOR : undefined}
              onChange={(v) => setRange(r.key, v)}
            />
          ))}
        </details>

        <details className="section">
          <summary>More tags</summary>
          {MORE_TAGS.map(({ key, label }) => (
            <MultiSelect key={key} label={label} options={tagOptions[key]} value={filters.tags[key] ?? []} onChange={(v) => setTag(key, v)} />
          ))}
        </details>
      </aside>

      <GamesTable games={filtered} />
    </>
  );
}

const toNum = (s: string) => (s === "" || Number.isNaN(Number(s)) ? undefined : Number(s));

// A floor, if given, is the lowest min allowed; the min snaps back up to it on blur.
function RangeInput({ field, value = {}, floor, onChange }: { field: RangeKey; value?: Range; floor?: number; onChange: (r: Range) => void }) {
  const { label, step } = RANGE_FIELDS.find((r) => r.key === field)!;
  const presets = PRESETS[field] ?? [];
  return (
    <fieldset className="range">
      <legend>{label}</legend>
      {presets.length > 0 && (
        <div className="presets">
          {presets.map((p) => {
            const on = value.min === p.range.min && value.max === p.range.max;
            return (
              <button key={p.label} type="button" className="chip" aria-pressed={on} onClick={() => onChange(on ? {} : p.range)}>
                {p.label}
              </button>
            );
          })}
        </div>
      )}
      <input
        type="number"
        step={step}
        min={floor}
        aria-label={`${label} min`}
        placeholder="min"
        value={value.min ?? ""}
        onChange={(e) => onChange({ ...value, min: toNum(e.target.value) })}
        onBlur={floor === undefined ? undefined : () => onChange({ ...value, min: Math.max(floor, value.min ?? floor) })}
      />
      <span aria-hidden>–</span>
      <input type="number" step={step} min={floor} aria-label={`${label} max`} placeholder="max" value={value.max ?? ""} onChange={(e) => onChange({ ...value, max: toNum(e.target.value) })} />
    </fieldset>
  );
}

// A dropdown listing every option as a checkbox, narrowed by a search box.
function CheckList({ label, hint, options, value, onChange }: { label: string; hint: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  return (
    <details className="dropdown">
      <summary>
        {label}
        {value.length > 0 && ` (${value.length})`} <small>{hint}</small>
      </summary>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-label={`Search ${label}`} />
      <ul className="checklist" aria-label={`${label} options`}>
        {shown.map((o) => (
          <li key={o}>
            <label>
              <input
                type="checkbox"
                checked={value.includes(o)}
                onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((x) => x !== o))}
              />
              {o}
            </label>
          </li>
        ))}
      </ul>
    </details>
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
