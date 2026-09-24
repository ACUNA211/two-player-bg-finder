# How the weekly run gets the ranks dump

Type: grilling
Labels: wayfinder:grilling
Status: open
Blocked by: 03

## Question

The official `bg_ranks` dump (see "Where to get the Seed set of ranked game IDs") is only downloadable from a logged-in BGG session, so a plain unattended script can't fetch it. How should the Seed set be refreshed?

Options to weigh: the human downloads it manually on a slower cadence (ranks change slowly, and the weekly `/thing` refresh can still run on the last Seed set); an automated logged-in session (only if BGG's terms, read in "Set up BGG API access", allow it); or a fallback dataset. Does the chosen answer still satisfy bar item 3 (unattended weekly run), or does the verdict become "yes, but…"?
