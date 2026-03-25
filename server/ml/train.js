const natural = require('natural');
const fs = require('fs');
const path = require('path');

// 1. Initialize the Classifier
const classifier = new natural.BayesClassifier();

console.log("Building Dataset...");

// 2. Add Training Data: [Text] -> [Genre Label]
// Happy / High Energy -> Pop / Dance
classifier.addDocument("I am feeling absolutely fantastic today! Everything is great.", "pop");
// --- 1. EXTENDED VOCABULARY BANK (90+ Unique Emotion Words) ---
const words = {
    positive: [
        'hyped', 'energetic', 'joyful', 'thrilled', 'productive', 'blessed', 'vibrant', 'alive', 'unstoppable', 
        'euphoric', 'radiant', 'gleeful', 'bubbly', 'inspired', 'optimistic', 'cheerful', 'electrified', 
        'magnificent', 'triumphant', 'motivated', 'empowered', 'fearless', 'harmonious', 'serene', 'adventurous',
        'bold', 'courageous', 'delighted', 'enthusiastic', 'exuberant', 'fantastic', 'grateful', 'invigorated',
        'jubilant', 'luminous', 'passionate', 'resilient', 'spirited', 'stunning', 'vivid', 'wonderful'
    ],
    negative: [
        'exhausted', 'gloomy', 'heartbroken', 'devastated', 'drained', 'lonely', 'miserable', 'anxious', 
        'irritated', 'heavy', 'empty', 'weary', 'defeated', 'stressed', 'overwhelmed', 'shattered', 
        'hopeless', 'furious', 'agitated', 'restless', 'burdened', 'fragile', 'worthless', 'bitter', 'cynical',
        'dejected', 'despair', 'disheartened', 'dreadful', 'forlorn', 'frustrated', 'melancholy', 'pessimistic',
        'resentful', 'somber', 'sorrowful', 'unhappy', 'fatigued', 'burned out', 'bad', 'mad', 'angry', 'upset', 'pissed'
    ],
    neutral: [
        'fine', 'okay', 'alright', 'chilled', 'mellow', 'stable', 'calm', 'quiet', 'ordinary', 'standard', 
        'peaceful', 'neutral', 'balanced', 'passive', 'composed', 'detached', 'indifferent', 'apathetic',
        'average', 'collected', 'content', 'easygoing', 'levelheaded', 'moderate', 'relaxed', 'soothing', 'soft'
    ],
    boosters: ['extremely', 'absolutely', 'insanely', 'totally', 'utterly', 'completely', 'incredibly', 'slightly', 'fairly', 'a bit', 'very'],
    transitions: ['but', 'however', 'yet', 'although', 'nevertheless', 'even though', 'nonetheless', 'still']
};

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// --- 2. THE GENRE MAPPER ---
function mapToGenre(score) {
    if (score >= 0.85) return randomChoice(['pop', 'dance', 'edm', 'techno', 'hyperpop']);
    if (score >= 0.65) return randomChoice(['indie pop', 'funk', 'disco', 'synthwave']);
    if (score >= 0.45) return randomChoice(['chill', 'chillhop', 'acoustic', 'r&b', 'jazz']);
    if (score >= 0.25) return randomChoice(['ambient', 'classical', 'soul', 'folk']);
    return randomChoice(['sad', 'lofi', 'blues', 'piano', 'melancholy']);
}

// --- 3. TEXT MORPHER ---
function morphText(text) {
    const style = randomChoice(['lower', 'upper', 'title', 'normal']);
    if (style === 'lower') return text.toLowerCase();
    if (style === 'upper') return text.toUpperCase();
    if (style === 'title') return text.replace(/\b\w/g, c => c.toUpperCase());
    return text;
}

// --- 4. DATA GENERATION ENGINE ---
console.log("Generating 5,000 advanced sentence permutations...");
const targetSize = 5000;

for (let i = 0; i < targetSize; i++) {
    const mode = randomChoice(['simple', 'contradictory', 'booster', 'complex', 'intent_heavy']);
    
    let rawText = "";
    let score = 0;

    if (mode === 'contradictory') {
        const stateWord = randomChoice(words.negative);
        const intentWord = randomChoice([...words.positive, ...words.neutral]); // Mix of happy or chill!
        const trans = randomChoice(words.transitions);
        
        const rawTexts = [
            `I am feeling ${stateWord} ${trans} I need to hear something ${intentWord}`,
            `im in a very bad mood ${trans} i want something ${intentWord}`,
            `my mood is ${stateWord} ${trans} i desire ${intentWord} music`,
            `feeling ${stateWord} ${trans} let's play something ${intentWord}`
        ];
        rawText = randomChoice(rawTexts);
        
        // If they want neutral (calm/chill), score is ~0.50. If positive (hyped), score is ~0.85.
        if (words.neutral.includes(intentWord)) {
            score = 0.45 + (Math.random() * 0.15); // Maps to Lofi / Acoustic / Chillhop
        } else {
            score = 0.70 + (Math.random() * 0.25); // Maps to Pop / EDM
        }
    } else if (mode === 'intent_heavy') {
        const stateWord = randomChoice(words.positive);
        const intentWord = randomChoice(words.negative);
        const trans = randomChoice(words.transitions);
        
        const rawTexts = [
            `The day was ${stateWord} ${trans} I still feel ${intentWord}`,
            `Even though things are ${stateWord} I am just so ${intentWord}`,
            `Everything is ${stateWord} ${trans} my heart is ${intentWord}`
        ];
        rawText = randomChoice(rawTexts);
        score = 0.05 + (Math.random() * 0.30); // Maps to Grunge / Dark Wave / Metal

    } else if (mode === 'booster') {
        const isPos = Math.random() > 0.5;
        const isNeutral = Math.random() > 0.8;
        const wordArr = isNeutral ? words.neutral : (isPos ? words.positive : words.negative);
        const word = randomChoice(wordArr);
        const boost = randomChoice(words.boosters);
        
        rawText = randomChoice([
            `I'm ${boost} ${word}`,
            `im feeling ${boost} ${word} today`,
            `i am in a ${boost} ${word} mood`
        ]);
        
        if (wordArr === words.neutral) score = 0.45 + (Math.random() * 0.2);
        else if (isPos) score = 0.8 + (Math.random() * 0.2);
        else score = Math.random() * 0.2;
    } else {
        const type = randomChoice(['positive', 'negative', 'neutral']);
        const word = randomChoice(words[type]);
        rawText = `Today has been ${word}`;
        score = type === 'positive' ? 0.7 + (Math.random() * 0.2) : type === 'negative' ? 0.1 + (Math.random() * 0.2) : 0.5;
    }

    const genre = mapToGenre(score);
    const finalTxt = morphText(rawText);
    classifier.addDocument(finalTxt, genre);
}

// --- 5. TRAIN AND SAVE ---
console.log("Training Bayesian Model on generated dataset...");
classifier.train();
classifier.save(path.join(__dirname, 'model.json'), function(err, classifier) {
    if (err) console.error("Error saving model:", err);
    else console.log("✅ Supercharged Model properly trained and saved to model.json!");
});
