# Web: BGG attribution footer

Type: task
Status: resolved
Blocked by: 03

## Acceptance

- The "Powered by BGG" logo is legible and links to boardgamegeek.com. Use BGG's official logo asset. If an agent can't get it, flag it for the human.
- A text credit names BoardGameGeek as the data source, alongside the data date from `games.json`.
- No ads, no affiliate links, no tracking scripts.

## Comments

**Agent (2026-09-25):** The code is done. `web/src/Footer.tsx` shows the logo linked to boardgamegeek.com, a text credit naming BoardGameGeek, and the dump and scrape dates from `games.json`. It has a test, and `npm run build` is clean. The only scripts are the app's own, so there are no ads, affiliate links or trackers.

**Human step left:** the official "Powered by BGG" logo can't be fetched automatically, because BGG returns 403 to automated requests. Download it while logged into BGG and save it as `web/public/powered-by-bgg.png`. Until then, the link shows its alt text, "Powered by BGG". After saving it, check it's legible at 40px high, then set `Status: resolved`.

**Agent (2026-09-25):** Logo saved as `web/public/powered-by-bgg.png` (736×216, renamed from `powered_by_BGG.png`). It's legible at 40px high. I gave it a white backing so it stays readable in dark mode. The build is clean and all 19 tests pass.
