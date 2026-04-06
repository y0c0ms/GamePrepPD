import json
import time
import requests
import math
import os
import urllib3

# Suppress SSL warnings as requested previously
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# SerpAPI Key provided by user
SERPAPI_KEY = "d1130751f0313c2f35f05c83ab7318465116f64de63f644150deae237afeb753"
MAX_SERPAPI_CALLS = 220  # Budget for the month (250 limit)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def get_google_maps_coords_serpapi(query):
    url = f"https://serpapi.com/search?engine=google_maps&q={query}&api_key={SERPAPI_KEY}"
    
    try:
        response = requests.get(url, verify=False, timeout=20)
        if response.status_code == 200:
            data = response.json()
            # GPS coordinates can be in multiple locations depending on result type
            coords = data.get('gps_coordinates')
            if not coords and 'place_results' in data:
                coords = data['place_results'].get('gps_coordinates')
            if not coords and 'local_results' in data and len(data['local_results']) > 0:
                coords = data['local_results'][0].get('gps_coordinates')
                
            if coords:
                return coords.get('latitude'), coords.get('longitude')
        else:
            print(f"SerpAPI Error {response.status_code} for {query}")
    except Exception as e:
        print(f"Request error for {query}: {e}")
    return None, None

def main():
    if not os.path.exists('pingo_doce_verified.json'):
        print("Error: pingo_doce_verified.json not found.")
        return

    with open('pingo_doce_verified.json', 'r', encoding='utf-8') as f:
        verified_data = json.load(f)

    # Use original OSM for reconciliation (trust but verify)
    with open('pingo_doce_osm.json', 'r', encoding='utf-8') as f:
        osm_data = json.load(f)
    
    osm_points = []
    # Index OSM by name for faster reconciliation
    osm_lookup = {}
    for element in osm_data.get('elements', []):
        tags = element.get('tags', {})
        lat = element.get('lat') or element.get('center', {}).get('lat')
        lon = element.get('lon') or element.get('center', {}).get('lon')
        branch = tags.get('branch', '').lower()
        if lat and lon:
            osm_points.append({'lat': float(lat), 'lon': float(lon)})
            if branch:
                osm_lookup[branch] = (float(lat), float(lon))

    # Identify and prioritize candidates for Google Maps check
    drift_candidates = []
    for store in verified_data:
        v_lat, v_lon = store['lat'], store['lon']
        min_dist = float('inf')
        for osm in osm_points:
            dist = haversine(v_lat, v_lon, osm['lat'], osm['lon'])
            if dist < min_dist:
                min_dist = dist
        
        drift_candidates.append({
            'store': store,
            'drift': min_dist
        })
    
    # Sort by drift descending (most critical first, like Miranda do Douro)
    drift_candidates.sort(key=lambda x: x['drift'], reverse=True)
    
    to_verify = drift_candidates[:MAX_SERPAPI_CALLS]
    
    print(f"Starting High-Precision serpapi verification (Limit: {MAX_SERPAPI_CALLS} calls)...")
    print(f"Max drift candidate: {to_verify[0]['store']['name']} ({to_verify[0]['drift']:.2f}km)")

    # Prepare for results
    # We will build on top of verified_data so all 502 stores are present
    processed_count = 0
    save_file = 'pingo_doce_verified_gold.json'
    
    for i, candidate in enumerate(to_verify, start=1):
        store = candidate['store']
        query = f"Pingo Doce {store['name']} {store['postal_code']}, Portugal"
        
        print(f"[{i}/{MAX_SERPAPI_CALLS}] Verifying with Google Maps: {store['name']} (Geoapify Drift: {candidate['drift']:.2f}km)")
        
        g_lat, g_lon = get_google_maps_coords_serpapi(query)
        processed_count += 1
        
        if g_lat and g_lon:
            # Reconcile with OSM: Does Google confirm the legacy data?
            branch_key = store['name'].lower()
            reconciled = False
            if branch_key in osm_lookup:
                o_lat, o_lon = osm_lookup[branch_key]
                osm_dist = haversine(g_lat, g_lon, o_lat, o_lon)
                if osm_dist < 0.2: # within 200m
                    store['lat'] = o_lat
                    store['lon'] = o_lon
                    store['source'] = "OSM (Google Maps Verified)"
                    reconciled = True
            
            if not reconciled:
                store['lat'] = g_lat
                store['lon'] = g_lon
                store['source'] = "Google Maps Native"
        
        # Incremental Save
        if processed_count % 5 == 0:
            with open(save_file, 'w', encoding='utf-8') as f:
                json.dump(verified_data, f, indent=2, ensure_ascii=False)
        
        time.sleep(0.5) # Responsible delay

    # Final Save
    with open(save_file, 'w', encoding='utf-8') as f:
        json.dump(verified_data, f, indent=2, ensure_ascii=False)

    print(f"\nAudit complete. Used {processed_count} SerpAPI calls.")
    print(f"Verified dataset saved to {save_file}")

if __name__ == "__main__":
    main()
