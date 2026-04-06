import json
import time
import math
import requests
import urllib3
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def geocode(address, postal_code, retries=3):
    api_key = "308662c413254e2492e16665c457a6c3"
    # Cleaner address for better results
    clean_addr = address.split(',')[0].strip()
    query = f"{clean_addr}, {postal_code}, Portugal"
    base_url = "https://api.geoapify.com/v1/geocode/search"
    params = {
        "text": query,
        "apiKey": api_key,
        "limit": 1
    }
    
    for attempt in range(retries):
        try:
            response = requests.get(base_url, params=params, verify=False, timeout=15)
            
            if response.status_code == 429:
                print(f"Geoapify Rate Limit! (Wait 1s for {query})")
                time.sleep(1)
                continue
                
            if response.status_code != 200:
                if attempt == 0:
                    params["text"] = f"{postal_code}, Portugal"
                    continue
                continue

            data = response.json()
            if data and data.get('features') and len(data['features']) > 0:
                coords = data['features'][0]['geometry']['coordinates']
                return float(coords[1]), float(coords[0]) # Geoapify returns [lon, lat]
            else:
                if attempt == 0:
                    params["text"] = f"{postal_code}, Portugal"
                    continue
                return None
        except Exception as e:
            if attempt < retries - 1:
                continue
            print(f"Error geocoding {query}: {e}")
    return None

def main():
    print("Starting FULL COORDINATE VERIFICATION (502 stores)...")
    
    with open('pingo_doce_lojas.json', 'r', encoding='utf-8') as f:
        official_lojas = json.load(f)
        
    with open('pingo_doce_osm.json', 'r', encoding='utf-8') as f:
        osm_data = json.load(f)
    
    osm_stores = []
    for element in osm_data.get('elements', []):
        tags = element.get('tags', {})
        lat = element.get('lat') or element.get('center', {}).get('lat')
        lon = element.get('lon') or element.get('center', {}).get('lon')
        if lat and lon:
            osm_stores.append({
                'name': tags.get('branch', tags.get('name', 'Pingo Doce')),
                'lat': float(lat),
                'lon': float(lon)
            })

    verified_database = []
    if os.path.exists('pingo_doce_verified.json'):
        with open('pingo_doce_verified.json', 'r', encoding='utf-8') as f:
            verified_database = json.load(f)
    
    # Track which stores are already done
    processed_names = {v['name'] for v in verified_database}
    outliers = []
    
    print(f"Auditing ALL stores (Skipping {len(processed_names)} already done)...")
    
    start_time = time.time()
    
    for i, loja in enumerate(official_lojas, start=1):
        if loja['name'] in processed_names:
            continue
            
        # Log progress every 5 stores
        if i % 5 == 0 or i == 1:
            elapsed = time.time() - start_time
            print(f"[{i}/{len(official_lojas)}] Verifying: {loja['name']}... ({elapsed:.1f}s)")
        
        target_coords = geocode(loja['address'], loja['postal_code'])
        if not target_coords:
            # Fallback to OSM if geocoding fails completely
            continue
            
        t_lat, t_lon = target_coords
        
        # Build verified entry
        verified_entry = loja.copy()
        verified_entry['lat'] = t_lat
        verified_entry['lon'] = t_lon
        verified_database.append(verified_entry)
        
        # Find matching OSM store for drift check
        min_dist = float('inf')
        closest_osm = None
        for osm in osm_stores:
            dist = haversine(t_lat, t_lon, osm['lat'], osm['lon'])
            if dist < min_dist:
                min_dist = dist
                closest_osm = osm
        
        # High-drift check (potential API hallucination)
        is_high_drift = min_dist > 50.0
        
        if closest_osm and min_dist > 1.0:
            gmaps_link = f"https://www.google.com/maps/search/?api=1&query={t_lat},{t_lon}"
            prefix = "CRITICAL DRIFT" if is_high_drift else "WARNING"
            print(f"{prefix}: {loja['name']} drift: {min_dist:.2f}km")
            print(f"   Address: {loja['address']}")
            print(f"   New API: {t_lat}, {t_lon}")
            print(f"   Old OSM: {closest_osm['lat']}, {closest_osm['lon']}")
            print(f"   Verify:  {gmaps_link}")
            
            outlier = {
                'name': loja['name'],
                'address': loja['address'],
                'drift_km': min_dist,
                'verified_coords': [t_lat, t_lon],
                'old_osm_coords': [closest_osm['lat'], closest_osm['lon']],
                'verification_link': gmaps_link,
                'manual_review_needed': is_high_drift
            }
            outliers.append(outlier)
            
            # Incremental log save
            with open('audit_hall_of_shame.log', 'a', encoding='utf-8') as f:
                f.write(f"{prefix}: {loja['name']} ({min_dist:.2f}km)\n")
                f.write(f"  Address: {loja['address']}\n")
                f.write(f"  Verify: {gmaps_link}\n\n")

        # Save progress incrementally
        with open('pingo_doce_verified.json', 'w', encoding='utf-8') as f:
            json.dump(verified_database, f, indent=2, ensure_ascii=False)

    print(f"\nAudit complete. Successfully verified {len(verified_database)} stores.")
    print(f"Found {len(outliers)} outliers. Results saved to pingo_doce_verified.json")

if __name__ == "__main__":
    main()
