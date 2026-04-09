import json
import math
from datetime import datetime

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def match_locations():
    # Load games from all sources
    source_files = [
        ('API-Football', 'portugal_all_leagues_v2.json'),
        ('Flashscore', 'FlashscoreScraping/src/data/portugal_all_leagues.json'),
        ('Flashscore', 'FlashscoreScraping/src/data/portugal_liga_portugal.json'),
    ]
    
    merged_games = {} # Key: (home_team_normalized, date)
    
    for source_name, path in source_files:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Dictionary or List check
                items = data.items() if isinstance(data, dict) else enumerate(data)
                
                for _, game in items:
                    home_norm = game['home']['name'].lower().replace(' ', '')
                    key = (home_norm, game['date'])
                    
                    if key not in merged_games:
                        merged_games[key] = {
                            **game,
                            'source': source_name
                        }
        except FileNotFoundError:
            continue

    if not merged_games:
        print("Error: Could not find any match data files!")
        return

    print(f"Merged {len(merged_games)} matches from available sources.")

    # Generate Metadata for Frontend
    metadata = {
        "lastUpdated": datetime.now().isoformat(),
        "sources": list(set(g['source'] for g in merged_games.values())),
        "matchCount": len(merged_games)
    }
    
    # Save metadata to dashboard data dir
    try:
        os.makedirs('dashboard/src/data', exist_ok=True)
        with open('dashboard/src/data/metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save metadata: {e}")

    # Load stadiums
    with open('stadiums.json', 'r', encoding='utf-8') as f:
        stadiums = json.load(f)
    
    stadiums_norm = {k.lower().replace(' ', ''): v for k, v in stadiums.items()}

    # Load Gold stores
    with open('pingo_doce_verified_gold.json', 'r', encoding='utf-8') as f:
        stores_list = json.load(f)
    
    results = []

    for game in merged_games.values():
        home_team = game['home']['name']
        home_norm = home_team.lower().replace(' ', '')
        venue = stadiums_norm.get(home_norm)
        
        if venue:
            s_lat = venue['lat']
            s_lon = venue['lon']
            
            distances = []
            for store in stores_list:
                dist = haversine(s_lat, s_lon, store['lat'], store['lon'])
                distances.append((dist, store))
            
            distances.sort(key=lambda x: x[0])
            top_stores = []
            for d, s in distances[:10]:
                if d <= 15:
                    top_stores.append({
                        'name': s['name'],
                        'address': s['address'],
                        'distance_km': round(d, 2),
                        'lat': s['lat'],
                        'lon': s['lon'],
                        'schedule': s.get('schedule', 'N/A')
                    })
            
            if not top_stores:
                continue

            results.append({
                'matchId': game.get('matchId', str(hash(home_team + game['date']))),
                'date': game['date'],
                'home_team': home_team,
                'away_team': game['away']['name'],
                'league': game.get('league', 'Portugal'),
                'stadium': venue['name'],
                'stadium_lat': s_lat,
                'stadium_lon': s_lon,
                'nearby_stores': top_stores,
                'source': game.get('source', 'Unknown')
            })
        else:
            # Silently skip games with no stadium match
            pass

    with open('matches_with_stores.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"Success! {len(results)} games matched and saved to matches_with_stores.json")

if __name__ == "__main__":
    import os
    match_locations()
