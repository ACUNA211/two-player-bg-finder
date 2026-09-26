// Mirrors the games.json schema in scraper/README.md.
export type GamesFile = {
  dump_date: string;
  scrape_date: string;
  games: Game[];
};

export type Game = {
  pos: number;
  score: number;
  id: number;
  name: string;
  year: number | null;
  thumbnail: string | null;
  votes2: number;
  best2: number;
  rec2: number;
  notrec2: number;
  best_pct: number;
  rec_pct: number;
  notrec_pct: number;
  weight: number | null;
  minplaytime: number | null;
  maxplaytime: number | null;
  minplayers: number;
  maxplayers: number;
  minage: number | null;
  bgg_rank: number;
  bgg_rating: number;
  types: string[];
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  artists: string[];
  families: string[];
};
