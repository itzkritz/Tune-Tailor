import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

/**
 * Saves a generated mood entry to the Supabase database securely tied to a User ID.
 */
export async function saveMoodEntry(text, moodProfile, playlist, userId) {
  if (!userId) {
    console.warn("Attempted to save mood without an active User ID. Skipping DB save.");
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('mood_history')
      .insert([
        { 
          user_id: userId,
          journal_text: text,
          valence: moodProfile.target_valence,
          energy: moodProfile.target_energy,
          predicted_genre: moodProfile.predicted_genre,
          playlist: JSON.stringify(playlist.map(t => ({ name: t.name, artist: t.artists[0]?.name }))),
        }
      ]);
    
    if (error) console.error("Supabase Save Error:", error);
    return data;
  } catch (err) {
    console.error("Failed to save to Supabase:", err);
  }
}

/**
 * Fetches only the currently logged-in user's past mood entries.
 */
export async function fetchMoodHistory(userId) {
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('mood_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch Supabase history:", err);
    return [];
  }
}
