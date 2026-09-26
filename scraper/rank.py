"""Poll score, Two-player score, eligibility and # positions (issues 05, 08)."""
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


def percentiles(values):
    """Each value's percentile (0..1) among `values`: rank/(n-1), ties share their average rank."""
    n = len(values)
    if n < 2:
        return [1.0] * n
    order = sorted(range(n), key=lambda i: values[i])
    pct = [0.0] * n
    i = 0
    while i < n:
        j = i
        while j + 1 < n and values[order[j + 1]] == values[order[i]]:
            j += 1
        for k in range(i, j + 1):
            pct[order[k]] = (i + j) / 2 / (n - 1)
        i = j + 1
    return pct


def rank_games(records, min_listed=MIN_LISTED):
    """Filter, score and number the games. Raises AbortError if fewer than `min_listed` are listed."""
    games = [{**g, "poll_score": round(two_player_score(g["best2"], g["rec2"], g["notrec2"]), 4)}
             for g in records if is_listed(g)]
    if len(games) < min_listed:
        raise AbortError(f"only {len(games)} games listed (< {min_listed})")
    poll = percentiles([g["poll_score"] for g in games])
    geek = percentiles([g["bgg_rating"] for g in games])
    blend = {g["id"]: 0.5 * pp + 0.5 * gp for g, pp, gp in zip(games, poll, geek)}
    for g, pp, gp in zip(games, poll, geek):
        g["poll_pct"] = round(100 * pp, 1)
        g["geek_pct"] = round(100 * gp, 1)
        g["score"] = round(100 * blend[g["id"]], 1)
    # Sort on the unrounded blend so the 1-decimal display doesn't create ties.
    games.sort(key=lambda g: (-blend[g["id"]], -g["poll_score"], -g["votes2"]))
    for pos, g in enumerate(games, 1):
        g["pos"] = pos
    return games
