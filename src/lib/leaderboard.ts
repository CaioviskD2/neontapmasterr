import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id?: string;
  nickname: string;
  score: number;
  country?: string;
  month?: string;
  created_at?: string;
}

export interface SeasonResult {
  season_id: string;
  rank: number;
  nickname: string;
  score: number;
  medal: string | null;
}

export interface Season {
  id: string;
  status: string;
  started_at: string;
  closed_at: string | null;
}

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Fetch monthly leaderboard (best score per player)
export const fetchMonthlyLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const seasonId = getCurrentMonth();
  const { data, error } = await supabase
    .from('season_scores')
    .select('id, nickname, best_score, updated_at')
    .eq('season_id', seasonId)
    .order('best_score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    return [];
  }
  return (data || []).map(d => ({
    id: d.id,
    nickname: d.nickname,
    score: d.best_score,
    created_at: d.updated_at,
  }));
};

// Fetch all-time leaderboard
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

export const fetchGlobalLeaderboard = fetchAllTimeLeaderboard;

// Submit score: saves to both leaderboard (all-time) and season_scores (monthly best)
export const submitScore = async (nickname: string, score: number): Promise<boolean> => {
  if (score <= 0 || nickname.trim().length < 3 || nickname.trim().length > 12) {
    return false;
  }

  const trimmed = nickname.trim();

  // All-time leaderboard (every score)
  const { error: ltError } = await supabase
    .from('leaderboard')
    .insert({ nickname: trimmed, score, month: getCurrentMonth() });

  if (ltError) {
    console.error('Error submitting to all-time:', ltError);
    return false;
  }

  // Season score (best only, via DB function)
  const { data, error: ssError } = await supabase
    .rpc('upsert_season_score', {
      p_season_id: getCurrentMonth(),
      p_nickname: trimmed,
      p_score: score,
    });

  if (ssError) {
    console.error('Error upserting season score:', ssError);
  }

  return true;
};

// Get monthly rank (from season_scores)
export const getPlayerRankMonthly = async (score: number): Promise<number> => {
  const { count, error } = await supabase
    .from('season_scores')
    .select('*', { count: 'exact', head: true })
    .eq('season_id', getCurrentMonth())
    .gt('best_score', score);

  if (error) {
    console.error('Error getting monthly rank:', error);
    return -1;
  }
  return (count || 0) + 1;
};

// Get all-time rank
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

export const getPlayerRank = getPlayerRankMonthly;

// Fetch closed seasons for Hall of Fame
export const fetchClosedSeasons = async (): Promise<Season[]> => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'closed')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
  return (data || []) as Season[];
};

// Fetch season results (frozen top 100)
export const fetchSeasonResults = async (seasonId: string): Promise<SeasonResult[]> => {
  const { data, error } = await supabase
    .from('season_results')
    .select('*')
    .eq('season_id', seasonId)
    .order('rank', { ascending: true });

  if (error) {
    console.error('Error fetching season results:', error);
    return [];
  }
  return (data || []) as SeasonResult[];
};

// Fetch player medals from DB
export const fetchPlayerMedals = async (nickname: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    console.error('Error fetching player medals:', error);
    return null;
  }
  return data;
};
