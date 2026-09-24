# BGG XML API2 access rules, terms and limits

Type: research
Labels: wayfinder:research
Status: resolved

## Question

What does it currently take to use the BGG XML API2 for a public, non-commercial site, and what are its operational limits?

- Is registration or an application/API token required? What's the process and turnaround?
- What do BGG's terms of use say about using API data on a public site (attribution, logo, caching, non-commercial conditions)?
- What are the rate limits? How many IDs can one `/thing?stats=1` request carry? How does the 202 "queued" response behave, and what backoff is recommended?
- Does `/thing?stats=1` return the Player-count poll (`suggested_numplayers`), weight (`averageweight`), playtime, thumbnail and min/max players?

## Answer

As of Sept 2026, BGG now **requires registration and a Bearer token** for the XML API/API2 (a change from the old open/keyless access), rolled out through 2025 and still tightening as of Nov 2025; no commercial-use license is needed as long as the site stays non-commercial, but a formal Terms-of-Use read (attribution/logo/caching specifics) could not be confirmed against BGG's own page — BGG's site returned Cloudflare bot-protection 403s to automated fetches during this research. Rate limit (~2 req/s) and max-IDs-per-`/thing`-batch (conflicting reports: 20 vs 250–500 vs ~1000) are not officially documented and should be tested empirically; the HTTP 202 "queued, retry same URL" behaviour is confirmed as expected. `/thing?stats=1` is confirmed (via secondary sources, not a direct primary fetch) to return the Player-count poll, `averageweight`, playtime fields, thumbnail, and min/maxplayers. Full findings, caveats, and sources: [research/bgg-api-access.md](../research/bgg-api-access.md).
