import React, { useState, useEffect, useMemo } from 'react'
import matches from './data/matches.json'
import metadata from './data/metadata.json'
import { MapPin, Clock, Navigation, ShoppingBag, Trophy, Calendar, LogOut, ArrowLeft, Search, Thermometer, RefreshCw } from 'lucide-react'
import Login from './components/Login'

// Weather Badge Component
const WeatherBadge = ({ lat, lon, dateStr }) => {
  const [temp, setTemp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Parse "DD.MM.YYYY HH:mm"
        const [datePart, timePart] = dateStr.split(' ');
        const [d, m, y] = datePart.split('.');
        const [hour] = timePart.split(':');
        const formattedDate = `${y}-${m}-${d}`;
        const matchDate = new Date(`${formattedDate}T${timePart}:00`);
        const now = new Date();
        const diffDays = Math.ceil((matchDate - now) / (1000 * 60 * 60 * 24));

        // Open-Meteo forecast is only accurate for next ~14-16 days
        if (diffDays > 14 || diffDays < -1) {
          setTemp("Unavailable");
          setLoading(false);
          return;
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&start_date=${formattedDate}&end_date=${formattedDate}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.hourly && data.hourly.temperature_2m) {
          // Find the temp for the match hour
          const hIndex = parseInt(hour, 10);
          const matchTemp = data.hourly.temperature_2m[hIndex];
          setTemp(`${matchTemp}°C`);
        } else {
          setTemp("Unavailable");
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
        setTemp("Unavailable");
      }
      setLoading(false);
    };

    fetchWeather();
  }, [lat, lon, dateStr]);

  if (loading) return <span className="weather-badge loading">...</span>;
  
  return (
    <span className={`weather-badge ${temp === 'Unavailable' ? 'muted' : ''}`}>
      <Thermometer size={12} />
      {temp}
    </span>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Store-First States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    const auth = localStorage.getItem('gp_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gp_auth');
    setIsAuthenticated(false);
  };

  // Pre-process active games
  const activeMatches = useMemo(() => {
    const now = new Date();
    return [...matches]
      .map(m => {
        const parts = m.date.split(' ');
        const [d, mo, y] = parts[0].split('.');
        return { ...m, _parsedDate: new Date(`${y}-${mo}-${d}T${parts[1]}:00`) };
      })
      .filter(m => m._parsedDate > now)
      .sort((a, b) => a._parsedDate - b._parsedDate);
  }, []);

  // Extract unique stores that have active games nearby
  const uniqueStores = useMemo(() => {
    const storeMap = new Map();
    activeMatches.forEach(match => {
      match.nearby_stores.forEach(store => {
        const uniqueId = `${store.lat}-${store.lon}`;
        if (!storeMap.has(uniqueId)) {
          storeMap.set(uniqueId, store);
        }
      });
    });
    return Array.from(storeMap.values());
  }, [activeMatches]);

  // Derived search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return uniqueStores.filter(store => {
      const nameMatch = store.name.toLowerCase().includes(query);
      const addressMatch = (store.address || '').toLowerCase().includes(query);
      const coordsMatch = `${store.lat},${store.lon}`.includes(query);
      const branchMatch = (store.branch || '').toLowerCase().includes(query);
      return nameMatch || addressMatch || coordsMatch || branchMatch;
    }).slice(0, 50); // Show top 50 suggestions so users can scroll and find their specific branch
  }, [searchQuery, uniqueStores]);

  // When a store is selected, find the active games near it
  const gamesNearStore = useMemo(() => {
    if (!selectedStore) return [];
    return activeMatches.filter(match => 
      match.nearby_stores.some(s => s.lat === selectedStore.lat && s.lon === selectedStore.lon)
    );
  }, [selectedStore, activeMatches]);

  if (loading) return null;

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setSearchQuery('');
  };

  const handleBackToSearch = () => {
    setSelectedStore(null);
  };

  return (
    <div className="dashboard-container">
      <header>
        <div className="header-left">
          <div className="logo-section">
            <h1>GamePrep</h1>
          </div>
          <div className="sync-status">
            <div className="pulse-dot"></div>
            <span>Updated: {new Date(metadata.lastUpdated).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="logout-btn"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main className="main-content">
        {!selectedStore ? (
          // --- LANDING MODE ---
          <div className="search-landing">
             <div className="landing-titles">
                <h2>Find your Pingo Doce</h2>
                <p>Discover professional football matches nearby</p>
             </div>
             
             <div className="search-container">
               <div className="search-input-wrapper">
                 <Search size={20} className="search-icon" />
                 <input 
                   type="text" 
                   className="store-search-input"
                   placeholder="Search store name, address, or branch..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>

               {searchQuery.trim() && (
                 <div className="search-suggestions">
                   {searchResults.length > 0 ? (
                     searchResults.map((store, idx) => (
                       <div key={idx} className="suggestion-item" onClick={() => handleStoreSelect(store)}>
                         <ShoppingBag size={16} className="suggestion-icon" />
                         <div className="suggestion-content">
                           <span className="suggestion-name">{store.name} {store.branch ? `- ${store.branch}` : ''}</span>
                           <span className="suggestion-address">{store.address || "Address not available"}</span>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="no-results">
                       There is no Game in the close future for the searched store or the searched store doesn't exist.
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
        ) : (
          // --- RESULTS MODE ---
          <div className="results-view">
             <button className="back-btn" onClick={handleBackToSearch}>
               <ArrowLeft size={16} />
               <span>Back to Search</span>
             </button>

             <div className="selected-store-header">
               <h2>{selectedStore.name} {selectedStore.branch ? `- ${selectedStore.branch}` : ''}</h2>
               <p><MapPin size={14} style={{ display: 'inline', marginRight: '0.25rem' }}/> {selectedStore.address || "Location verified"}</p>
               <span className="schedule-badge">
                 <Clock size={12} /> {selectedStore.schedule === 'N/A' || !selectedStore.schedule ? 'Check hours online' : selectedStore.schedule.split(';')[0]}
               </span>
             </div>

             <h3 className="section-title">Upcoming Games Nearby</h3>
             <div className="games-grid">
               {gamesNearStore.map((match, index) => (
                 <div key={match.matchId} className="match-card" style={{ animationDelay: `${index * 0.05}s` }}>
                   <div className="match-date">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center' }}>
                         <Calendar size={14} style={{ marginRight: '0.4rem' }} />
                         {match.date}
                       </div>
                       <WeatherBadge lat={match.stadium_lat} lon={match.stadium_lon} dateStr={match.date} />
                     </div>
                     <span className="league-badge">{match.league}</span>
                   </div>
                   
                   <div className="teams-display">
                     <span>{match.home_team}</span>
                     <span className="vs">VS</span>
                     <span>{match.away_team}</span>
                   </div>

                   <div className="stadium-info">
                     <Trophy size={16} color="#8b949e" />
                     <span>{match.stadium}</span>
                     {/* Show distance specific to this match's stadium and the selected store */}
                     <span className="distance-info">
                       {match.nearby_stores.find(s => s.lat === selectedStore.lat && s.lon === selectedStore.lon)?.distance_km} km away
                     </span>
                   </div>
                 </div>
               ))}
               {gamesNearStore.length === 0 && (
                 <div className="no-games-placeholder">
                   No football matches found within 15km of this store.
                 </div>
               )}
             </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
