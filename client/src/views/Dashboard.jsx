import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { saveMoodEntry } from '../lib/supabase';
import { useSession, signOut } from 'next-auth/react';
import MoodCard from '../components/MoodCard';
import './Dashboard.css';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsGenerating(true);

    try {
      // Call our Custom ML Model Node.js Backend
      const response = await axios.post('http://localhost:5000/api/recommendations/text', { text });
      
      const newCard = {
        mood: response.data.mood, 
        playlist: response.data.playlist,
        ml_confidence: response.data.ml_confidence
      };
      
      setGeneratedCard(newCard);
      // Attempt to save to database silently
      const activeUserId = session?.user?.id || session?.user?.email;
      saveMoodEntry(text, newCard.mood, newCard.playlist, activeUserId);
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Failed to analyze mood. Is the local Node.js server running?");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">TUNE TAILOR</div>
        <ul className="dashboard-nav-links">
          <li className="active">Journal</li>
          <li onClick={() => router.push('/history')}>History Gallery</li>
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

      <main className="chat-container">

        {!generatedCard ? (
          <div className="chat-area">
            <h1>How are you feeling today?</h1>
            <p>Write your thoughts, feelings, or just brain-dump your day. Our AI will analyze your mood and generate your soundtrack.</p>
            
            <div className="gradient-line" style={{ margin: '2rem auto 3rem', width: '50%', opacity: 0.5 }}></div>

            <form onSubmit={handleSubmit} className="input-box">
              <textarea 
                placeholder="Type your feelings here..." 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                rows={5}
                autoFocus
              />
              <div className="input-actions">
                <button type="button" className="upload-img-btn" title="Upload Image Instead">
                  <ImageIcon size={20} />
                </button>
                <button type="submit" disabled={isGenerating || !text.trim()}>
                  {isGenerating ? 'Analyzing...' : <Send size={20} />}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="generated-result">
            <button className="back-btn" onClick={() => setGeneratedCard(null)}>← Write Another Entry</button>
            <MoodCard mood={generatedCard.mood} playlist={generatedCard.playlist} />
          </div>
        )}
      </main>
    </div>
  );
}
