const natural = require('natural');
const path = require('path');

let classifier = null;

// Synchronously load the compiled Machine Learning model on startup
const modelPath = path.join(__dirname, '../ml/model.json');
natural.BayesClassifier.load(modelPath, null, function(err, loadedClassifier) {
  if (err) {
    console.error('Failed to load ML model:', err);
  } else {
    classifier = loadedClassifier;
    console.log('Successfully loaded Custom NLP Mood Model!');
  }
});

/**
 * Maps unstructured user text to a specific Spotify genre using the trained ML Model.
 * Also extracts explicit language or cultural keywords to target the Spotify Search.
 * @param {string} text - The unstructured user input text.
 * @returns {object} - An object containing predicted genre, keywords, and ML confidence.
 */
function predictGenreFromText(text) {
  if (!classifier) {
    throw new Error('ML Model is still loading or failed to load.');
  }
  
  // 1. Predict the exact class using our custom trained dataset
  const predictedGenre = classifier.classify(text);
  
  // 2. Extract cultural/language modifiers explicitly requested by the user
  const lowerText = text.toLowerCase();
  const modifiers = [];
  if (lowerText.includes('hindi') || lowerText.includes('bollywood') || lowerText.includes('punjabi')) modifiers.push('hindi');
  if (lowerText.includes('spanish') || lowerText.includes('latin')) modifiers.push('spanish');
  if (lowerText.includes('kpop') || lowerText.includes('korean')) modifiers.push('k-pop');
  if (lowerText.includes('anime') || lowerText.includes('japanese')) modifiers.push('anime');
  if (lowerText.includes('classic') || lowerText.includes('old')) modifiers.push('classic');

  // We can also extract the probability to simulate Valence/Energy for the UI Card
  const classifications = classifier.getClassifications(text);
  const bestMatch = classifications.find(c => c.label === predictedGenre);

  // Derive pseudo-valence/energy from the category for the visual Card UI
  let target_valence = 0.5;
  let target_energy = 0.5;

  if (predictedGenre === 'pop' || predictedGenre === 'dance') {
    target_valence = 0.8; target_energy = 0.9;
  } else if (predictedGenre === 'chill' || predictedGenre === 'acoustic') {
    target_valence = 0.6; target_energy = 0.3;
  } else if (predictedGenre === 'sad' || predictedGenre === 'lofi') {
    target_valence = 0.2; target_energy = 0.2;
  } else if (predictedGenre === 'metal' || predictedGenre === 'rock') {
    target_valence = 0.3; target_energy = 0.9;
  }

  return {
    predicted_genre: predictedGenre,
    extracted_keywords: modifiers.join(' '),
    confidence: bestMatch ? bestMatch.value : 1.0,
    target_valence,
    target_energy
  };
}

module.exports = {
  predictGenreFromText
};
