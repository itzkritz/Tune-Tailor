import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import MoodCard from '../components/MoodCard';
import { fetchMoodHistory } from '../lib/supabase';
import './Dashboard.css';

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pastEntries, setPastEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function loadHistory() {
      if (status !== 'authenticated') return;
      
      const activeUserId = session?.user?.id || session?.user?.email;
      const history = await fetchMoodHistory(activeUserId);
      
      // Parse the JSON playlist back to objects for the Card mapping
      const formattedHistory = history.map(entry => ({
        id: entry.id,
        date: new Date(entry.created_at).toLocaleDateString(),
        mood: { 
          target_valence: entry.valence, 
          target_energy: entry.energy,
          predicted_genre: entry.predicted_genre 
        },
        playlist: JSON.parse(entry.playlist || '[]').map(p => ({
            name: p.name,
            artists: [{ name: p.artist }]
        }))
      }));

      setPastEntries(formattedHistory);
      setLoading(false);
    }
    loadHistory();
  }, [session, status]);

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">TUNE TAILOR</div>
        <ul className="dashboard-nav-links">
          <li onClick={() => router.push('/dashboard')}>Journal</li>
          <li className="active">History Gallery</li>
          <li onClick={() => router.push('/favorites')}>Favorites</li>
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

        <h1 style={{ marginTop: '3rem' }}>Your Past Mood Mosaics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Shuffle through your previous emotional states and soundtracks.</p>

        <div className="gradient-line" style={{ margin: '2rem auto 3rem', width: '30%', opacity: 0.5 }}></div>

        <div className="history-grid">
          {pastEntries.map(entry => (
            <div key={entry.id} className="history-card-wrapper">
              <div className="date-badge">{entry.date}</div>
              {/* Rendering miniature versions using CSS transforms could be done, but for simplicity we show full or scaled */}
              <div className="card-scale-wrapper">
                 <MoodCard mood={entry.mood} playlist={entry.playlist} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
