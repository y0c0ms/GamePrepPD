import React from 'react'
import matches from './data/matches.json'
import { MapPin, Clock, Navigation, ShoppingBag, Trophy, Calendar } from 'lucide-react'

function App() {
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
      <header>
        <h1>GamePrep</h1>
        <p className="subtitle">Liga Portugal & Pingo Doce Store Finder</p>
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
                  <div className="store-schedule" style={{ marginTop: '0.2rem', color: '#1a73e8', cursor: 'pointer', fontWeight: 600 }}>
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
