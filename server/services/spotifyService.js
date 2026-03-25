const axios = require('axios');

let cachedToken = null;
let tokenExpirationTime = null;

async function getSpotifyToken() {
  if (cachedToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials are not set in the environment variables.');
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const data = new URLSearchParams({ grant_type: 'client_credentials' });
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post(tokenUrl, data.toString(), {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    cachedToken = response.data.access_token;
    const expiresInMs = (response.data.expires_in - 300) * 1000;
    tokenExpirationTime = Date.now() + expiresInMs;
    return cachedToken;
  } catch (error) {
    console.error('Error fetching Spotify token:', error.response?.data || error.message);
    throw new Error('Failed to fetch Spotify access token');
  }
}

/**
 * Maps valence and energy to a Spotify Search Query based on emotional quadrants.
 * (Since Spotify deprecated the Audio Features and Recommendations APIs).
 */
const { getMuseTracksByVibe } = require('./museService');

/**
 * Fetches track recommendations by executing a targeted search mapping or by passing MuSe IDs!
 */
async function getRecommendationsFromGenre(predictedGenre, userSeedGenres = "", extractedKeywords = "", valence0to1 = 0.5, energy0to1 = 0.5) {
  const token = await getSpotifyToken();
  
  // PHASE 3 LOGIC: 
  // If the user DID NOT specify a language (like Hindi/Spanish), use the MuSe Dataset IDs for exact Vibe Matching!
  if (!extractedKeywords) {
      // Convert our 0-1 score to MuSe's 1-9 scale roughly
      const museValence = (valence0to1 * 8) + 1;
      const museArousal = (energy0to1 * 8) + 1;
      
      const museIds = getMuseTracksByVibe(museValence, museArousal, 10);
      if (museIds && museIds.length > 0) {
          // Fetch exact tracks using Spotify GET /tracks?ids=
          try {
              const response = await axios.get(`https://api.spotify.com/v1/tracks?ids=${museIds.join(',')}`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              return response.data.tracks;
          } catch(e) {
              console.error("MuSe ID fetch failed, falling back to search API...");
          }
      }
  }

  // FALLBACK OR LANGUAGE OVERRIDE: Use regular Spotify Search Engine
  const searchUrl = 'https://api.spotify.com/v1/search';
  try {
    let searchQuery = `genre:${predictedGenre}`;
    
    if (userSeedGenres) {
      const primarySeed = userSeedGenres.split(',')[0].trim();
      searchQuery = `genre:${primarySeed} OR ${searchQuery}`;
    }

    if (extractedKeywords) {
      searchQuery = `${searchQuery} ${extractedKeywords}`;
    }
    
    const randomOffset = Math.floor(Math.random() * 50);

    const response = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: searchQuery, type: 'track', limit: 10, offset: randomOffset }
    });

    const candidateTracks = response.data.tracks.items;
    return { tracks: candidateTracks, queryUsed: searchQuery };
  } catch (error) {
    console.error('Error fetching search recommendations from Spotify:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getSpotifyToken,
  getRecommendationsFromGenre
};
