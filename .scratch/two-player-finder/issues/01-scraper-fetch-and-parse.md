# Scraper: fetch and parse the Seed set

Type: task
Status: resolved
Blocked by: none

## What

Create `scraper/` in Python. Given a ranks dump CSV in `data/`, load the top 5,000 ranked games and fetch them from `/thing?stats=1`. Parse each game into a plain record.

## Acceptance

- Picks the newest `data/*.csv`. The dump's category-rank columns give each game its Type(s).
- Sends 20 IDs per call, spaced 5 s apart, with `Authorization: Bearer $BGG_TOKEN` read from the environment.
- Retries on 202, 429 and 5xx with backoff. After the retries are used up, it raises (it doesn't skip the batch).
- Each record holds the fields listed under "Per game, the JSON holds" in the spec, apart from the computed ones (score, #). That includes the raw Best / Rec / NotRec counts at 2.
- The XML parser has unit tests that run against a saved sample XML fixture, with no network. The existing sample parser is `.scratch/bgg-data-feasibility/scripts/sample_pull.py`.

## Answer

Done in `scraper/bgg.py` (stdlib only):
- `newest_dump(data_dir)` → newest `*.csv` by mtime.
- `load_seed_set(csv)` → top 5,000 ranked `{id: {bgg_rank, bgg_rating, types}}`. BGG rank and rating come from the dump.
- `fetch_batch(ids, token)` retries on 202, 429, 5xx and network errors (backoff 10→120 s, 6 retries), then raises `FetchError`. Other 4xx codes raise right away.
- `parse_things(xml)` → records with id, name, year, thumbnail, votes2, best2/rec2/notrec2, the three %, weight, min/max playtime, min/max players, minage and the six link lists.
- `fetch_seed_set(seed)` → 20 IDs per call, calls started 5 s apart, `BGG_TOKEN` read from the environment, records merged in rank order.

Tests: `python -m unittest discover scraper`. They use `scraper/fixtures/thing_sample.xml`, a trimmed copy of two items (Spirit Island and solo-only Black Sonata) and make no network calls.
