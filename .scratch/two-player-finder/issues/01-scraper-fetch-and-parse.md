# Scraper: fetch and parse the Seed set

Type: task
Status: ready-for-agent
Blocked by: none

## What

Create `scraper/` in Python. Given a ranks dump CSV in `data/`, load the top 5,000 ranked games and fetch them from `/thing?stats=1`. Parse each game into a plain record.

## Acceptance

- Picks the newest `data/*.csv`. The dump's category-rank columns give each game its Type(s).
- Sends 20 IDs per call, spaced 5 s apart, with `Authorization: Bearer $BGG_TOKEN` read from the environment.
- Retries on 202, 429 and 5xx with backoff. After the retries are used up, it raises (it doesn't skip the batch).
- Each record holds the fields listed under "Per game, the JSON holds" in the spec, apart from the computed ones (score, #). That includes the raw Best / Rec / NotRec counts at 2.
- The XML parser has unit tests that run against a saved sample XML fixture, with no network. The existing sample parser is `.scratch/bgg-data-feasibility/scripts/sample_pull.py`.
