"""Run: python -m unittest discover scraper"""
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import bgg

FIXTURE = Path(__file__).parent / "fixtures" / "thing_sample.xml"


class ParseThings(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.games = {g["id"]: g for g in bgg.parse_things(FIXTURE.read_bytes())}

    def test_parses_every_item(self):
        self.assertEqual(set(self.games), {162886, 231218})

    def test_core_fields(self):
        g = self.games[162886]
        self.assertEqual(g["name"], "Spirit Island")
        self.assertEqual(g["year"], 2017)
        self.assertTrue(g["thumbnail"].startswith("https://cf.geekdo-images.com/"))
        self.assertEqual((g["minplayers"], g["maxplayers"]), (1, 4))
        self.assertEqual((g["minplaytime"], g["maxplaytime"]), (90, 120))
        self.assertEqual(g["minage"], 13)
        self.assertAlmostEqual(g["weight"], 4.0759)

    def test_two_player_poll(self):
        g = self.games[162886]
        self.assertEqual((g["best2"], g["rec2"], g["notrec2"]), (1449, 579, 15))
        self.assertEqual(g["votes2"], 2043)
        self.assertEqual((g["best_pct"], g["rec_pct"], g["notrec_pct"]), (70.9, 28.3, 0.7))

    def test_no_two_player_results(self):
        g = self.games[231218]  # Black Sonata: solo only, poll has no numplayers="2"
        self.assertEqual((g["best2"], g["rec2"], g["notrec2"], g["votes2"]), (0, 0, 0, 0))
        self.assertIsNone(g["best_pct"])

    def test_links(self):
        g = self.games[162886]
        self.assertEqual(g["categories"], ["Environmental", "Fantasy", "Mythology"])
        self.assertEqual(g["designers"], ["R. Eric Reuss"])
        self.assertIn("Loïc Berger", g["artists"])
        self.assertEqual(len(g["publishers"]), 3)
        self.assertEqual(len(g["mechanics"]), 3)
        self.assertEqual(len(g["families"]), 3)
        self.assertEqual(self.games[231218]["publishers"][0], "(Web published)")

    def test_zero_weight_is_none(self):
        xml = b'<items><item id="1"><statistics><ratings><averageweight value="0" /></ratings></statistics></item></items>'
        self.assertIsNone(bgg.parse_things(xml)[0]["weight"])


class LoadSeedSet(unittest.TestCase):
    def test_top_n_ranked_with_types(self):
        header = "id,name,yearpublished,rank,bayesaverage,average,usersrated,is_expansion," + \
                 ",".join(bgg.TYPE_COLUMNS)
        blank = "," * (len(bgg.TYPE_COLUMNS) - 1)
        rows = [
            f"30,C,2000,3,6.5,7,100,0,{blank}",
            "10,A,2000,1,8.1,8,100,0,1,2,,,,,,",       # strategy + family
            f"99,U,2000,0,0,0,5,0,{blank}",              # unranked
            "20,B,2000,2,7.0,7,100,0,,,,,4,,,",        # abstract
        ]
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "ranks.csv"
            p.write_text("\n".join([header] + rows), encoding="utf-8")
            seed = bgg.load_seed_set(p, size=2)
        self.assertEqual(list(seed), [10, 20])
        self.assertEqual(seed[10], {"bgg_rank": 1, "bgg_rating": 8.1, "types": ["Strategy", "Family"]})
        self.assertEqual(seed[20]["types"], ["Abstract"])


class FetchBatch(unittest.TestCase):
    def run_with(self, statuses):
        calls, sleeps = [], []

        def get(url, token):
            calls.append((url, token))
            s = statuses[len(calls) - 1]
            return s, b"<items/>" if s == 200 else b""

        body = bgg.fetch_batch([1, 2], "tok", get=get, sleep=sleeps.append)
        return body, calls, sleeps

    def test_retries_then_succeeds(self):
        body, calls, sleeps = self.run_with([202, 429, 503, 200])
        self.assertEqual(body, b"<items/>")
        self.assertEqual(len(calls), 4)
        self.assertEqual(sleeps, [10, 20, 40])
        self.assertTrue(calls[0][0].endswith("id=1,2"))
        self.assertEqual(calls[0][1], "tok")

    def test_raises_when_retries_used_up(self):
        with self.assertRaises(bgg.FetchError):
            self.run_with([500] * (bgg.RETRIES + 1))

    def test_non_retryable_raises_immediately(self):
        with self.assertRaises(bgg.FetchError):
            self.run_with([401])


class FetchSeedSet(unittest.TestCase):
    def test_batches_spacing_and_merge(self):
        seed = {i: {"bgg_rank": i, "bgg_rating": 7.0, "types": []} for i in range(1, 46)}
        batches, sleeps = [], []

        def get(url, token):
            ids = [int(x) for x in url.split("id=")[1].split(",")]
            batches.append(ids)
            return 200, ("<items>" + "".join(f'<item id="{i}" />' for i in ids) + "</items>").encode()

        games = bgg.fetch_seed_set(seed, token="tok", get=get, sleep=sleeps.append, clock=lambda: 0.0)
        self.assertEqual([len(b) for b in batches], [20, 20, 5])
        self.assertEqual(sleeps, [bgg.SPACING, bgg.SPACING])
        self.assertEqual([g["id"] for g in games], list(range(1, 46)))
        self.assertEqual(games[0]["bgg_rank"], 1)

    def test_requires_token(self):
        with mock.patch.dict(os.environ, {"BGG_TOKEN": ""}), self.assertRaises(bgg.FetchError):
            bgg.fetch_seed_set({1: {}}, get=None)


if __name__ == "__main__":
    unittest.main()
