# How the weekly run gets the ranks dump

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Blocked by: 03

## Question

The official `bg_ranks` dump (see "Where to get the Seed set of ranked game IDs") is only downloadable from a logged-in BGG session, so a plain unattended script can't fetch it. How should the Seed set be refreshed?

Options to weigh: the human downloads it manually on a slower cadence (ranks change slowly, and the weekly `/thing` refresh can still run on the last Seed set); an automated logged-in session (only if BGG's terms, read in "Set up BGG API access", allow it); or a fallback dataset. Does the chosen answer still satisfy bar item 3 (unattended weekly run), or does the verdict become "yes, but…"?

## Answer

- **Token test (2026-09-25):** GET `https://boardgamegeek.com/data_dumps/bg_ranks` with `Authorization: Bearer <BGG_TOKEN>` → HTTP 200 but "Error: You don't have access to this page". The token alone doesn't unlock the dump.
- **Refresh:** human downloads `bg_ranks` manually, weekly. The weekly `/thing` run uses the newest dump available, falling back to the last one (per #06).
- **Follow-up (human, later):** ask BGG why the approved app's Bearer token is refused on the dump page.
- **Staleness:** if the dump is >30 days old, log a warning and email the owner (once per run); the same email also fires on run failure. Email mechanism is a build decision.
- **Bar item 3 verdict:** "yes, but…": the scrape runs unattended weekly, but the Seed set needs a manual dump refresh. Skipped weeks go stale without breaking anything.
