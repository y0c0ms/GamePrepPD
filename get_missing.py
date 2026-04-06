import json

with open('FlashscoreScraping/src/data/portugal_all_leagues.json', encoding='utf-8') as f:
    games = json.load(f)
with open('matches_with_stores.json', encoding='utf-8') as f:
    matched = json.load(f)
with open('stadiums.json', encoding='utf-8') as f:
    stadiums = json.load(f)

matched_ids = {g['matchId'] for g in matched}
items = games.items() if isinstance(games, dict) else enumerate(games)

stadium_map = {k.lower(): v['name'] for k, v in stadiums.items()}

missing = []
for k, g in items:
    mid = g.get('matchId', str(k))
    if mid not in matched_ids:
        home = g['home']['name']
        away = g['away']['name']
        date = g.get('date', 'Unknown')
        
        # look up stadium
        stad = stadium_map.get(home.lower(), 'Unknown Stadium')
        
        missing.append(f"{date} | {home} vs {away} ->  {stad}")

with open('missing_6_games.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(missing))
