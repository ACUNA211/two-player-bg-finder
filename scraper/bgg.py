"""Fetch and parse the Seed set from BGG: ranks dump CSV -> /thing?stats=1 -> plain records."""
import csv
import os
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

API = "https://boardgamegeek.com/xmlapi2/thing?stats=1&type=boardgame&id="
SEED_SIZE = 5000
BATCH = 20          # BGG max IDs per /thing call
SPACING = 5.0       # seconds between request starts
RETRIES = 6
BACKOFF = 10        # seconds, doubled per retry, capped at BACKOFF_MAX
BACKOFF_MAX = 120

# Ranks-dump category-rank column -> Type
TYPE_COLUMNS = {
    "strategygames_rank": "Strategy",
    "familygames_rank": "Family",
    "thematic_rank": "Thematic",
    "wargames_rank": "Wargames",
    "abstracts_rank": "Abstract",
    "partygames_rank": "Party",
    "cgs_rank": "Customizable",
    "childrensgames_rank": "Children's",
}

# XML link type -> record field
LINK_FIELDS = {
    "boardgamecategory": "categories",
    "boardgamemechanic": "mechanics",
    "boardgamedesigner": "designers",
    "boardgamepublisher": "publishers",
    "boardgameartist": "artists",
    "boardgamefamily": "families",
}


class FetchError(RuntimeError):
    pass


def newest_dump(data_dir):
    dumps = sorted(Path(data_dir).glob("*.csv"), key=lambda p: p.stat().st_mtime)
    if not dumps:
        raise FileNotFoundError(f"no ranks dump (*.csv) in {data_dir}")
    return dumps[-1]


def load_seed_set(csv_path, size=SEED_SIZE):
    """Top `size` ranked games from the dump, as {id: {bgg_rank, bgg_rating, types}}, in rank order."""
    with open(csv_path, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r["rank"] not in ("", "0")]
    rows.sort(key=lambda r: int(r["rank"]))
    return {
        int(r["id"]): {
            "bgg_rank": int(r["rank"]),
            "bgg_rating": float(r["bayesaverage"]),
            "types": [t for col, t in TYPE_COLUMNS.items() if r.get(col)],
        }
        for r in rows[:size]
    }


def _http_get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}",
                                               "User-Agent": "boardgamesfortwo/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""


def _retryable(status):
    return status in (202, 429) or 500 <= status < 600


def fetch_batch(ids, token, get=_http_get, sleep=time.sleep):
    """GET one /thing batch. Retries on 202, 429, 5xx and network errors; raises FetchError when out of retries."""
    url = API + ",".join(map(str, ids))
    backoff = BACKOFF
    for attempt in range(RETRIES + 1):
        try:
            status, body = get(url, token)
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            status, body = f"network error ({e})", b""
        if status == 200:
            return body
        if isinstance(status, int) and not _retryable(status):
            raise FetchError(f"HTTP {status} for ids {ids[0]}..{ids[-1]}")
        if attempt == RETRIES:
            break
        print(f"  {status}, retry in {backoff}s", flush=True)
        sleep(backoff)
        backoff = min(backoff * 2, BACKOFF_MAX)
    raise FetchError(f"{status} after {RETRIES} retries for ids {ids[0]}..{ids[-1]}")


def _value(item, path, cast):
    el = item.find(path)
    v = None if el is None else el.get("value")
    return None if v in (None, "") else cast(v)


def _pct(n, total):
    return round(n / total * 100, 1) if total else None


def parse_things(xml):
    """Parse a /thing?stats=1 response into one record per item (no dump-derived or computed fields)."""
    records = []
    for it in ET.fromstring(xml).findall("item"):
        votes = {}
        for res in it.findall("poll[@name='suggested_numplayers']/results"):
            if res.get("numplayers") == "2":
                votes = {r.get("value"): int(r.get("numvotes")) for r in res.findall("result")}
        best, rec, notrec = votes.get("Best", 0), votes.get("Recommended", 0), votes.get("Not Recommended", 0)
        votes2 = best + rec + notrec
        weight = _value(it, "statistics/ratings/averageweight", float)
        rec_ = {
            "id": int(it.get("id")),
            "name": _value(it, "name[@type='primary']", str),
            "year": _value(it, "yearpublished", int),
            "thumbnail": (it.findtext("thumbnail") or "").strip() or None,
            "votes2": votes2,
            "best2": best, "rec2": rec, "notrec2": notrec,
            "best_pct": _pct(best, votes2), "rec_pct": _pct(rec, votes2), "notrec_pct": _pct(notrec, votes2),
            "weight": weight or None,  # BGG reports 0 when nobody has voted
            "minplaytime": _value(it, "minplaytime", int),
            "maxplaytime": _value(it, "maxplaytime", int),
            "minplayers": _value(it, "minplayers", int),
            "maxplayers": _value(it, "maxplayers", int),
            "minage": _value(it, "minage", int),
        }
        for field in LINK_FIELDS.values():
            rec_[field] = []
        for link in it.findall("link"):
            field = LINK_FIELDS.get(link.get("type"))
            if field:
                rec_[field].append(link.get("value"))
        records.append(rec_)
    return records


def fetch_seed_set(seed, token=None, get=_http_get, sleep=time.sleep, clock=time.monotonic):
    """Fetch every game in `seed` (from load_seed_set) and return merged records in rank order."""
    token = token or os.environ.get("BGG_TOKEN")
    if not token:
        raise FetchError("BGG_TOKEN not set")
    ids = list(seed)
    records = {}
    n_batches = -(-len(ids) // BATCH)
    for b, i in enumerate(range(0, len(ids), BATCH), 1):
        started = clock()
        for r in parse_things(fetch_batch(ids[i:i + BATCH], token, get, sleep)):
            if r["id"] in seed:
                records[r["id"]] = {**r, **seed[r["id"]]}
        print(f"batch {b}/{n_batches}", flush=True)
        if b < n_batches:
            sleep(max(0.0, SPACING - (clock() - started)))
    missing = len(ids) - len(records)
    if missing:
        print(f"  warning: {missing} seed ids not returned by BGG", flush=True)
    return [records[i] for i in ids if i in records]
