const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { predictGenreFromText } = require('./services/sentimentService');
const { getRecommendationsFromGenre } = require('./services/spotifyService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Mood Mosaic Server is running' });
});

/**
 * Endpoint to run ML Classification on text and fetch a playlist.
 */
app.post('/api/recommendations/text', async (req, res) => {
  try {
    const { text, seedGenres } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // 1. Run inference using the Natural Language Neural Net
    const moodProfile = predictGenreFromText(text);
    
    // 2. Fetch the Spotify recommendations using the exact ML-predicted genre & semantic modifiers
    let recommendationData = await getRecommendationsFromGenre(
      moodProfile.predicted_genre, 
      seedGenres || '',
      moodProfile.extracted_keywords,
      moodProfile.target_valence,
      moodProfile.target_energy
    );

    // Provide a consistent wrapper for the payload because the MuSe/Spotify logic diverges
    // getRecommendationsFromGenre returns either [] (MuSe fallback) or { tracks: [] } (Spotify Search)
    if (Array.isArray(recommendationData) && recommendationData.length > 0) {
      recommendationData = { tracks: recommendationData, queryUsed: "MuSe Vibe Euclidean Search" };
    }

    // 3. Return the combined result for the frontend React Canvas
    res.json({
      mood: moodProfile,
      playlist: recommendationData.tracks,
      ml_confidence: moodProfile.confidence
    });
  } catch (error) {
    console.error('Error in text recommendations endpoint:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

app.listen(PORT, () => {
  console.log(`Mood Mosaic Server is running on port ${PORT}`);
});
