"""Run: python -m unittest discover scraper"""
import unittest
from unittest import mock

import rank
import refresh


def game(id, best, rec, notrec, minp=2, maxp=2, rating=7.0):
    return {"id": id, "best2": best, "rec2": rec, "notrec2": notrec, "votes2": best + rec + notrec,
            "minplayers": minp, "maxplayers": maxp, "bgg_rating": rating}


# Poll counts at 2 from the feasibility sample (issue 05)
PATCHWORK = game("patchwork", 636, 16, 2)
NETRUNNER = game("netrunner", 397, 21, 3)
SPIRIT_ISLAND = game("spirit", 1449, 579, 15, 1, 4)
KELP = game("kelp", 43, 0, 0)
LOVECRAFT_LETTER = game("lovecraft", 0, 14, 58, 2, 6)
KNOWN = [KELP, LOVECRAFT_LETTER, SPIRIT_ISLAND, NETRUNNER, PATCHWORK]


def score(g):
    return rank.two_player_score(g["best2"], g["rec2"], g["notrec2"])


class TwoPlayerScore(unittest.TestCase):
    def test_known_order(self):
        ranked = [g["id"] for g in rank.rank_games(KNOWN, min_listed=0)]
        self.assertEqual(ranked, ["patchwork", "netrunner", "spirit", "kelp", "lovecraft"])

    def test_wilson_pulls_down_few_votes(self):
        self.assertLess(score(KELP), 1.0)                 # all Best, but only 43 votes
        self.assertGreater(score(PATCHWORK), score(KELP))

    def test_range_and_negative_kept(self):
        self.assertLess(score(LOVECRAFT_LETTER), 0)
        self.assertEqual(score(game(1, 0, 0, 10_000)), -1)  # all Not-rec: bound is exactly 0
        self.assertLess(score(game(1, 10_000, 0, 0)), 1)

    def test_known_value(self):
        # s = 1 at n = 43 -> p = 1 -> bound = 1 / (1 + z²/n)
        self.assertAlmostEqual(score(KELP), 2 / (1 + 1.96 ** 2 / 43) - 1, places=12)

    def test_ties_go_to_more_votes(self):
        tie = [game("few", 20, 0, 0), game("many", 40, 0, 0)]
        with mock.patch.object(rank, "two_player_score", return_value=0.5):
            ranked = rank.rank_games(tie, min_listed=0)
        self.assertEqual([g["id"] for g in ranked], ["many", "few"])
        self.assertEqual([g["pos"] for g in ranked], [1, 2])


class Blend(unittest.TestCase):
    def test_percentiles(self):
        self.assertEqual(rank.percentiles([3, 1, 2]), [1.0, 0.0, 0.5])
        self.assertEqual(rank.percentiles([1, 2, 2, 3]), [0.0, 0.5, 0.5, 1.0])
        self.assertEqual(rank.percentiles([5]), [1.0])

    def test_geek_rating_lifts_a_slightly_weaker_poll(self):
        # Poll counts and Geek ratings from the 2026-09-25 refresh
        duel = game("7wd", 1493, 32, 6, rating=7.949)
        ts = game("ts", 887, 48, 6, rating=8.036)
        rated_between = game("mid", 100, 100, 50, rating=8.0)  # weak poll, Geek rating between them
        filler = [game(i, 30 + i, 10, 5, rating=6 + i / 10) for i in range(8)] + [rated_between]
        ranked = [g["id"] for g in rank.rank_games([duel, ts, *filler], min_listed=0)]
        self.assertLess(ranked.index("ts"), ranked.index("7wd"))

    def test_score_is_0_to_100(self):
        games = rank.rank_games(KNOWN, min_listed=0)
        self.assertEqual(games[0]["poll_pct"], 100.0)
        for g in games:
            self.assertTrue(0 <= g["score"] <= 100)
            self.assertAlmostEqual(g["score"], (g["poll_pct"] + g["geek_pct"]) / 2, delta=0.1)


class Listing(unittest.TestCase):
    def test_vote_floor(self):
        self.assertFalse(rank.is_listed(game(1, 14, 0, 0)))
        self.assertTrue(rank.is_listed(game(1, 15, 0, 0)))

    def test_two_player_eligible(self):
        self.assertFalse(rank.is_listed(game(1, 50, 0, 0, 1, 1)))
        self.assertFalse(rank.is_listed(game(1, 50, 0, 0, 3, 6)))
        self.assertTrue(rank.is_listed(game(1, 50, 0, 0, 1, 4)))
        self.assertFalse(rank.is_listed(game(1, 50, 0, 0, None, 4)))

    def test_pos_numbers_from_one(self):
        self.assertEqual([g["pos"] for g in rank.rank_games(KNOWN, min_listed=0)], [1, 2, 3, 4, 5])


class AbortThreshold(unittest.TestCase):
    def many(self, n):
        return [game(i, 20 + i % 7, 3, 1) for i in range(n)]

    def test_aborts_below_2500(self):
        with self.assertRaises(rank.AbortError):
            refresh.build_payload(self.many(2499), "2026-09-25", "2026-09-25")

    def test_unlisted_games_do_not_count(self):
        records = self.many(2499) + [game("thin", 5, 0, 0)]
        with self.assertRaises(rank.AbortError):
            rank.rank_games(records)

    def test_passes_at_2500(self):
        payload = refresh.build_payload(self.many(2500), "2026-09-24", "2026-09-25")
        self.assertEqual(payload["dump_date"], "2026-09-24")
        self.assertEqual(payload["scrape_date"], "2026-09-25")
        self.assertEqual(len(payload["games"]), 2500)


class DumpDate(unittest.TestCase):
    def test_from_filename(self):
        self.assertEqual(refresh.dump_date("data/boardgames_ranks_2026-09-24.csv"), "2026-09-24")


if __name__ == "__main__":
    unittest.main()
