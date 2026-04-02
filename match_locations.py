import json
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def match_locations():
    # Load games
    try:
        with open('FlashscoreScraping/src/data/portugal_liga_portugal.json', 'r', encoding='utf-8') as f:
            games = json.load(f)
    except FileNotFoundError:
        with open('FlashscoreScraping/src/data/liga_portugal_games.json', 'r', encoding='utf-8') as f:
            games = json.load(f)
    
    # Load stadiums
    with open('stadiums.json', 'r', encoding='utf-8') as f:
        stadiums = json.load(f)
    
    # Load OSM stores
    with open('pingo_doce_osm.json', 'r', encoding='utf-8') as f:
        osm_data = json.load(f)
    
    # Load scraped stores (for schedules and formatted addresses)
    with open('pingo_doce_lojas.json', 'r', encoding='utf-8') as f:
        scraped_stores = json.load(f)

    # Flatten OSM stores
    stores_list = []
    for element in osm_data['elements']:
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
                'opening_hours': opening_hours,
                'osm_id': element.get('id')
            })

    results = []

    for matchId, game in games.items():
        home_team = game['home']['name']
        if home_team in stadiums:
            stadium_info = stadiums[home_team]
            s_lat = stadium_info['lat']
            s_lon = stadium_info['lon']
            
            # Find closest stores
            distances = []
            for store in stores_list:
                dist = haversine(s_lat, s_lon, store['lat'], store['lon'])
                distances.append((dist, store))
            
            distances.sort(key=lambda x: x[0])
            top_stores = []
            for d, s in distances[:3]:
                top_stores.append({
                    'name': s['name'],
                    'address': s['address'],
                    'distance_km': round(d, 2),
                    'lat': s['lat'],
                    'lon': s['lon'],
                    'schedule': s['opening_hours']
                })
            
            results.append({
                'matchId': matchId,
                'date': game['date'],
                'home_team': home_team,
                'away_team': game['away']['name'],
                'stadium': stadium_info['stadium'],
                'stadium_lat': s_lat,
                'stadium_lon': s_lon,
                'nearby_stores': top_stores
            })

    with open('matches_with_stores.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"✅ Sucesso! {len(results)} jogos processados e salvos em matches_with_stores.json")

if __name__ == "__main__":
    match_locations()
