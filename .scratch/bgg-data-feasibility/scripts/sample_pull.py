"""Throwaway: pull a sample of /thing?stats=1 across rank bands, measure throughput (issue 04).

Reads data/boardgames_ranks.csv, writes raw XML + parsed JSON to data/sample/.
Needs env var BGG_TOKEN.
"""
import csv, json, os, random, statistics, sys, time, urllib.error, urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = DATA / "sample"
API = "https://boardgamegeek.com/xmlapi2/thing?stats=1&type=boardgame&id="
BATCH = 20          # BGG max IDs per /thing call
SPACING = 5.0       # seconds between request starts (BGG guidance)
PER_BAND = 60       # oversample; some won't be Two-player eligible
BANDS = {"1-500": (1, 500), "~1000": (950, 1050), "~2000": (1950, 2050),
         "~3000": (2950, 3050), "~5000": (4950, 5050), "~8000": (7950, 8050)}
TOKEN = os.environ.get("BGG_TOKEN") or sys.exit("BGG_TOKEN not set")


def load_ranks():
    with open(DATA / "boardgames_ranks.csv", encoding="utf-8") as f:
        return {int(r["rank"]): r for r in csv.DictReader(f) if r["rank"] not in ("", "0")}


def fetch(ids, log):
    url = API + ",".join(map(str, ids))
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}",
                                               "User-Agent": "two-player-finder-feasibility/0.1"})
    backoff = 10
    while True:
        t0 = time.monotonic()
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            body, status = b"", e.code
        log.append({"status": status, "secs": round(time.monotonic() - t0, 2), "n": len(ids)})
        if status == 200:
            return body
        print(f"  HTTP {status}, retry in {backoff}s", flush=True)
        time.sleep(backoff)
        backoff = min(backoff * 2, 120)


def val(el, path, attr="value"):
    x = el.find(path)
    return None if x is None else x.get(attr)


def parse(xml):
    games = []
    for it in ET.fromstring(xml).findall("item"):
        votes = {}
        poll = it.find("poll[@name='suggested_numplayers']")
        if poll is not None:
            for res in poll.findall("results"):
                if res.get("numplayers") == "2":
                    votes = {r.get("value"): int(r.get("numvotes")) for r in res.findall("result")}
        num = lambda p: (lambda v: float(v) if v not in (None, "") else None)(val(it, p))
        games.append({
            "id": int(it.get("id")),
            "name": val(it, "name[@type='primary']"),
            "minplayers": num("minplayers"), "maxplayers": num("maxplayers"),
            "playingtime": num("playingtime"), "minplaytime": num("minplaytime"),
            "maxplaytime": num("maxplaytime"),
            "thumbnail": (it.findtext("thumbnail") or "").strip() or None,
            "weight": num("statistics/ratings/averageweight"),
            "numweights": num("statistics/ratings/numweights"),
            "best2": votes.get("Best", 0), "rec2": votes.get("Recommended", 0),
            "notrec2": votes.get("Not Recommended", 0),
            "poll_total": int(poll.get("totalvotes")) if poll is not None else None,
        })
    return games


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ranks = load_ranks()
    rng = random.Random(4)
    wanted = []
    for band, (lo, hi) in BANDS.items():
        for rk in sorted(rng.sample(range(lo, hi + 1), PER_BAND)):
            wanted.append((band, rk, int(ranks[rk]["id"])))
    by_id = {gid: (band, rk) for band, rk, gid in wanted}
    ids = [gid for _, _, gid in wanted]

    log, games = [], []
    t_start = time.monotonic()
    for i in range(0, len(ids), BATCH):
        t_req = time.monotonic()
        chunk = ids[i:i + BATCH]
        xml = fetch(chunk, log)
        (OUT / f"batch_{i // BATCH:02d}.xml").write_bytes(xml)
        games += parse(xml)
        print(f"batch {i // BATCH + 1}/{-(-len(ids) // BATCH)}: {len(chunk)} ids", flush=True)
        if i + BATCH < len(ids):
            time.sleep(max(0, SPACING - (time.monotonic() - t_req)))
    elapsed = time.monotonic() - t_start

    for g in games:
        g["band"], g["rank"] = by_id[g["id"]]
    (OUT / "games.json").write_text(json.dumps(games, indent=1), encoding="utf-8")
    (OUT / "requests.json").write_text(json.dumps({"elapsed_s": elapsed, "log": log}, indent=1))
    report(games, elapsed, log, len(ids))


def report(games, elapsed, log, n_ids):
    print(f"\nFetched {len(games)}/{n_ids} games in {elapsed:.1f}s, "
          f"{len(log)} requests, statuses {sorted({l['status'] for l in log})}, "
          f"median latency {statistics.median(l['secs'] for l in log):.2f}s")
    gpm = len(games) / elapsed * 60
    print(f"Throughput: {gpm:.0f} games/min")
    for n in (3000, 5000, 8000):
        print(f"  {n} games ≈ {n / gpm:.0f} min")

    elig = [g for g in games if g["minplayers"] and g["maxplayers"] and g["minplayers"] <= 2 <= g["maxplayers"]]
    print(f"\nTwo-player eligible: {len(elig)}/{len(games)}")
    print(f"\n{'band':7} {'n':>3} {'min':>4} {'p25':>5} {'med':>5} {'p75':>5} {'max':>5} {'>=30':>5}  "
          f"{'Best%':>6} {'Rec%':>6} {'NotR%':>6}  (median per game)")
    for band in BANDS:
        gs = [g for g in elig if g["band"] == band]
        v = sorted(g["best2"] + g["rec2"] + g["notrec2"] for g in gs)
        q = statistics.quantiles(v, n=4)
        share = lambda k: statistics.median(g[k] / t * 100 for g in gs if (t := g["best2"] + g["rec2"] + g["notrec2"]))
        print(f"{band:7} {len(gs):>3} {v[0]:>4} {q[0]:>5.0f} {q[1]:>5.0f} {q[2]:>5.0f} {v[-1]:>5} "
              f"{sum(x >= 30 for x in v):>5}  {share('best2'):>6.1f} {share('rec2'):>6.1f} {share('notrec2'):>6.1f}")

    print("\nField sanity (all fetched games):")
    checks = {
        "minplayers>=1": lambda g: g["minplayers"] is not None and g["minplayers"] >= 1,
        "maxplayers>=min": lambda g: g["maxplayers"] is not None and g["minplayers"] is not None and g["maxplayers"] >= g["minplayers"],
        "playingtime>0": lambda g: (g["playingtime"] or 0) > 0,
        "playingtime<=600": lambda g: (g["playingtime"] or 0) <= 600,
        "min<=max playtime": lambda g: (g["minplaytime"] or 0) <= (g["maxplaytime"] or 0),
        "weight in 1..5": lambda g: g["weight"] is not None and 1 <= g["weight"] <= 5,
        "thumbnail url": lambda g: bool(g["thumbnail"]) and g["thumbnail"].startswith("http"),
        "has 2p poll votes": lambda g: g["best2"] + g["rec2"] + g["notrec2"] > 0,
    }
    for name, fn in checks.items():
        bad = [g for g in games if not fn(g)]
        ex = ", ".join(f"{g['name']} (#{g['rank']})" for g in bad[:3])
        print(f"  {name:20} {len(games) - len(bad)}/{len(games)}" + (f"  e.g. {ex}" if bad else ""))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--report":
        games = json.loads((OUT / "games.json").read_text(encoding="utf-8"))
        meta = json.loads((OUT / "requests.json").read_text())
        report(games, meta["elapsed_s"], meta["log"], len(games))
    else:
        main()
