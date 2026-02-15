import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id?: string;
  nickname: string;
  score: number;
  country?: string;
  month?: string;
  created_at?: string;
}

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Fetch top 100 monthly scores
export const fetchMonthlyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('month', getCurrentMonth())
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return [];
  }
  return data || [];
};

// Fetch top 100 all-time scores
export const fetchAllTimeLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching all-time leaderboard:', error);
    return [];
  }
  return data || [];
};

// Legacy alias
export const fetchGlobalLeaderboard = fetchAllTimeLeaderboard;

// Submit a score to leaderboard (auto-includes current month)
export const submitScore = async (nickname: string, score: number): Promise<boolean> => {
  if (score <= 0 || nickname.trim().length < 3 || nickname.trim().length > 12) {
    return false;
  }

  const { error } = await supabase
    .from('leaderboard')
    .insert({ nickname: nickname.trim(), score, month: getCurrentMonth() });

  if (error) {
    console.error('Error submitting score:', error);
    return false;
  }
  return true;
};

// Get player rank for a given score (monthly)
export const getPlayerRankMonthly = async (score: number): Promise<number> => {
  const { count, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .eq('month', getCurrentMonth())
    .gt('score', score);

  if (error) {
    console.error('Error getting monthly rank:', error);
    return -1;
  }
  return (count || 0) + 1;
};

// Get player rank for a given score (all-time)
export const getPlayerRankAllTime = async (score: number): Promise<number> => {
  const { count, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .gt('score', score);

  if (error) {
    console.error('Error getting all-time rank:', error);
    return -1;
  }
  return (count || 0) + 1;
};

// Legacy alias - now uses monthly for crown/top10 logic
export const getPlayerRank = getPlayerRankMonthly;
