import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useSession } from 'next-auth/react';
import './MoodCard.css';

export default function MoodCard({ mood, playlist }) {
  const cardRef = useRef(null);
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState([]);

  // Load favorites securely mapped to the user environment
  useEffect(() => {
    if (session?.user?.email) {
      const stored = JSON.parse(localStorage.getItem(`tt_favs_${session.user.email}`) || '[]');
      setFavorites(stored);
    }
  }, [session]);

  const toggleFavorite = (track) => {
    if (!session?.user?.email) return;
    const storageKey = `tt_favs_${session.user.email}`;
    let currentFavs = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const identifier = track.id || track.name;
    // Check if track is already bounded by strict identifier
    if (currentFavs.find(t => (t.id || t.name) === identifier)) {
      currentFavs = currentFavs.filter(t => (t.id || t.name) !== identifier);
    } else {
      currentFavs.push({
        id: track.id || track.name,
        name: track.name,
        artist: track.artists?.[0]?.name,
        album: track.album?.name,
        image: track.album?.images?.[0]?.url,
        preview_url: track.preview_url,
        external_url: track.external_urls?.spotify
      });
    }
    
    localStorage.setItem(storageKey, JSON.stringify(currentFavs));
    setFavorites(currentFavs);
  };

  // Dynamically map target Valence (Positivity) and Energy (Intensity) to CSS Gradients
  const getGradient = () => {
    const v = mood?.target_valence || 0.5;
    const e = mood?.target_energy || 0.5;

    // High Energy, High Valence (Happy/Dance)
    if (v >= 0.5 && e >= 0.5) return 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)';
    // Low Energy, High Valence (Chill/Acoustic)
    if (v >= 0.5 && e < 0.5) return 'linear-gradient(135deg, #A8E6CF 0%, #3D84A8 100%)';
    // High Energy, Low Valence (Angry/Metal/Rock)
    if (v < 0.5 && e >= 0.5) return 'linear-gradient(135deg, #2B2E4A 0%, #E84545 100%)';
    // Low Energy, Low Valence (Sad/Lofi)
    return 'linear-gradient(135deg, #2C3E50 0%, #000000 100%)';
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `MoodMosaic-${mood?.predicted_genre || 'Playlist'}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to capture image:", error);
    }
  };

  return (
    <div className="mood-card-wrapper">
      <div 
        className="mood-card" 
        ref={cardRef}
        style={{ background: getGradient() }}
      >
        <div className="card-content">
          <div className="card-header">
            <h2>
              {mood?.predicted_genre === 'edm' ? 'EDM' : 
               mood?.predicted_genre === 'r&b' ? 'R&B' : 
               (mood?.predicted_genre || 'Generated')}
            </h2>
            <div className="mood-stats">
              <span className="stat-badge">Positivity: {Math.round((mood?.target_valence || 0) * 100)}%</span>
              <span className="stat-badge">Energy: {Math.round((mood?.target_energy || 0) * 100)}%</span>
            </div>
          </div>

          <div className="playlist-section">
            <h3>Your Curated Soundtrack</h3>
            <div className="track-list">
              {playlist?.slice(0, 10).map((track, i) => {
                const identifier = track.id || track.name;
                const isFav = favorites.find(t => (t.id || t.name) === identifier);
                return (
                  <div key={identifier + i} className="track-item" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                      <span className="track-index">{(i + 1).toString().padStart(2, '0')}</span>
                      <div className="track-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span className="track-name">{track.name}</span>
                        <span className="track-artist">{track.artists[0]?.name}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(track)}
                      style={{ 
                        background: 'transparent', border: 'none', cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isFav ? '#ff0055' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.3s ease',
                        marginLeft: '1rem'
                      }}
                      title="Save to Favorites"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
        <button className="download-btn" onClick={downloadCard} style={{ flex: 1, padding: '1rem 0', display: 'flex', justifyContent: 'center' }}>
          Save Image ✨
        </button>
        <button 
          className="download-btn" 
          onClick={() => window.open('https://open.spotify.com/', '_blank')}
          style={{ flex: 1, background: '#1DB954', color: 'black', border: 'none', padding: '1rem 0', display: 'flex', justifyContent: 'center' }}
        >
          Open Spotify 🎧
        </button>
      </div>
    </div>
  );
}
