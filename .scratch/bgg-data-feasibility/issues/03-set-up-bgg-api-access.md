# Set up BGG API access

Type: task
Labels: wayfinder:task
Status: open
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
