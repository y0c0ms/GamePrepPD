# GamePrep - Liga Portugal & Pingo Doce Finder

GamePrep is a dashboard that finds the Pingo Doce stores closest to Liga Portugal match venues, so fans can shop before kick-off.

## Features
- **Match list**: Liga Portugal fixtures with date, time and stadium, synced daily from scraped and API-Football data.
- **Stadium proximity**: Ranks Pingo Doce stores by Haversine distance from each stadium's coordinates.
- **Store search**: Find stores by name, address or branch.
- **Store details**: Name, address and opening hours.
- **Weather at kick-off**: Temperature forecast for the match hour via Open-Meteo.
- **Daily data sync**: A GitHub Actions workflow refreshes the data every day at 03:00 UTC.

## Run it

The dashboard is a React + Vite app in `dashboard/`:

```bash
cd dashboard
bun install   # or: npm install
bun dev       # or: npm run dev
```

Other scripts: `build`, `lint` and `preview` (see `dashboard/package.json`).

To refresh the data manually (requires Node 18+, Python 3, and an `API_FOOTBALL_KEY` environment variable for the API step):

```bash
cd FlashscoreScraping && npm install && cd ..
node FlashscoreScraping/src/index.js country=portugal league=liga-portugal
python3 update_matches_v2.py
python3 match_locations.py
cp matches_with_stores.json dashboard/src/data/matches.json
```

## How it works
1. **Flashscore scraper** (Node.js, Playwright): collects Liga Portugal matches.
2. **API-Football fetch** (Python): `update_matches_v2.py` adds fixtures from API-Football.
3. **Matching engine** (Python): `match_locations.py` pairs each stadium with the nearest store from the Pingo Doce dataset (OpenStreetMap-derived).
4. **React dashboard**: reads `dashboard/src/data/matches.json` and renders the results.

The dashboard has a simple client-side login screen.

## Project structure
- `.github/workflows/`: scheduled data update workflow.
- `dashboard/`: React application.
- `FlashscoreScraping/`: scraper module.
- `update_matches_v2.py`: API-Football fetch.
- `match_locations.py`: stadium-to-store matching.
- `stadiums.json`: stadium coordinate database.
- `pingo_doce_verified_gold.json`: verified store dataset used for matching.
