import requests
import json
import os
from datetime import datetime, timedelta
import urllib3

# Suppress insecure request warnings for the test script
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load API Key from Environment
API_KEY = os.environ.get('API_FOOTBALL_KEY')

if not API_KEY:
    # Try to load from .env file for local development
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if 'API-FOOTBALL' in line or 'API_FOOTBALL_KEY' in line:
                    API_KEY = line.strip().split('=')[-1]
                    break

if not API_KEY:
    print("Error: API_FOOTBALL_KEY not set in environment or .env file.")
    exit(1)

BASE_URL = "https://v3.football.api-sports.io"
HEADERS = {'x-apisports-key': API_KEY}

VENUES_CACHE_FILE = 'portugal_venues_cache.json'
OUTPUT_FILE = 'portugal_all_leagues_v2.json' # New primary source file

# Strict pollution filter keywords
BLACKLIST = ["women", "feminino", "u19", "u21", "u23", "u20", "sub-", "youth", "junior", "under-"]

def get_portugal_venues():
    if os.path.exists(VENUES_CACHE_FILE):
        with open(VENUES_CACHE_FILE, 'r') as f:
            return json.load(f)

    print("Fetching Portugal venues...")
    url = f"{BASE_URL}/venues?country=Portugal"
    response = requests.get(url, headers=HEADERS, verify=False)
    venues = response.json().get('response', [])
    with open(VENUES_CACHE_FILE, 'w') as f:
        json.dump(venues, f)
    return venues

def is_valid_match(fixture_data, portugal_venue_ids):
    league_name = fixture_data['league']['name'].lower()
    league_country = fixture_data['league']['country']
    venue_id = fixture_data['fixture'].get('venue', {}).get('id')

    # 1. Check Blacklist
    if any(word in league_name for word in BLACKLIST):
        return False

    # 2. Check if it's in a Portugal stadium OR a Portugal league
    if league_country == "Portugal" or (venue_id and venue_id in portugal_venue_ids):
        return True
    
    return False

def format_match(f):
    # Convert "2024-04-09T20:45:00+01:00" to "09.04.2024 20:45"
    dt = datetime.fromisoformat(f['fixture']['date'])
    formatted_date = dt.strftime('%d.%m.%Y %H:%M')
    
    return {
        "matchId": str(f['fixture']['id']),
        "date": formatted_date,
        "home": {"name": f['teams']['home']['name']},
        "away": {"name": f['teams']['away']['name']},
        "league": f['league']['name'],
        "venue": f['fixture']['venue']['name'] # Adding venue for extra context
    }

def main():
    if not API_KEY:
        print("Error: API_FOOTBALL_KEY not set.")
        return

    venues = get_portugal_venues()
    portugal_venue_ids = {v['id'] for v in venues if v.get('id')}
    
    # We fetch the next 15 days to balance speed and coverage
    start_date = datetime.now()
    matches_dict = {}

    print(f"Fetching games for the next 15 days...")
    for i in range(15):
        current_date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        print(f"-> {current_date}")
        
        url = f"{BASE_URL}/fixtures?date={current_date}&timezone=Europe/Lisbon"
        response = requests.get(url, headers=HEADERS, verify=False)
        fixtures = response.json().get('response', [])
        
        for f in fixtures:
            if is_valid_match(f, portugal_venue_ids):
                m_id = str(f['fixture']['id'])
                matches_dict[m_id] = format_match(f)

    # Save to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(matches_dict, f, indent=2, ensure_ascii=False)
    
    print(f"Success: Saved {len(matches_dict)} matches to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
