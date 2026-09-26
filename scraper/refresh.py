"""Weekly data refresh: newest ranks dump in data/ -> BGG -> web/public/games.json -> git commit + push.

Run from anywhere: python scraper/refresh.py   (needs BGG_TOKEN in the environment)
Exits non-zero without writing or pushing if any batch fails or too few games are listed.
"""
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path

import bgg
import rank

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "web" / "public" / "games.json"


def dump_date(path):
    """YYYY-MM-DD from the dump's filename if present, else its modified date."""
    m = re.search(r"\d{4}-\d{2}-\d{2}", Path(path).name)
    return m.group(0) if m else dt.date.fromtimestamp(Path(path).stat().st_mtime).isoformat()


def build_payload(records, dump_day, scrape_day):
    return {"dump_date": dump_day, "scrape_date": scrape_day, "games": rank.rank_games(records)}


def git(*args):
    subprocess.run(["git", *args], cwd=ROOT, check=True)


def publish(payload):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    git("add", str(OUT.relative_to(ROOT)))
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT).returncode == 0:
        print("games.json unchanged; nothing to commit")
        return
    git("commit", "-m", f"Data refresh {payload['dump_date']}")
    git("push")


def main():
    dump = bgg.newest_dump(DATA)
    print(f"dump: {dump.name}")
    seed = bgg.load_seed_set(dump)
    try:
        records = bgg.fetch_seed_set(seed)
        payload = build_payload(records, dump_date(dump), dt.date.today().isoformat())
    except (bgg.FetchError, rank.AbortError) as e:
        print(f"ABORT: {e}. games.json left untouched.", file=sys.stderr)
        return 1
    print(f"{len(payload['games'])} games listed")
    publish(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
