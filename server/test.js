const { mapTextToSpotifyTargets, mapImageEmotionsToSpotifyTargets } = require('./services/sentimentService');

console.log("=== Text Sentiment Tests ===");
const texts = [
  "I am feeling absolutely fantastic today! Everything is great.",
  "This is the worst day of my life, I am so sad and angry.",
  "I am just sitting here, doing nothing. It's an okay day."
];

texts.forEach(text => {
  console.log(`\nText: "${text}"`);
  console.log(mapTextToSpotifyTargets(text));
});

console.log("\n=== Image Emotion Tests ===");
const emotions1 = { happy: 0.8, surprised: 0.1, neutral: 0.1 };
const emotions2 = { sad: 0.7, angry: 0.2, disgusted: 0.1 };

console.log("Emotions (Happy):", mapImageEmotionsToSpotifyTargets(emotions1));
console.log("Emotions (Sad/Angry):", mapImageEmotionsToSpotifyTargets(emotions2));
