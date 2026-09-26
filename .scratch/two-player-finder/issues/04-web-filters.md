# Web: filters

Type: task
Status: ready-for-agent
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
