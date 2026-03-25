require('dotenv').config();
const { getSpotifyToken, getRecommendations } = require('./services/spotifyService');
const fs = require('fs');

async function testSpotify() {
  console.log("=== Testing Spotify Credentials ===");
  try {
    const token = await getSpotifyToken();
    console.log("Success! Fetched Token:", token.substring(0, 20) + "...");

    console.log("\n=== Testing Recommendations API ===");
    // Dummy values: valence 0.8 (happy), energy 0.8 (active), seed genres 'pop,dance'
    const tracksData = await getRecommendations(0.8, 0.8, 'pop,dance');
    console.log(`Success! Fetched ${tracksData.tracks.length} tracks.`);
    console.log("First track name:", tracksData.tracks[0].name);
    console.log("First track preview URL:", tracksData.tracks[0].preview_url);
    
  } catch (error) {
    if (error.response) {
      fs.writeFileSync('error.json', JSON.stringify({ status: error.response.status, data: error.response.data }, null, 2));
    } else {
      fs.writeFileSync('error.json', JSON.stringify({ message: error.message }, null, 2));
    }
    console.log("Wrote error.json");
  }
}

testSpotify();
