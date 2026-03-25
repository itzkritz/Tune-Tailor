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
          </div>
        )}
      </main>
    </div>
  );
}
