// BGG terms: public pages show the "Powered by BGG" logo, legible and linked to BGG,
// and credit BGG as the data source. The logo file is BGG's official asset.
export function Footer({ dumpDate, scrapeDate }: { dumpDate: string; scrapeDate: string }) {
  return (
    <footer className="site-footer">
      <a href="https://boardgamegeek.com" target="_blank" rel="noreferrer" className="bgg-logo">
        <img src="/powered-by-bgg.png" alt="Powered by BGG" height={40} />
      </a>
      <p>
        Game data from <a href="https://boardgamegeek.com" target="_blank" rel="noreferrer">BoardGameGeek</a>. BGG rank
        and rating are shown unaltered; the Two-player score is our own analysis of BGG's player-count poll.
      </p>
      <p>
        Ranks as of {dumpDate}; poll data fetched {scrapeDate}.
      </p>
    </footer>
  );
}
