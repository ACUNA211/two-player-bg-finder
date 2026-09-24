# Seed set source research

Research date: 2026-09-23. Investigated primarily via direct HTTP requests (curl) against live
BGG endpoints, plus web search for forum/wiki content that BGG's Cloudflare bot-protection
blocked from direct automated fetch. Every claim below is either (a) something I observed
directly against a live BGG URL today, or (b) sourced to a specific URL found via search, with
confidence noted. Where I could not verify a claim against the primary page itself (because BGG's
Cloudflare challenge blocked automated access), this is flagged explicitly.

## Summary / Recommendation

The best available source is still **BGG's own `bg_ranks` data dump**
(https://boardgamegeek.com/data_dumps/bg_ranks) — a periodically-regenerated CSV/ZIP of every
ranked game with id, name, year, rank, and rating stats, described as "the preferred bulk ranking
source." **However it requires being logged in to a BGG account to obtain the actual download
link**, which is a real obstacle for a fully unattended weekly scraper (it needs either a stored
session cookie, some scripted login flow, or a human to periodically refresh a cookie/download the
file manually). It does **not** include min/max player counts, so per-game details (including
player count) still have to come from the XML API2 `/thing` endpoint per id.

The bigger, more urgent finding: **as of 27 October 2025, BGG's XML API2 now requires a
registered-application Bearer token for essentially all requests** — I confirmed this directly:
anonymous `GET` requests to `/xmlapi2/hot` and `/xmlapi2/thing` both returned `HTTP 401
Unauthorized. See https://boardgamegeek.com/using_the_xml_api` when tested live today
(2026-09-23). This is a materially different situation from the "XML API2 is open, no-key-needed"
assumption that most third-party docs/code (including older community write-ups) still describe.
Any implementation plan — for the ranks dump, the `/thing` calls, or anything else — must budget
for registering an application at https://boardgamegeek.com/applications and shipping an
Authorization: Bearer token, in addition to (separately) solving the ranks-dump login-wall problem.
XML API2 confirmed has **no bulk/paged ranked-list endpoint**; `/hot` only returns the top 50.
Community datasets (Kaggle, GitHub, PrefLib) are a viable fallback for the "top N by rank" seed
list itself, but licensing/freshness/authenticity vary a lot and none is verified as more current
or more authoritative than BGG's own dump — treat them as an offline snapshot / bootstrap, not a
system of record.

## Sources investigated

### 1. BGG official ranks data dump (`bg_ranks`)

- **What it is**: BGG's own periodically-generated CSV export of every ranked game (id, name,
  rank, etc.), served as a downloadable ZIP from an account-gated "Data Dumps" area.
- **URLs**: Listing/description page: https://boardgamegeek.com/wiki/page/Data_Dumps (referenced
  repeatedly in search results, e.g. via https://mixedconclusions.com/blog/boardgames_part_one/
  and the forum thread below). Download page:
  https://boardgamegeek.com/data_dumps/bg_ranks.
- **Direct test (primary, today)**: `curl -s -o /dev/null -w '%{http_code}'
  https://boardgamegeek.com/data_dumps/bg_ranks` returned **HTTP 200**, but the response body is
  just the empty Angular ("GeekApp") shell — the page is a client-rendered SPA. When rendered
  (via the WebFetch tool, which executes/interprets the page), the page's actual content is an
  access-denial message: **"You don't have access to this page."** This is consistent with
  community reports (below) that **you must be logged in to a BGG account to see the download
  link**. I could not determine from a primary source whether the underlying download link, once
  obtained while logged in, is itself a plain signed URL fetchable without cookies afterward (see
  Open Questions).
- **Login/token requirement**: Requires a logged-in BGG session (cookie-based); not solvable with
  just an XML-API application token. Per a search-engine summary of the community forum thread
  "CSV download of all games with their ranks"
  (https://boardgamegeek.com/thread/3175068/csv-download-of-all-games-with-their-ranks — could
  not fetch directly, blocked by Cloudflare, see caveat below): "You must be logged in to
  BoardGameGeek to download this file... uses signed (redirect) URLs for automation purposes."
  **Confidence: medium** — this is a paraphrase from a search snippet of the forum thread, not a
  page I could read directly, but it is consistent with the SPA access-denial behavior I observed
  directly.
