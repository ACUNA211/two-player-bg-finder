# Spec: Board Games for Two

Status: ready-for-agent

A public, non-commercial page that ranks board games by how good they are at two players, using BGG data. Feasibility and data decisions come from [../bgg-data-feasibility/map.md](../bgg-data-feasibility/map.md). Glossary terms (Player-count poll, Votes at 2, Two-player score, Vote floor, Two-player eligible, Seed set) are defined in `CONTEXT.md`.

## Architecture

- **Static site.** It has no server or database. A React app reads one JSON file.
- **Front-end:** Vite + React + TypeScript, with TanStack Table for sorting, filtering and pagination.
- **Hosting:** Vercel (Hobby plan, which is non-commercial). The site redeploys on every push to `main`. The URL is `boardgamesfortwo.vercel.app`, and a custom domain may come later.
- **Repo layout:** `scraper/` holds the Python code and `web/` holds the React app. The data file is `web/public/games.json`.

## Data refresh

The refresh is run manually each week:

1. The human downloads the `bg_ranks` CSV while logged into BGG and saves it in `data/`, which is gitignored and never committed.
2. The human runs `python scraper/refresh.py`. It:
   - picks the newest dump in `data/`
   - takes the top 5,000 ranked games (the Seed set)
   - calls `/thing?stats=1` with 20 IDs per call and 5 s between calls, authenticating with `Authorization: Bearer $BGG_TOKEN`. It retries on 202, 429 and 5xx.
   - keeps only Two-player eligible games with at least 15 Votes at 2 (the Vote floor)
   - computes the Two-player score for each game and assigns # positions
   - writes `web/public/games.json`, then runs `git commit` and `git push`
3. **Abort rule:** if any request still fails after retries, or fewer than 2,500 games are listed, the script exits non-zero. It writes nothing and pushes nothing, so the site keeps the last good data.

**Two-player score.** Let `s = (Best + 0.75·Rec − NotRec) / Votes at 2`. Compute the Wilson 95% lower bound on `p = (s+1)/2` with n = Votes at 2, then map it back with `2·bound − 1`. The result runs from −1 to 1, and negative scores are kept. Ties go to the game with more Votes at 2. Details are in feasibility issue 05.

**Per game, the JSON holds:**
- the BGG id, name, year and thumbnail URL
- Votes at 2, the Best / Rec / Not-rec counts and %, and the Two-player score
- the # position
- weight, min/max playtime, min/max players and minimum age
- BGG rank and BGG rating (Bayes average), unaltered
- Type (from the dump's category-rank columns)
- categories, mechanics, designers, publishers, artists and families

The file also carries the dump date and the scrape date.

## Page

- **Title:** "Board Games for Two".
- **Table:** 100 rows per page. The default sort is by Two-player score, highest first. Clicking any column header sorts by that column.
- **Columns, in order:**
  1. #
  2. Thumbnail (hotlinked from BGG's CDN)
  3. Name (links to the BGG game page)
  4. Year
  5. Votes at 2
  6. Best %
  7. Rec %
  8. Not-rec %
  9. Weight
  10. Playtime
  11. BGG rank
  12. BGG rating
  13. Two-player score
- **# is the overall position** by Two-player score. It stays the same when filters are applied, so it always means "Nth best at two".
- **Phones:** the table collapses to #, thumbnail, name and score.

## Filters

Filters are applied before pagination. The always-visible bar holds name search, Type, weight, playtime and minimum votes. Everything else is in a side panel that opens with a "Filters" button.

- **Name search:** substring match, case-insensitive.
- **A min/max range on every numeric column:**
  - year, Two-player score and Votes at 2
  - Best, Rec and Not-rec %
  - weight and playtime
  - BGG rank and BGG rating
  - player count and minimum age
- **Minimum votes:** defaults to 15. Users can raise it but not lower it.
- **Type:** multi-select, matching **any** selected type. The types are Strategy, Family, Thematic, Wargames, Abstract, Party, Customizable and Children's.
- **Category, Mechanic, Designer, Publisher, Artist and Family:** multi-select with search, matching **all** selected values.
- **2-player only:** a toggle that hides games whose player range goes beyond 2.
- **Clear all:** a button that resets every filter.

## Compliance (BGG terms)

- **Footer:** the "Powered by BGG" logo (legible, linked to BGG), a credit naming BGG as the data source, and the data date.
- **No changes to BGG data:** BGG's rank and rating are shown unaltered. The Two-player score is our own analysis.
- **No ads, no affiliate links, no paid features.** The data is not re-served as an API.
- **Accepted risk:** BGG may revoke the license. A takedown is acceptable, because this is an experiment.

## Out of scope (for now)

- Custom domain (`boardgamesattwo.com` looked unregistered on 2026-09-25).
- Unattended scheduling (GitHub Actions) and email alerts.
- Resumable scrape store (SQLite).
- Per-game detail pages, BGG username / owned-games filter.
- Asking BGG about Bearer-token access to the ranks dump.
