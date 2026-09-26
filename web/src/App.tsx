import { useEffect, useState } from "react";
import { Footer } from "./Footer";
import { GamesBrowser } from "./GamesBrowser";
import type { GamesFile } from "./types";

export function App() {
  const [data, setData] = useState<GamesFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/games.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData, (e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <h1>Board Games for Two</h1>
      {error ? <p>Could not load games: {error}</p> : data ? <GamesBrowser games={data.games} /> : <p>Loading…</p>}
      {data && <Footer dumpDate={data.dump_date} scrapeDate={data.scrape_date} />}
    </main>
  );
}