- **Format**: ZIP containing a CSV, e.g. `boardgames_ranks_<date>.zip`. Per the same
  search-derived summary, columns are: `id, name, yearpublished, rank, bayesaverage, average,
  usersrated`. **No min/max player-count fields.** Confidence: medium (search-snippet sourced,
  not independently confirmed against the raw CSV since I can't download it without login).
- **Update cadence**: Described in search results (from the forum thread) as regenerated
  **daily**, with the daily update finishing "by midday (in the US)," timing depending on how
  long BGG's nightly stats/ranking recompute takes. Confidence: medium (same caveat).
- **Programmatic fetchability**: **Not fetchable by a plain unauthenticated GET.** The page
  itself returned 200 but is an empty SPA shell requiring a logged-in session to reveal/generate
  the actual file URL. A weekly unattended scraper would need to either (a) maintain a persisted
  BGG login session/cookie and refresh it periodically (fragile, and arguably against the spirit
  of "no HTML scraping"/"unattended"), or (b) have a human periodically download the dump
  manually and drop it somewhere the scraper can read it, or (c) fall back to a community mirror
  (see below).
- **Licence/terms**: Not found on a page I could load directly (the Data Dumps wiki page itself
  returned Cloudflare's "Just a moment..." challenge, HTTP 403, on every fetch attempt — see Open
  Questions). One search-result summary claimed "this data is considered part of their XML API"
  for licensing purposes, i.e. governed by the same XML API Terms of Use — **this is unverified
  against a primary source and should be treated as uncertain.**

### 2. BGG XML API2

- **What it is**: BGG's documented read API for individual games/collections/etc., over HTTP
  returning XML. Community-documented at https://boardgamegeek.com/wiki/page/BGG_XML_API2
  (page itself blocked by Cloudflare on direct fetch today).
- **Direct tests (primary, today, 2026-09-23)**:
  - `curl https://boardgamegeek.com/xmlapi2/hot?type=boardgame` → **HTTP 401**, body:
    `Unauthorized. See https://boardgamegeek.com/using_the_xml_api`
  - `curl https://boardgamegeek.com/xmlapi2/thing?id=13&stats=1` → **HTTP 401**, same body.
  - `curl https://boardgamegeek.com/using_the_xml_api` → **HTTP 403** (Cloudflare "Just a
    moment..." bot-challenge page), so I could not read BGG's own instructions directly.
- **Authentication now required (major finding)**: Per multiple forum thread titles/snippets
  surfaced by search — "Registration and Authorization coming to the XML API"
  (https://boardgamegeek.com/thread/3492262/registration-and-authorization-coming-to-the-xml-a),
  "Registration to use the XML API (and obtain soon-to-be-required Tokens) is now open"
  (https://boardgamegeek.com/thread/3525319/registration-to-use-the-xml-api-and-obtain-soon-to),
  "XML API registration required" (https://boardgamegeek.com/thread/3540336/xml-api-registration-required),
  and "Heads up.... BGG now requiring authorization tokens for XML API.... could cause problems"
  (https://boardgamegeek.com/thread/3600185/heads-up-bgg-now-requiring-authorization-tokens-fo)
  — BGG rolled out mandatory registration/authorization for the XML API through 2025, with
  enforcement going live **27 October 2025**. My own 401 tests today confirm enforcement is
  still active as of 2026-09-23. Registration/token issuance is at
  https://boardgamegeek.com/applications (page itself returned Cloudflare 403 on direct fetch, so
  I could not verify approval turnaround time, cost, or exact application requirements from the
  primary source — search summaries say registration exists for both commercial and
  non-commercial users and, per one summary, is not required only if "downloading your own
  collection while logged in"). **This directly affects the project's stated convention of an
  unattended, offline scraper against the XML API2 — it can no longer be literally anonymous;
  it needs a one-time (human) registration step to obtain a Bearer token, then unattended token
  use.**
- **No bulk ranked-list endpoint**: Confirmed via community docs summaries — the documented
  endpoints are `thing`, `family`, `search`, `collection`, `user`, `plays`, `guild`, `forum`,
  `thread`, `hot`, `geeklist` (per a search-engine synopsis of
  https://boardgamegeek.com/wiki/page/BGG_XML_API2). `/hot` only returns a top-50 "hot list," not
  several thousand ranked games. There is no documented paging-by-rank or bulk-rank endpoint in
  XML API2. This matches the ticket's working assumption. **Confidence: medium-high** (based on
  consistent community documentation across multiple sources, though I could not load BGG's own
  wiki page directly due to Cloudflare).
- **Rate limits**: One search-derived summary (from a third-party client library doc,
  https://pkg.go.dev/github.com/kkjdaniel/gogeek/v3, and forum thread
  https://boardgamegeek.com/thread/3604601/xmlapi-rating-limit-avoidance-recommendations-with)
  suggests ~2 requests/second is the commonly-followed rate limit for `/thing` etc. This is a
  third-party convention, not something I could confirm against BGG's own published rate-limit
  policy (blocked by Cloudflare). Treat as a practical default, not a verified contractual limit.

### 3. Community datasets

Kaggle's dataset pages are heavy client-rendered SPAs; WebFetch could not extract their license
badges or "last updated" metadata reliably (returned mostly empty/placeholder content in several
attempts). I could not independently verify licence text for any Kaggle dataset below — treat all
Kaggle entries as **unverified pending a manual visit** to confirm the license badge and update
date shown on the page itself.

- **threnjen/board-games-database-from-boardgamegeek**
  (https://www.kaggle.com/datasets/threnjen/board-games-database-from-boardgamegeek) — third-party
  (not BGG), described in search results as containing ~22k games, 411K users, 19M ratings. A
  Kaggle "metadata age" of **17 Jan 2022** turned up in a search snippet, suggesting this specific
  snapshot may be stale relative to Sept 2026 (unverified — Kaggle datasets are sometimes updated
  in place without the page title changing). License not confirmed.
- **mseinstein/bgg_top2000** (referenced via PrefLib mirror
  https://preflib.github.io/PrefLib-Jekyll/dataset/00041) — weekly Top-2000 rankings, **Oct 2018
  – Dec 2021** (per PrefLib's own dataset page, which I fetched directly: publication date listed
  as **25 Sept 2022**, described as "scraped popularity rankings"). This is clearly **stale** for
  a Sept-2026 "current rank" seed set — it stopped in Dec 2021. PrefLib itself is a legitimate
  academic dataset repository (https://preflib.github.io), and the page is directly loadable
  (unlike BGG's own pages), but the underlying BGG data is ~4-5 years old. Not suitable as a live
  seed source; the format demonstrates rank+id+name are commonly captured together in this kind of
  data, though PrefLib's own files are re-coded into election/vote formats (.soi/.soc), not a
  plain rank/id/name CSV.
- **bwandowando/boardgamegeek-board-games-reviews-jan-2025**
  (https://www.kaggle.com/datasets/bwandowando/boardgamegeek-board-games-reviews-jan-2025) — per
  search snippet, "162K BoardGames and 30M Reviews from BoardGameGeek.com as of Feb 2025."
  bwandowando is a known prolific Kaggle contributor who runs many regularly-refreshed
  scraped/API datasets; this looks like the freshest community dataset found (Feb 2025), but that
  is still ~19 months stale relative to Sept 2026, and license/fields/download mechanism were not
  verifiable via automated fetch.
- **jvanelteren/boardgamegeek-reviews** (https://www.kaggle.com/datasets/jvanelteren/boardgamegeek-reviews)
  — ~13M reviews / 290K users, third-party; a companion GitHub repo
  (https://github.com/jvanelteren/boardgamegeek) apparently documents the collection methodology
  (uses BGG's API), but given the API auth change above, any un-updated scraping code in these
  repos is likely to now fail with 401s until adapted.
- **leonardr/boardgamegeek-data-dump** (https://github.com/leonardr/boardgamegeek-data-dump) —
  fetched directly. Third-party scripts (not affiliated with BGG) that pull via "BoardGameGeek's
  API" and convert to JSON, historically run "annually in July." Repo appears dormant (2 commits,
  no recent activity visible), explicitly described by its own README as "hacky scripts" kept as
  a backup. Not a maintained, reliable data source for a production seed set.
- **PrefLib dataset 00041** (https://preflib.github.io/PrefLib-Jekyll/dataset/00041) — see above;
  directly fetched, is the one primary-ish page in this whole community-dataset category I could
  actually load without a bot-block, but its BGG data is stale (ends Dec 2021).

General note on community datasets: none of the ones found is "well maintained" in the sense of
being continuously updated through Sept 2026 **and** independently license-verified. They are
plausible as a one-time bootstrap/fallback or for offline testing, but shouldn't be treated as
an ongoing weekly source without someone manually confirming freshness and license on the actual
Kaggle page (which requires a logged-in-capable browser to inspect fully, similar constraint to
BGG itself).

## Licence/terms question

I could not load either https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use or
https://boardgamegeek.com/wiki/page/Data_Dumps directly — every attempt (via WebFetch, via `curl`
with multiple user agents, and via a Jina.ai reader proxy) was blocked by BGG's Cloudflare
bot-challenge (HTTP 403, "Just a moment..." interstitial requiring JS+cookies). This is itself a
notable finding for the project: **BGG's own documentation/policy pages are not reliably fetchable
by a plain unattended HTTP client**, separate from the account-login issue affecting the data dump
download itself. I also could not load the sibling terms pages on videogamegeek.com or
rpggeek.com (same Cloudflare protection network-wide).

What I could establish, via consistent search-engine-indexed summaries of that same wiki page
(not independently confirmed verbatim, so treat as **medium confidence, unverified against
primary text**):
- The XML API Terms of Use reportedly **prohibit commercial use** of the XML API / API2 without
  a separate commercial license from BGG (paraphrase surfacing repeatedly across several distinct
  search queries, sourced to https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use and
  https://boardgamegeek.com/wiki/page/BGG_XML_API_Commercial_Use).
- Access to the API is stated to be "pursuant to the Terms of Service generally applicable to all
  features of BGG" (i.e., the general BGG Terms of Service at boardgamegeek.com/terms apply on
  top of anything API-specific) — again a paraphrase, unverified verbatim.
- I found **no primary-source text confirming or denying** whether "non-commercial" in BGG's terms
  is compatible with a **public-facing** (vs. strictly personal/private) non-commercial website.
  This project is public, non-commercial, low-traffic — it plausibly falls within what BGG intends
  to permit (many public non-commercial fan sites/tools clearly exist using this data, e.g. the
  various GitHub/Kaggle projects found above), but I cannot cite BGG's own wording to confirm this
  reading, only that "non-commercial" use in general is described as permitted and "commercial"
  requires a separate license.
- Whether the **data dump specifically** (as opposed to the live API) is governed by the same XML
  API Terms of Use is **unverified** — one search-summary asserted this ("for licensing purposes,
  this data is considered part of their XML API"), but I could not confirm it against BGG's own
  page text.

**Recommendation given the uncertainty**: before shipping, someone with a logged-in BGG account
should manually open https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use and
https://boardgamegeek.com/wiki/page/Data_Dumps in a real browser and copy the exact terms text
(bot-blocking prevented automated verification here), specifically checking (a) whether "public"
non-commercial use is explicitly addressed, and (b) whether the terms mention the data dumps by
name or only the live API.

## Open questions / uncertainty

1. **Cannot independently verify BGG's own policy text.** Every BGG wiki/forum/terms page
   returned a Cloudflare bot-challenge (HTTP 403) to automated fetching (WebFetch, curl with
   multiple user-agents, and a third-party reader proxy all failed identically). All claims about
   exact wording of the Data Dumps page and the XML API Terms of Use are therefore sourced to
   search-engine snippets/summaries of those pages, not the primary text itself. This should be
   manually re-verified by a human with a browser before the project relies on any specific
   clause.
2. **Whether the `bg_ranks` download link, once obtained while logged in, can subsequently be
   fetched by a plain unattended HTTP client (e.g., a signed URL with a long-lived token) or
   whether it always requires an active BGG session cookie.** Search summaries mention "signed
   (redirect) URLs for automation purposes," which suggests it might be scriptable after an
   initial login, but I could not confirm this mechanism directly (would require an actual logged
   -in session to test).
3. **XML API2 application registration**: cost (search results say access is available to
   commercial and non-commercial developers, implying it's free, but this isn't confirmed from a
   primary page), approval turnaround time, and whether a token is tied to an IP/app or portable
   — none of this could be verified since https://boardgamegeek.com/applications and
   https://boardgamegeek.com/using_the_xml_api both returned Cloudflare 403s on direct fetch.
4. **Rate limits under the new token-based regime** — the ~2 req/sec figure is a third-party
   client-library convention found via search, not a confirmed BGG-published limit.
5. **Kaggle dataset licenses** — none were confirmed verbatim; Kaggle's dataset pages did not
   render usable content through the available fetch tooling (heavy client-side JS). A manual
   check of the license badge on each dataset's page is needed before using any of them.
6. **Whether the ranks CSV dump is genuinely regenerated daily** (vs. some other cadence) rests on
   a single paraphrased forum-thread summary
   (https://boardgamegeek.com/thread/3175068/csv-download-of-all-games-with-their-ranks), not a
   primary BGG statement I could read directly.
