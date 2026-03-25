import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import './MoodCard.css';

export default function MoodCard({ mood, playlist }) {
  const cardRef = useRef(null);

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
            <h2>{mood?.predicted_genre || 'Generated'}</h2>
            <div className="mood-stats">
              <span className="stat-badge">Positivity: {Math.round((mood?.target_valence || 0) * 100)}%</span>
              <span className="stat-badge">Energy: {Math.round((mood?.target_energy || 0) * 100)}%</span>
            </div>
          </div>

          <div className="playlist-section">
            <h3>Your Curated Soundtrack</h3>
            <div className="track-list">
              {playlist?.slice(0, 7).map((track, i) => (
                <div key={i} className="track-item">
                  <span className="track-index">0{i + 1}</span>
                  <div className="track-info">
                    <span className="track-name">{track.name}</span>
                    <span className="track-artist">{track.artists[0]?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button className="download-btn" onClick={downloadCard}>
        Save to Camera Roll ✨
      </button>
    </div>
  );
}
