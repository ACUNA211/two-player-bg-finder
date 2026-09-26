import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { applyFilters, emptyFilters, type Filters } from "./filters";
import { GamesBrowser } from "./GamesBrowser";
import type { Game } from "./types";

afterEach(cleanup);

function game(pos: number, over: Partial<Game> = {}): Game {
  return {
    pos, score: 100 - pos / 10, poll_score: 0.5, poll_pct: 60, geek_pct: 70, id: 1000 + pos, name: `Game ${pos}`, year: 2000 + (pos % 20),
    thumbnail: null, votes2: 100, best2: 50, rec2: 40, notrec2: 10,
    best_pct: 50, rec_pct: 40, notrec_pct: 10, weight: 2.5, minplaytime: 30, maxplaytime: 60,
    minplayers: 1, maxplayers: 4, minage: 10, bgg_rank: pos * 3, bgg_rating: 7, types: [],
    categories: [], mechanics: [], designers: [], publishers: [], artists: [], families: [],
    ...over,
  };
}

const pos = (gs: Game[]) => gs.map((g) => g.pos);
const filt = (over: Partial<Filters>) => ({ ...emptyFilters(), ...over });
const posColumn = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0].textContent);

test("name search is a case-insensitive substring", () => {
  const gs = [game(1, { name: "Patchwork" }), game(2, { name: "Jaipur" })];
  expect(pos(applyFilters(gs, filt({ name: "TCHW" })))).toEqual([1]);
});

test("type matches any selected value", () => {
  const gs = [game(1, { types: ["Strategy"] }), game(2, { types: ["Family"] }), game(3, { types: ["Party"] })];
  expect(pos(applyFilters(gs, filt({ types: ["Strategy", "Family"] })))).toEqual([1, 2]);
});

test("tag fields match all selected values", () => {
  const gs = [game(1, { mechanics: ["Drafting", "Tile Placement"] }), game(2, { mechanics: ["Drafting"] })];
  expect(pos(applyFilters(gs, filt({ tags: { mechanics: ["Drafting", "Tile Placement"] } })))).toEqual([1]);
});

test("ranges are inclusive, and nulls fail a set bound", () => {
  const gs = [game(1, { weight: 1 }), game(2, { weight: 2 }), game(3, { weight: 3 }), game(4, { weight: null })];
  expect(pos(applyFilters(gs, filt({ ranges: { weight: { min: 2, max: 3 } } })))).toEqual([2, 3]);
  expect(pos(applyFilters(gs, filt({ ranges: { weight: {} } })))).toEqual([1, 2, 3, 4]);
});

test("playtime and players ranges contain the game's whole span", () => {
  const gs = [game(1, { minplaytime: 20, maxplaytime: 40 }), game(2, { minplaytime: 20, maxplaytime: 90 })];
  expect(pos(applyFilters(gs, filt({ ranges: { playtime: { max: 60 } } })))).toEqual([1]);
  const ps = [game(1, { minplayers: 2, maxplayers: 2 }), game(2, { minplayers: 1, maxplayers: 5 })];
  expect(pos(applyFilters(ps, filt({ ranges: { players: { min: 2 } } })))).toEqual([1]);
});

test("minimum votes can't go below 15", () => {
  const gs = [game(1, { votes2: 10 }), game(2, { votes2: 15 }), game(3, { votes2: 40 })];
  expect(pos(applyFilters(gs, filt({ ranges: {} })))).toEqual([2, 3]);
  expect(pos(applyFilters(gs, filt({ ranges: { votes2: { min: 5 } } })))).toEqual([2, 3]);
  expect(pos(applyFilters(gs, filt({ ranges: { votes2: { min: 20 } } })))).toEqual([3]);
});

test("2-player only hides games that go beyond 2", () => {
  const gs = [game(1, { minplayers: 1, maxplayers: 2 }), game(2, { minplayers: 2, maxplayers: 4 })];
  expect(pos(applyFilters(gs, filt({ twoOnly: true })))).toEqual([1]);
});

test("min votes input defaults to 15 and snaps back up on blur", () => {
  render(<GamesBrowser games={[game(1)]} />);
  const input = screen.getByLabelText("Min votes") as HTMLInputElement;
  expect(input.value).toBe("15");
  fireEvent.change(input, { target: { value: "3" } });
  fireEvent.blur(input);
  expect(input.value).toBe("15");
});

test("filtering keeps # and resets to page 1", () => {
  const gs = Array.from({ length: 250 }, (_, i) => game(i + 1, { weight: i % 2 ? 3 : 1 }));
  render(<GamesBrowser games={gs} />);
  fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  expect(posColumn()[0]).toBe("101");
  fireEvent.change(screen.getByLabelText("Weight min"), { target: { value: "2" } });
  expect(screen.getByText("Page 1 of 2")).toBeTruthy();
  expect(posColumn().slice(0, 3)).toEqual(["2", "4", "6"]);
  expect(screen.getByText("125 games")).toBeTruthy();
});

test("side panel opens, searchable multi-select filters, clear all resets", () => {
  const gs = [game(1, { designers: ["Uwe Rosenberg"] }), game(2, { designers: ["Reiner Knizia"] })];
  render(<GamesBrowser games={gs} />);
  const panel = screen.getByRole("complementary", { hidden: true });
  expect(panel.hidden).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  expect(panel.hidden).toBe(false);

  fireEvent.change(within(panel).getAllByRole("searchbox")[2], { target: { value: "uwe" } }); // Designer
  fireEvent.click(within(panel).getByRole("button", { name: "Uwe Rosenberg" }));
  expect(posColumn()).toEqual(["1"]);

  fireEvent.click(within(panel).getByLabelText("2-player only"));
  expect(screen.getByText("0 games")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(posColumn()).toEqual(["1", "2"]);
  expect((within(panel).getByLabelText("2-player only") as HTMLInputElement).checked).toBe(false);
});
