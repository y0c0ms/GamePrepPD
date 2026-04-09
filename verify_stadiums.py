import json
import time
import requests
import os
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# SerpAPI Key
SERPAPI_KEY = "d1130751f0313c2f35f05c83ab7318465116f64de63f644150deae237afeb753"

def get_google_maps_coords_serpapi(query):
    url = f"https://serpapi.com/search?engine=google_maps&q={query}&api_key={SERPAPI_KEY}"
    
    try:
        # Use verify=False to avoid SSL issues on corporate networks if they occur
        response = requests.get(url, verify=False, timeout=20)
        if response.status_code == 200:
            data = response.json()
            coords = data.get('gps_coordinates')
            if not coords and 'place_results' in data:
                coords = data['place_results'].get('gps_coordinates')
            if not coords and 'local_results' in data and len(data['local_results']) > 0:
                coords = data['local_results'][0].get('gps_coordinates')
                
            if coords:
                return coords.get('latitude'), coords.get('longitude'), data.get('place_results', {}).get('title')
        else:
            print(f"SerpAPI Error {response.status_code} for {query}")
    except Exception as e:
        print(f"Request error for {query}: {e}")
    return None, None, None

def main():
    if not os.path.exists('stadiums.json'):
        print("Error: stadiums.json not found.")
        return

    with open('stadiums.json', 'r', encoding='utf-8') as f:
        stadiums = json.load(f)

    print(f"Starting High-Precision stadium verification for {len(stadiums)} venues...")
    
    updated_count = 0
    for team_name, info in stadiums.items():
        stadium_name = info['name']
        # Try to search for the stadium name + Portugal to be precise
        query = f"{stadium_name}, Portugal"
        
        print(f"Verifying: {stadium_name} ({team_name})...")
        
        g_lat, g_lon, official_name = get_google_maps_coords_serpapi(query)
        
        if g_lat and g_lon:
            old_lat, old_lon = info['lat'], info['lon']
            info['lat'] = g_lat
            info['lon'] = g_lon
            if official_name:
                info['official_name'] = official_name
            
            # Print drift
            from math import radians, cos, sin, asin, sqrt
            def haversine(lat1, lon1, lat2, lon2):
                R = 6371 
                dlat, dlon = radians(lat2-lat1), radians(lon2-lon1)
                a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
                return R * 2 * asin(sqrt(a))
            
            drift = haversine(old_lat, old_lon, g_lat, g_lon)
            print(f"  Result: {g_lat}, {g_lon} (Offset: {drift:.3f}km)")
            updated_count += 1
        else:
            print(f"  Warning: No results for {stadium_name}")
        
        # Save incrementally
        with open('stadiums_verified.json', 'w', encoding='utf-8') as f:
            json.dump(stadiums, f, indent=2, ensure_ascii=False)
            
        time.sleep(0.3)

    # Final overwrite of original
    with open('stadiums.json', 'w', encoding='utf-8') as f:
        json.dump(stadiums, f, indent=2, ensure_ascii=False)

    print(f"\nVerification complete. Updated {updated_count} stadiums.")

if __name__ == "__main__":
    main()
