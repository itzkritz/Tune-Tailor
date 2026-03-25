const fs = require('fs');
const path = require('path');

let museDataCache = [];

/**
 * Loads the 10MB MuSe dataset into memory for instantaneous vibe-matching.
 */
function loadMuseDataset() {
    if (museDataCache.length > 0) return;
    try {
        const filePath = path.join('C:', 'Users', 'ACER', 'OneDrive', 'Desktop', 'Tune Tailor', 'muse_dataset.csv');
        const csvText = fs.readFileSync(filePath, 'utf-8');
        
        const lines = csvText.split('\n');
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            // id,track,artist,valence_tags,arousal_tags,dominance_tags,mbid,spotify_id
            const fields = lines[i].split(',');
            // Handle quoting if necessary, but simple split usually works well enough to grab the last column
            const spotifyId = fields[fields.length - 1]?.trim();
            
            // Valence is usually index 3, Arousal index 4 (assuming no commas in track/artist)
            // A safer regex split for CSV:
            const safeFields = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || fields;
            
            // Just extract the numeric values blindly from the columns if possible, but simpler:
            // Since we know spotifyId is at the end, and valence/arousal are floats
            // We can just rely on the strict columns if format is clean.
            if (spotifyId && spotifyId.length > 10) {
                // Approximate indices:
                // fields[0]=id, 1=track, 2=artist, 3=valence, 4=arousal
                let v = parseFloat(fields[3]);
                let a = parseFloat(fields[4]);

                // If track name had commas, the columns shift. Find the first float.
                if (isNaN(v)) {
                   for(let j=2; j<fields.length; j++) {
                       if (!isNaN(parseFloat(fields[j])) && !isNaN(parseFloat(fields[j+1]))) {
                           v = parseFloat(fields[j]);
                           a = parseFloat(fields[j+1]);
                           break;
                       }
                   }
                }

                if (!isNaN(v) && !isNaN(a)) {
                    museDataCache.push({ spotifyId, valence: v, arousal: a });
                }
            }
        }
        console.log(`✅ Loaded ${museDataCache.length} valid MuSe ML tracks into Neural Cache!`);
    } catch (error) {
        console.error('Failed to load MuSe dataset:', error);
    }
}

/**
 * Picks 10 Tracks closest to the Target Valence (1-9) and Target Arousal (1-9)
 */
function getMuseTracksByVibe(targetValence1to9, targetArousal1to9, count = 10) {
    if (museDataCache.length === 0) loadMuseDataset();
    if (museDataCache.length === 0) return null;

    // Calculate Euclidean distance for all tracks to the target (V, A)
    const scored = museDataCache.map(t => {
        const dist = Math.sqrt(
            Math.pow(t.valence - targetValence1to9, 2) + Math.pow(t.arousal - targetArousal1to9, 2)
        );
        return { ...t, distance: dist };
    });

    // Sort by closest distance
    scored.sort((a, b) => a.distance - b.distance);
    
    // Pick from the top 50 closest to introduce randomness
    const topMatches = scored.slice(0, 50);
    
    // Shuffle the top 50
    for (let i = topMatches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [topMatches[i], topMatches[j]] = [topMatches[j], topMatches[i]];
    }

    return topMatches.slice(0, count).map(t => t.spotifyId);
}

module.exports = {
    loadMuseDataset,
    getMuseTracksByVibe
};
