# First real data refresh

Type: task
Status: ready-for-human
Blocked by: 02, 04, 05, 06

## Checklist (human)

1. Download a fresh `bg_ranks` CSV while logged into BGG, and save it in `data/`.
2. Check that `BGG_TOKEN` is set, then run `python scraper/refresh.py`. It takes about 20 min.
3. Check the live site: about 3,300 games are listed, the top of the list looks right (e.g. Patchwork near the top), the filters work, and the footer shows the logo.
