# Web: filter panel redesign

Type: task
Status: resolved
Blocked by: 10

## Acceptance

- Collapsible sections: **Players** (Must play and the 2p-only toggle), **Types & Mechanics** (nested, searchable dropdowns listing every value), and **Ranges** (the numeric filters).
- Types match **any** selected value. Mechanics match **all** selected values (current behavior).
- Cooperative is found through Mechanics ("Cooperative Game"). There is no dedicated chip.
- Consider presets for playtime and complexity.

## Answer

- The bar now holds only Name, **Filters (n)** and Clear all. The number counts filters that differ from the defaults (`activeCount` in `filters.ts`).
- The panel has collapsible `<details>` sections: **Players** (open by default), **Types & Mechanics**, **Ranges** (all numeric fields, with Votes at 2 min held at 15) and **More tags** (Category, Designer, Publisher, Artist and Family keep the search-to-add picker).
- Types and Mechanics are nested dropdowns. Each lists every value as a checkbox and has a search box. Types match any selected value, Mechanics match all. Cooperative is the "Cooperative Game" mechanic, with no separate chip.
- Presets (`PRESETS`): Weight Light ≤2 · Medium 2–3 · Heavy ≥3. Playtime ≤30 min · ≤1 hr · ≤2 hr · 2 hr+. Clicking a preset again clears it.
- Tests: 23 passing, and the build is clean.

## Comments

- Follow-up: the Types & Mechanics section now opens by default. At its top are chips for the most common values among the top 500 games by score. Types: Strategy, Family, Thematic, Wargames and Abstract. Mechanics: Cooperative Game, Hand Management, Variable Player Powers, Dice Rolling, Open Drafting and Set Collection; Solo was left out. The full lists are renamed **More types** and **More mechanics** and start closed. The panel header has a Clear all button.
