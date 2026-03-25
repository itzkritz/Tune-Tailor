import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import './Dashboard.css';

export default function FavoritesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Bounce unauthorized directly out of the application
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Load favorites securely mapped to the internal browser cache
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      const stored = JSON.parse(localStorage.getItem(`tt_favs_${session.user.email}`) || '[]');
      setFavorites(stored);
      setLoading(false);
    }
  }, [session, status]);

  const removeFavorite = (trackId) => {
    if (!session?.user?.email) return;
    const storageKey = `tt_favs_${session.user.email}`;
    const updated = favorites.filter(t => t.id !== trackId);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setFavorites(updated);
  };

  const toggleProfilePin = (e, track) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user?.email) return;
    
    const pinKey = `tt_profile_songs_${session.user.email}`;
    let pinned = JSON.parse(localStorage.getItem(pinKey) || '[]');
    
    const identifier = track.id || track.name;
    const isPinned = pinned.some(p => (p.id || p.name) === identifier);
    
    if (isPinned) {
      pinned = pinned.filter(p => (p.id || p.name) !== identifier);
      localStorage.setItem(pinKey, JSON.stringify(pinned));
      alert('Removed from Profile.');
    } else {
      if (pinned.length >= 4) {
        alert('You can only pin up to 4 tracks to your profile. Remove one first!');
        return;
      }
      pinned.push(track);
      localStorage.setItem(pinKey, JSON.stringify(pinned));
      alert('Pinned to your Profile!');
    }
    setActiveMenuId(null);
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">TUNE TAILOR</div>
        <ul className="dashboard-nav-links">
          <li onClick={() => router.push('/dashboard')}>Journal</li>
          <li onClick={() => router.push('/history')}>History Gallery</li>
          <li className="active">Favorites</li>
          <li className="logout-btn" onClick={() => signOut({ callbackUrl: '/' })}>Log Out</li>
        </ul>
        {session?.user && (
          <img 
            src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`} 
            className="pfp-circle" 
            alt="Profile" 
            onClick={() => router.push('/profile')}
          />
        )}
      </nav>

      <main className="gallery-container">
        {/* Invisible Dropdown Dismiss Overlay */}
        {activeMenuId && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
            onMouseDown={() => setActiveMenuId(null)}
          />
        )}
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'white' }}>Favorite Tracks</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Your hand-picked acoustic resonances.</p>
          <div className="gradient-line" style={{ margin: '1rem auto 3rem', width: '50%', opacity: 0.5 }}></div>

          {loading ? (
            <p style={{ color: 'var(--neon-primary)' }}>Loading favorites vault...</p>
          ) : favorites.length === 0 ? (
            <div style={{ padding: '3rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1rem' }}>Your favorites vault is completely empty.</p>
              <p style={{ color: 'var(--text-secondary)' }}>Go hit the '❤️' icon on any track inside your Journal generator to save them forever!</p>
            </div>
          ) : (
            <div style={{ width: '100%', padding: '0 1rem' }}>
              {/* Spotify style header */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 150px', padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                <span>#</span>
                <span>TITLE</span>
                <span>ALBUM</span>
                <span style={{ textAlign: 'right', paddingRight: '1rem' }}>ACTIONS</span>
              </div>

              {favorites.map((track, i) => {
                const pinKey = `tt_profile_songs_${session?.user?.email}`;
                const pinned = JSON.parse(localStorage.getItem(pinKey) || '[]');
                const isPinned = pinned.some(p => (p.id || p.name) === (track.id || track.name));

                return (
                  <div key={track.id + i} style={{ 
                    display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 150px', alignItems: 'center',
                    padding: '0.8rem 1rem', borderRadius: '4px', transition: 'background 0.2s',
                    position: 'relative', zIndex: activeMenuId === track.id ? 100 : 1,
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }} className="track-row-hover">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{i + 1}</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                      {track.image && <img src={track.image} style={{ width: '40px', height: '40px', borderRadius: '4px' }} alt="art" />}
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{track.artist}</span>
                      </div>
                    </div>

                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.album || 'Single'}</span>

                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => {
                          if (track.external_url) {
                            window.open(track.external_url, '_blank');
                          } else {
                            window.open(`https://open.spotify.com/search/${encodeURIComponent(track.name + ' ' + track.artist)}`, '_blank');
                          }
                        }}
                        style={{ padding: '4px 10px', background: '#1DB954', border: 'none', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        PLAY
                      </button>
                      
                      <button 
                        onClick={() => removeFavorite(track.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        title="Remove"
                      >
                        💔
                      </button>
                      
                      {/* Ellipsis Options Menu */}
                      <div style={{ position: 'relative' }}>
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === track.id ? null : track.id)}
                          style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                        >
                          ⋮
                        </button>
                        
                        {activeMenuId === track.id && (
                          <div style={{
                            position: 'absolute', right: '0', top: '100%', marginTop: '0.5rem',
                            background: 'rgba(11,4,16,1)', border: '1px solid var(--neon-primary)',
                            borderRadius: '8px', padding: '0.5rem', width: '160px', zIndex: 200,
                            boxShadow: '0 5px 15px rgba(0,0,0,0.9)'
                          }}>
                            <button 
                              onMouseDown={(e) => toggleProfilePin(e, track)}
                              style={{
                                width: '100%', background: 'transparent', border: 'none', color: isPinned ? 'var(--neon-primary)' : 'white',
                                textAlign: 'left', padding: '0.5rem', cursor: 'pointer', fontFamily: 'Inter',
                                fontSize: '0.8rem', fontWeight: isPinned ? 'bold' : 'normal'
                              }}
                            >
                              {isPinned ? '⭐ Shown on Profile' : '☆ Show on Profile'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) }
        </div>
      </main>
    </div>
  );
}
