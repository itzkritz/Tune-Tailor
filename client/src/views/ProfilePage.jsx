import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customBanner, setCustomBanner] = useState('');
  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bounce unauthorized directly out of the application
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Read native Supabase data 
  useEffect(() => {
    async function loadProfile() {
      if (status !== 'authenticated' || !session?.user?.email) return;

      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userRow) {
          setUsername(userRow.username || '');
          setAvatarUrl(userRow.avatar_url || '');
          if (userRow.banner_url) {
            setCustomBanner(userRow.banner_url);
          } else {
            setCustomBanner(localStorage.getItem('tt_banner') || '');
          }
        } else if (session?.user) {
          setUsername(session.user.name || session.user.email?.split('@')[0]);
          setAvatarUrl(session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`);
          setCustomBanner(localStorage.getItem('tt_banner') || '');
        }
        
        // Fetch globally pinned songs (Migrate older single-song if exists)
        const pinnedList = localStorage.getItem(`tt_profile_songs_${session.user.email}`);
        if (pinnedList) {
          setFeaturedSongs(JSON.parse(pinnedList));
        } else {
          const oldPinned = localStorage.getItem(`tt_profile_song_${session.user.email}`);
          if (oldPinned) setFeaturedSongs([JSON.parse(oldPinned)]);
        }

      } catch (err) {
        console.error("Failed fetching Supabase user:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [session, status]);

  const handleSave = async () => {
    if (!session?.user?.email) return;
    setSaving(true);
    try {
      // First attempt to save all metrics into Supabase natively
      const { error } = await supabase
        .from('users')
        .update({ username, avatar_url: avatarUrl, banner_url: customBanner })
        .eq('email', session.user.email);
        
      if (error) throw error;
      
    } catch (err) {
      // Graceful fallback: The Postgres 'banner_url' schema column likely doesn't exist yet!
      console.warn("Banner column missing in DB, caching locally...", err);
      localStorage.setItem('tt_banner', customBanner);
      
      // Execute secondary failsafe update for core columns only
      await supabase
        .from('users')
        .update({ username, avatar_url: avatarUrl })
        .eq('email', session.user.email);
    } finally {
      setIsEditing(false);
      setSaving(false);
    }
  };

  const fallbackAvatar = session?.user?.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}` : '';
  const displayAvatar = avatarUrl || session?.user?.image || fallbackAvatar;
  const displayName = username || session?.user?.name || 'Authorized User';

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">TUNE TAILOR</div>
        <ul className="dashboard-nav-links">
          <li onClick={() => router.push('/dashboard')}>Journal</li>
          <li onClick={() => router.push('/history')}>History Gallery</li>
          <li onClick={() => router.push('/favorites')}>Favorites</li>
          <li className="logout-btn" onClick={() => signOut({ callbackUrl: '/' })}>Log Out</li>
        </ul>
        {session?.user && (
          <img 
            src={displayAvatar} 
            className="pfp-circle" 
            alt="Profile" 
            onClick={() => router.push('/profile')}
          />
        )}
      </nav>

      <main className="gallery-container" style={{ padding: '0 5%' }}>
        {loading ? (
          <p style={{ marginTop: '5rem', color: 'var(--neon-primary)' }}>Authenticating...</p>
        ) : (
          <div className="profile-container">
            <div className="profile-banner" style={!customBanner ? { background: 'linear-gradient(45deg, var(--bg-crimson), var(--bg-deep))', border: '1px solid var(--glass-border)' } : {}}>
              {customBanner && <img src={customBanner} alt="Banner" />}
            </div>
            
            <div className="profile-info-card">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="profile-avatar-container">
                  <img src={displayAvatar} alt="Avatar" />
                </div>
                
                <div className="profile-details">
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem', width: '350px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>USERNAME</label>
                        <input 
                          type="text" 
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)} 
                          placeholder="Your Username"
                          style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.8rem', border: '1px solid var(--neon-primary)', borderRadius: '6px', fontFamily: 'Inter' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>PROFILE PICTURE URL</label>
                        <input 
                          type="url" 
                          value={avatarUrl} 
                          onChange={(e) => setAvatarUrl(e.target.value)} 
                          placeholder="Avatar Image URL"
                          style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.8rem', border: '1px solid var(--neon-primary)', borderRadius: '6px', fontFamily: 'Inter' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>BANNER IMAGE URL</label>
                        <input 
                          type="url" 
                          value={customBanner} 
                          onChange={(e) => setCustomBanner(e.target.value)} 
                          placeholder="Banner Image URL"
                          style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.8rem', border: '1px solid var(--neon-primary)', borderRadius: '6px', fontFamily: 'Inter' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2>{displayName}</h2>
                      <span className="bio-sparkles">⋆⁺₊⋆ ☾ ⋆⁺₊⋆</span>
                    </>
                  )}
                  
                </div>
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <button className="profile-btn" onClick={handleSave} disabled={saving} style={{ background: 'var(--neon-primary)', boxShadow: '0 0 10px var(--neon-glow)' }}>
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button className="profile-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                  </>
                ) : (
                  <button className="profile-btn" onClick={() => setIsEditing(true)}>⚙️ Edit Profile</button>
                )}
              </div>
            </div>

            {/* FULL SCREEN / CENTERED FEATURED SOUNDTRACK LIST */}
            {!isEditing && featuredSongs.length > 0 && (
              <div style={{
                marginTop: '4rem', background: 'rgba(11,4,16,0.3)', border: '1px solid var(--glass-border)',
                padding: '2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column',
                width: '100%', maxWidth: '1000px', margin: '4rem auto 0',
                backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--neon-primary)', fontWeight: 'black', letterSpacing: '4px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, var(--neon-primary))' }}></span>
                  FEATURED SOUNDTRACK
                  <span style={{ height: '1px', flex: 1, background: 'linear-gradient(270deg, transparent, var(--neon-primary))' }}></span>
                </h3>

                {/* Spotify style header */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 150px', 
                  padding: '0.8rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', 
                  color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', 
                  letterSpacing: '1px', marginBottom: '1rem' 
                }}>
                  <span>#</span>
                  <span>TITLE</span>
                  <span>ALBUM</span>
                  <span style={{ textAlign: 'right' }}>ACTIONS</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {featuredSongs.map((track, idx) => (
                    <div key={idx} style={{ 
                      display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 150px', alignItems: 'center',
                      padding: '0.8rem 1.5rem', borderRadius: '8px', transition: 'all 0.3s ease',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }} className="track-row-hover">
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', fontWeight: 'bold' }}>{idx + 1}</span>

                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{track.artist}</span>
                      </div>

                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {track.album && track.album !== "Unknown Album" ? track.album : track.artist}
                      </span>

                      <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          onClick={() => {
                            if (track.external_url) {
                              window.open(track.external_url, '_blank');
                            } else {
                              window.open(`https://open.spotify.com/search/${encodeURIComponent(track.name + ' ' + track.artist)}`, '_blank');
                            }
                          }}
                          style={{ background: '#1DB954', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                        >
                          <span style={{ color: 'black', fontSize: '1rem' }}>▶</span>
                        </button>
                        <button 
                          onClick={() => {
                            const updated = featuredSongs.filter((_, i) => i !== idx);
                            localStorage.setItem(`tt_profile_songs_${session.user.email}`, JSON.stringify(updated));
                            setFeaturedSongs(updated);
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
