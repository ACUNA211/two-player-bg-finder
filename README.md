# Two-Player Board Game Finder

A free, non-commercial website to help people who play board games as a pair find games that are best at two players.

> **Status: in development.** The site isn't live yet. We're currently checking whether the data it needs can be collected (see `.scratch/bgg-data-feasibility/map.md`).

## What it will do

- List ranked board games that officially support 2 players.
- Sort them by how the [BoardGameGeek](https://boardgamegeek.com) community rates them at two players, using BGG's suggested-player-count poll (the share of voters rating a game "Best" or "Recommended" at 2).
- Show each game's name, thumbnail, weight (complexity), playing time and poll results, each linking back to the game's BoardGameGeek page.

No accounts, no ads, no paid features.

## How the data works

Game data comes from the [BoardGameGeek XML API2](https://boardgamegeek.com/wiki/page/BGG_XML_API2). A background script refreshes it on a schedule (about weekly) and caches the results. The website is served from that cache, so visiting the site never sends requests to BGG.

## Data source and attribution

All game data, poll results and images are from [BoardGameGeek](https://boardgamegeek.com) and belong to BoardGameGeek and its users. This project isn't affiliated with or endorsed by BoardGameGeek.
