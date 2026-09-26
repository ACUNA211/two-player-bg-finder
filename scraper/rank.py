"""Two-player score, eligibility and # positions (feasibility issue 05)."""
import math

VOTE_FLOOR = 15
MIN_LISTED = 2500
Z = 1.96  # Wilson 95%


class AbortError(RuntimeError):
    pass


def two_player_score(best, rec, notrec):
    """Wilson 95% lower bound on (Best + 0.75·Rec − NotRec) / n, mapped to −1..1."""
    n = best + rec + notrec
    s = (best + 0.75 * rec - notrec) / n
    p = (s + 1) / 2
    z2 = Z * Z
    bound = (p + z2 / (2 * n) - Z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / (1 + z2 / n)
    return 2 * bound - 1


def is_listed(g):
    """Two-player eligible (publisher range includes 2) and meets the Vote floor."""
    lo, hi = g["minplayers"], g["maxplayers"]
    return lo is not None and hi is not None and lo <= 2 <= hi and g["votes2"] >= VOTE_FLOOR


def rank_games(records, min_listed=MIN_LISTED):
    """Filter, score and number the games. Raises AbortError if fewer than `min_listed` are listed."""
    games = [{**g, "score": round(two_player_score(g["best2"], g["rec2"], g["notrec2"]), 4)}
             for g in records if is_listed(g)]
    if len(games) < min_listed:
        raise AbortError(f"only {len(games)} games listed (< {min_listed})")
    games.sort(key=lambda g: (-g["score"], -g["votes2"]))
    for pos, g in enumerate(games, 1):
        g["pos"] = pos
    return games
