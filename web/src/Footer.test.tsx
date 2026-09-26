import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Footer } from "./Footer";

afterEach(cleanup);

test("logo links to BGG, and the credit names BGG with the data dates", () => {
  render(<Footer dumpDate="2026-09-24" scrapeDate="2026-09-25" />);
  const logo = screen.getByRole("img", { name: "Powered by BGG" });
  expect(logo.closest("a")!.getAttribute("href")).toBe("https://boardgamegeek.com");
  expect(screen.getByRole("link", { name: "BoardGameGeek" })).toBeTruthy();
  expect(screen.getByText(/Ranks as of 2026-09-24; poll data fetched 2026-09-25/)).toBeTruthy();
});
