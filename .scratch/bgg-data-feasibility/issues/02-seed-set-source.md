# Where to get the Seed set of ranked game IDs

Type: research
Labels: wayfinder:research
Status: resolved

## Question

How can we get an ordered list of BGG game IDs by overall rank (top several thousand) without scraping HTML pages?

Candidates to check: BGG's official ranks data dump (CSV), any API endpoint, and well-maintained community datasets. For each: does it need login or a token, how fresh is it, what fields does it carry (rank, id, name, year, and ideally min/max players), and do its licence or terms allow our use?

## Answer

The best available source is BGG's own `bg_ranks` data dump (https://boardgamegeek.com/data_dumps/bg_ranks) — a CSV/ZIP with id, name, yearpublished, rank, bayesaverage, average, usersrated (no min/max players, so `/thing` lookups are still needed per game). The catch: the download page requires a logged-in BGG session (confirmed live — it's a client-rendered SPA that returns "You don't have access to this page" unauthenticated), so it can't be fetched by a plain unattended GET; a weekly scraper needs either a maintained login session, a human to refresh the file periodically, or a community-dataset fallback. Separately, and more urgently: BGG's XML API2 now requires a registered-application Bearer token for all requests as of 27 Oct 2025 (confirmed live via 401 responses today), which affects the whole scraping plan, not just this ticket. XML API2 has no bulk ranked-list endpoint (`/hot` is top-50 only). Community datasets (Kaggle, PrefLib, GitHub) exist but are all stale (newest found is ~Feb 2025) and unverified on licence — usable only as a bootstrap/fallback. BGG's own terms/policy pages could not be fetched directly (Cloudflare-blocked), so the "public non-commercial use" licence question is only medium-confidence from search snippets and needs manual human verification before launch.

Full findings: [research/seed-set-source.md](../research/seed-set-source.md)
