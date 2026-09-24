# Pull a real sample of BGG game data and measure throughput

Type: task
Labels: wayfinder:task
Status: open
Blocked by: 01, 02, 03

## Question

With a throwaway Python script, fetch `/thing?stats=1` data for a sample of Two-player eligible games spread across rank bands (e.g. ~50 each around ranks 1–500, 1000, 2000, 3000, 5000, 8000). Save the raw results as a sample file and record:

- per band: the distribution of Votes at 2, Best / Recommended / Not Recommended splits, and how many games clear a 30-vote floor
- whether weight, playtime, thumbnail and min/max players are present and sane
- measured throughput (games/minute under the rate limits), extrapolated to a full scrape of 3,000, 5,000 and 8,000 games
