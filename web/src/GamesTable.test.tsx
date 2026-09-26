import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { GamesTable, PAGE_SIZE } from "./GamesTable";
import type { Game } from "./types";

afterEach(cleanup);

function game(pos: number, over: Partial<Game> = {}): Game {
  return {
    pos, score: 100 - pos / 10, poll_score: 0.5, poll_pct: 60, geek_pct: 70, id: 1000 + pos, name: `Game ${pos}`, year: 2000 + (pos % 20),
    thumbnail: `https://cf.geekdo-images.com/${pos}.jpg`, votes2: 100, best2: 50, rec2: 40, notrec2: 10,
    best_pct: 50, rec_pct: 40, notrec_pct: 10, weight: 2.5, minplaytime: 30, maxplaytime: 60,
    minplayers: 1, maxplayers: 4, minage: 10, bgg_rank: pos * 3, bgg_rating: 7, types: [],
    categories: [], mechanics: [], designers: [], publishers: [], artists: [], families: [],
    ...over,
  };
}

const games = Array.from({ length: 250 }, (_, i) => game(i + 1)).reverse(); // input order must not matter
const posColumn = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].textContent);
const header = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}\\s*[▲▼]?$`) });

test("columns in spec order", () => {
  render(<GamesTable games={games} />);
  const heads = screen.getAllByRole("columnheader").map((h) => h.querySelector("button")?.textContent ?? h.textContent);
  expect(heads.map((h) => h!.replace(/[▲▼]/g, "").trim())).toEqual([
    "#", "", "Name", "Year", "Players", "Poll at 2", "BGG rank", "BGG rating", "Two-player score",
  ]);
});

test("default sort is score desc, 100 rows per page", () => {
  render(<GamesTable games={games} />);
  const pos = posColumn();
  expect(pos).toHaveLength(PAGE_SIZE);
  expect(pos[0]).toBe("1");
  expect(pos[99]).toBe("100");
  expect(screen.getByText("Page 1 of 3")).toBeTruthy();
});

test("pagination moves through pages", () => {
  render(<GamesTable games={games} />);
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  expect(posColumn()[0]).toBe("101");
  fireEvent.click(screen.getByRole("button", { name: "»" }));
  expect(posColumn()).toHaveLength(50);
  expect(screen.getByText("Page 3 of 3")).toBeTruthy();
});

test("# is never renumbered when sorting by another column", () => {
  render(<GamesTable games={games} />);
  fireEvent.click(header("Name")); // asc: "Game 1", "Game 10", "Game 100", ...
  expect(posColumn().slice(0, 3)).toEqual(["1", "10", "100"]);
});

test("clicking a header toggles sort direction", () => {
  render(<GamesTable games={games} />);
  fireEvent.click(header("Two-player score")); // desc -> asc
  expect(posColumn()[0]).toBe("250");
  fireEvent.click(header("BGG rank"));
  expect(posColumn()[0]).toBe("1");
  fireEvent.click(header("BGG rank"));
  expect(posColumn()[0]).toBe("250");
});

test("name links to BGG and thumbnail is lazy", () => {
  render(<GamesTable games={games} />);
  expect(screen.getByRole("link", { name: "Game 1" }).getAttribute("href")).toBe("https://boardgamegeek.com/boardgame/1001");
  const img = screen.getAllByRole("presentation")[0] as HTMLImageElement;
  expect(img.getAttribute("loading")).toBe("lazy");
  expect(img.src).toBe("https://cf.geekdo-images.com/1.jpg");
});

test("null values sort last", () => {
  const withNull = [game(1, { year: null }), game(2, { year: 1990 }), game(3, { year: 2010 })];
  render(<GamesTable games={withNull} />);
  fireEvent.click(header("Year"));
  expect(posColumn()).toEqual(["3", "2", "1"]);
  fireEvent.click(header("Year"));
  expect(posColumn()).toEqual(["2", "3", "1"]);
});

test("only #, thumbnail, name and score are phone columns", () => {
  render(<GamesTable games={games} />);
  const kept = screen.getAllByRole("columnheader").filter((h) => !h.classList.contains("wide"));
  expect(kept.map((h) => h.className)).toEqual(["col-pos", "col-thumbnail", "col-name", "col-score"]);
});

test("2p-only games carry a pill; others show their range", () => {
  render(<GamesTable games={[game(1, { minplayers: 2, maxplayers: 2 }), game(2)]} />);
  const players = screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[4].textContent);
  expect(players).toEqual(["2 2p only", "1–4"]);
});

test("tapping a score shows its breakdown; header ⓘ explains the formula", () => {
  render(<GamesTable games={[game(1)]} />);
  const btn = screen.getByRole("button", { name: /^Two-player score 99\.9/ });
  expect(btn.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(btn);
  expect(btn.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Poll at 2 beats 60.0% of games · Geek rating beats 70.0%")).toBeTruthy();
  expect(screen.getByRole("button", { name: "How the Two-player score is calculated" })).toBeTruthy();
});
