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
    # Load games - Check multiple possible locations for the scraper output
    paths_to_check = [
        'FlashscoreScraping/src/data/portugal_all_leagues.json',
        'src/data/portugal_liga_portugal.json',
        'FlashscoreScraping/src/data/portugal_liga_portugal.json',
        'FlashscoreScraping/src/data/liga_portugal_games.json',
        'portugal_liga_portugal.json'
    ]
    
    games = None
    loaded_path = ""
    for path in paths_to_check:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                games = json.load(f)
                loaded_path = path
                break
        except FileNotFoundError:
            continue
            
    if games is None:
        print("❌ Error: Could not find any match data files!")
        return

    print(f"✅ Loaded {len(games)} matches from {loaded_path}")

    # Load stadiums
    with open('stadiums.json', 'r', encoding='utf-8') as f:
        stadiums = json.load(f)
    
    # Normalize stadium keys for fuzzy matching (lowercase, no spaces)
    stadiums_norm = {k.lower().replace(' ', ''): v for k, v in stadiums.items()}

    # Load OSM stores
    with open('pingo_doce_osm.json', 'r', encoding='utf-8') as f:
        osm_data = json.load(f)
    
    # Flatten OSM stores
    stores_list = []
    for element in osm_data.get('elements', []):
        lat = element.get('lat')
        lon = element.get('lon')
        if not lat or not lon:
            if 'center' in element:
                lat = element['center']['lat']
                lon = element['center']['lon']
        
        if lat and lon:
            tags = element.get('tags', {})
            name = tags.get('branch', tags.get('name', 'Pingo Doce'))
            address = tags.get('addr:street', '')
            city = tags.get('addr:city', '')
            postcode = tags.get('addr:postcode', '')
            opening_hours = tags.get('opening_hours', 'N/A')
            full_address = f"{address}, {postcode} {city}".strip(', ')
            
            stores_list.append({
                'name': name,
                'address': full_address,
                'lat': lat,
                'lon': lon,
                'opening_hours': opening_hours
            })

    now = datetime.now()
    results = []

    # games can be a dictionary or list
    items = games.items() if isinstance(games, dict) else enumerate(games)

    for key, game in items:
        # Date parsing (Keep parsing to ensure format is OK, but skip the 'if match_date < now' check)
        try:
            match_date = datetime.strptime(game['date'], '%d.%m.%Y %H:%M')
        except:
            pass 
            
        home_team = game['home']['name']
        match_id = game.get('matchId', str(key))
        
        # Fuzzy match home team
        home_norm = home_team.lower().replace(' ', '')
        venue = None
        if home_norm in stadiums_norm:
            venue = stadiums_norm[home_norm]
        
        if venue:
            s_lat = venue['lat']
            s_lon = venue['lon']
            
            # Find closest stores
            distances = []
            for store in stores_list:
                dist = haversine(s_lat, s_lon, store['lat'], store['lon'])
                distances.append((dist, store))
            
            distances.sort(key=lambda x: x[0])
            top_stores = []
            for d, s in distances[:5]:
                if d <= 15:
                    top_stores.append({
                        'name': s['name'],
                        'address': s['address'],
                        'distance_km': round(d, 2),
                        'lat': s['lat'],
                        'lon': s['lon'],
                        'schedule': s['opening_hours']
                    })
            
            # Skip this game entirely if no stores are within 15km
            if not top_stores:
                continue

            results.append({
                'matchId': match_id,
                'date': game['date'],
                'home_team': home_team,
                'away_team': game['away']['name'],
                'league': game.get('league', 'Portugal'),
                'stadium': venue['name'],
                'stadium_lat': s_lat,
                'stadium_lon': s_lon,
                'nearby_stores': top_stores
            })
        else:
            print(f"⚠️ Warning: No stadium found for home team '{home_team}'")

    with open('matches_with_stores.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"🚀 Success! {len(results)} games matched and saved to matches_with_stores.json")

if __name__ == "__main__":
    match_locations()
