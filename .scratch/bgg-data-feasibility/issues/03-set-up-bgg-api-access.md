# Set up BGG API access

Type: task
Labels: wayfinder:task
Status: resolved
Blocked by: 01

## Question

Whatever access Research ticket "BGG XML API2 access rules, terms and limits" says is needed (account, app registration, token): get it in place and record where the credential lives (never the secret itself). If no registration is needed, resolve immediately with that fact. HITL if it requires the human's BGG account.

## Scope update (from "BGG XML API2 access rules, terms and limits")

Registration is required (app registration + Bearer token), so this is **HITL**. Checklist for the human:

1. Log into BGG and register an application at boardgamegeek.com/applications (describe it as a public, non-commercial two-player game finder). Record when it was submitted and when it was approved.
2. While logged in, read BGG's Terms of Use / XML API terms and note what they say about attribution, logo use, caching/storage duration, and public ranking sites. Automated research was blocked by Cloudflare, so this can't be done AFK.
3. Store the token outside the repo (e.g. an environment variable `BGG_TOKEN`) and record only *where* it lives.
4. Make one authenticated `/thing?id=<id>&stats=1` call to confirm the token works and the expected fields are present.
5. While logged in, download the `bg_ranks` CSV once from boardgamegeek.com/data_dumps/bg_ranks and save it under `.scratch/bgg-data-feasibility/data/` (it's needed by "Pull a real sample of BGG game data and measure throughput"). While reading the terms, check whether they say anything about automated or logged-in downloads of the dump.
6. Install Python 3 (not currently installed on this machine; `python` resolves to the Microsoft Store stub). "Pull a real sample of BGG game data and measure throughput" needs it.

## Progress

- **Step 1:** app registration submitted 2026-09-23; approved by 2026-09-24 (token worked that day).
- **Steps 3–4 (2026-09-24):** token stored as Windows user env var `BGG_TOKEN`. Test call `/thing?id=13&stats=1` → HTTP 200; name, min/max players, average rating and rank all present.
- **Step 5 (2026-09-25):** downloaded manually (logged in) → `data/boardgames_ranks.csv` (gitignored). 181,506 rows, 31,366 ranked (ranks 1–31366, no ranked expansions). Columns: `id,name,yearpublished,rank,bayesaverage,average,usersrated,is_expansion` + 8 category ranks. No min/max players, as expected.
- **Step 6:** Python 3.13 is now installed.
- **Step 2 — terms (human read them 2026-09-25; the summary below is an AI summary of BGG's pages):**
  - **Attribution:** name BGG as the source in every use. Public-facing pages must show the "Powered by BGG" logo, legible and linked to BGG. Text marked as from Wikipedia is CC BY-NC-SA.
  - **No modification** of API data (user submissions included). Our own computed scores (e.g. the Two-player score) count as our own analysis. BGG's ranks and ratings must be shown unaltered.
  - **No AI/LLM training** on the data.
  - **Load:** must not interfere with BGG's servers, and BGG monitors usage. Too-frequent requests get 500/503; ~5 s between requests seems enough. `/thing` takes at most **20 IDs per call**. The guide recommends server-side caching.
  - **Storage:** no retention period, size cap or refresh requirement. The license can be revoked at any time, and stored data then loses its basis.
  - **Public ranking site:** not addressed by name. The free license covers strictly non-commercial use (ads, paid features or affiliate links need a commercial license). BGG may deny or revoke apps that compete with its business, and a ranking site is a plausible risk. We can't re-serve the data as a service for other apps.
  - **Ranks dump:** counts as part of the XML API for licensing, so all the rules above apply. Automated download: with an approved app, send `Authorization: Bearer <token>` to `boardgamegeek.com` (no `www`). No stated download frequency (≤ daily seems reasonable, our judgment). BGG's guide contradicts itself on whether a logged-in download needs registration. Untested; follow up in #08.
