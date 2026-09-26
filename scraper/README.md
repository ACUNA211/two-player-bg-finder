# scraper

Builds `web/public/games.json` from BGG. Python 3, stdlib only.

## Weekly refresh

1. While logged into BGG, download the `bg_ranks` CSV and save it in `data/` at the repo root (gitignored). If you keep the date in the filename (e.g. `boardgames_ranks_2026-09-24.csv`), it becomes the dump date. Otherwise the file's modified date is used.
2. `BGG_TOKEN=... python scraper/refresh.py` (about 21 min for 5,000 games).

The script aborts with a non-zero exit, leaving `games.json` untouched and committing nothing, when any batch still fails after retries or fewer than 2,500 games are listed. On success it commits `Data refresh <dump date>` and pushes.

Tests: `python -m unittest discover scraper`

## games.json schema

```ts
type GamesFile = {
  dump_date: string;    // YYYY-MM-DD, ranks dump the Seed set came from
  scrape_date: string;  // YYYY-MM-DD, day the BGG API was called
  games: Game[];        // sorted by pos
};

type Game = {
  pos: number;          // "#": overall position by score, 1 = best at two
  score: number;        // Two-player score, −1..1, 4 decimals
  id: number;           // BGG id → https://boardgamegeek.com/boardgame/<id>
  name: string;
  year: number | null;
  thumbnail: string | null;
  votes2: number;       // Votes at 2
  best2: number; rec2: number; notrec2: number;              // raw counts at 2
  best_pct: number; rec_pct: number; notrec_pct: number;     // % of votes2, 1 decimal
  weight: number | null;        // 1..5, null if unrated
  minplaytime: number | null; maxplaytime: number | null;   // minutes
  minplayers: number; maxplayers: number;
  minage: number | null;
  bgg_rank: number;     // from the ranks dump, unaltered
  bgg_rating: number;   // Bayes average from the ranks dump, unaltered
  types: string[];      // Strategy | Family | Thematic | Wargames | Abstract | Party | Customizable | Children's
  categories: string[]; mechanics: string[]; designers: string[];
  publishers: string[]; artists: string[]; families: string[];
};
```
