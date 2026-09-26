# Deploy to Vercel

Type: task
Status: resolved
Blocked by: 03

## Checklist (human)

1. Log into Vercel (the Hobby plan) and import the GitHub repo `ACUNA211/two-player-bg-finder`.
2. Set Root Directory to `web/` and use the Vite framework preset.
3. Set the project name so the URL is `boardgamesfortwo.vercel.app`. If that name is taken, record the URL you got.
4. Confirm that a push to `main` triggers a redeploy.

## Comments

**Agent (2026-09-25):** Live at https://boardgamesfortwo.vercel.app/ (the URL we wanted). The page and `games.json` both return 200, and `games.json` is the same size as the local copy. The live bundle includes the footer from the latest commit, `52924fc`, which suggests the push to `main` triggered a redeploy. Not confirmed in the Vercel dashboard.
