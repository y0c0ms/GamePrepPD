import React, { useState, useEffect } from 'react'
import matches from './data/matches.json'
import { MapPin, Clock, Navigation, ShoppingBag, Trophy, Calendar, LogOut } from 'lucide-react'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const now = new Date()
  const sortedMatches = [...matches]
    .map(m => {
      const parts = m.date.split(' ')
      const [d, mo, y] = parts[0].split('.')
      return { ...m, _parsedDate: new Date(`${y}-${mo}-${d}T${parts[1]}:00`) }
    })
    .filter(m => m._parsedDate > now)
    .sort((a, b) => a._parsedDate - b._parsedDate)

  return (
    <div className="dashboard-container">
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto px-6 mb-8 pt-6">
        <div>
          <h1>GamePrep</h1>
          <p className="subtitle">Liga Portugal & Pingo Doce Store Finder</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <LogOut size={16} />
          Sair
        </button>
      </header>

      <div className="games-grid">
        {sortedMatches.map((match, index) => (
          <div key={match.matchId} className="match-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="match-date">
              <Calendar size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              {match.date}
            </div>
            
            <div className="teams-display">
              <span>{match.home_team}</span>
              <span className="vs">VS</span>
              <span>{match.away_team}</span>
            </div>

            <div className="stadium-info">
              <Trophy size={16} color="#484f58" />
              <span>{match.stadium}</span>
            </div>

            <div className="pingo-doce-title">
              <ShoppingBag size={14} />
              Nearby Pingo Doce
            </div>

            {match.nearby_stores.length > 0 ? (
              match.nearby_stores.map((store, sIdx) => (
                <div key={sIdx} className="store-item">
                  <div className="store-name">
                    {store.name}
                    <span className="distance">{store.distance_km} km</span>
                  </div>
                  <div className="store-address">
                    {store.address || "Endereço verificado pelo mapa"}
                  </div>
                  <div className="store-schedule">
                    <Clock size={12} style={{ color: '#27ae60' }} />
                    {store.schedule === 'N/A' ? 'Check hours online' : store.schedule.split(';')[0]}
                  </div>
                  <div 
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`, '_blank')}
                    className="store-schedule" 
                    style={{ marginTop: '0.4rem', color: '#1a73e8', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Navigation size={12} />
                    Abrir no Google Maps
                  </div>
                </div>
              ))
            ) : (
              <div className="no-stores">Nenhuma loja encontrada nas proximidades</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
