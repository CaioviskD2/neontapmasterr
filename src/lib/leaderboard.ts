import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id?: string;
  nickname: string;
  score: number;
  country?: string;
  created_at?: string;
}

// Fetch top 100 global scores
export const fetchGlobalLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  return data || [];
};

// Submit a score to global leaderboard
export const submitScore = async (nickname: string, score: number): Promise<boolean> => {
  if (score <= 0 || nickname.trim().length < 3 || nickname.trim().length > 12) {
    return false;
  }

  const { error } = await supabase
    .from('leaderboard')
    .insert({ nickname: nickname.trim(), score });

  if (error) {
    console.error('Error submitting score:', error);
    return false;
  }
  return true;
};

// Get player rank for a given score
export const getPlayerRank = async (score: number): Promise<number> => {
  const { count, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .gt('score', score);

  if (error) {
    console.error('Error getting rank:', error);
    return -1;
  }
  return (count || 0) + 1;
};
