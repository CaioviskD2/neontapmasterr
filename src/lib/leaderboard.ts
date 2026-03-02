import { supabase } from '@/integrations/supabase/client';
import { getDifficulty, type Difficulty } from '@/lib/difficulty';

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

export const fetchMonthlyLeaderboard = async (difficulty?: Difficulty): Promise<LeaderboardEntry[]> => {
  const diff = difficulty ?? getDifficulty();
  const seasonId = getCurrentMonth();
  const { data, error } = await supabase
    .from('season_scores')
    .select('id, nickname, best_score, updated_at')
    .eq('season_id', seasonId)
    .eq('difficulty', diff)
    .order('best_score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(100);

  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching monthly leaderboard:', error);
    return [];
  }
  return (data || []).map(d => ({
    id: d.id,
    nickname: d.nickname,
    score: d.best_score,
    created_at: d.updated_at,
  }));
};

export const fetchAllTimeLeaderboard = async (difficulty?: Difficulty): Promise<LeaderboardEntry[]> => {
  const diff = difficulty ?? getDifficulty();
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('difficulty', diff)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching all-time leaderboard:', error);
    return [];
  }
  return data || [];
};

export const fetchGlobalLeaderboard = fetchAllTimeLeaderboard;

export const submitScore = async (nickname: string, score: number, difficulty?: Difficulty): Promise<boolean> => {
  if (score <= 0 || nickname.trim().length < 3 || nickname.trim().length > 12) {
    return false;
  }

  const trimmed = nickname.trim();
  const diff = difficulty ?? getDifficulty();

  const { data: ltResult, error: ltError } = await supabase
    .rpc('submit_leaderboard_score', {
      p_nickname: trimmed,
      p_score: score,
      p_difficulty: diff,
    });

  if (ltError) {
    if (import.meta.env.DEV) console.error('Error submitting to all-time:', ltError);
    return false;
  }

  if (ltResult && !(ltResult as any).success) {
    if (import.meta.env.DEV) console.error('Leaderboard submission rejected:', (ltResult as any).reason);
    return false;
  }

  const { error: ssError } = await supabase
    .rpc('upsert_season_score', {
      p_season_id: getCurrentMonth(),
      p_nickname: trimmed,
      p_score: score,
      p_difficulty: diff,
    });

  if (ssError) {
    if (import.meta.env.DEV) console.error('Error upserting season score:', ssError);
  }

  return true;
};

export const getPlayerRankMonthly = async (score: number, difficulty?: Difficulty): Promise<number> => {
  const diff = difficulty ?? getDifficulty();
  const { count, error } = await supabase
    .from('season_scores')
    .select('*', { count: 'exact', head: true })
    .eq('season_id', getCurrentMonth())
    .eq('difficulty', diff)
    .gt('best_score', score);

  if (error) {
    if (import.meta.env.DEV) console.error('Error getting monthly rank:', error);
    return -1;
  }
  return (count || 0) + 1;
};

export const getPlayerRankAllTime = async (score: number, difficulty?: Difficulty): Promise<number> => {
  const diff = difficulty ?? getDifficulty();
  const { count, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .eq('difficulty', diff)
    .gt('score', score);

  if (error) {
    if (import.meta.env.DEV) console.error('Error getting all-time rank:', error);
    return -1;
  }
  return (count || 0) + 1;
};

export const getPlayerRank = getPlayerRankMonthly;

export const fetchClosedSeasons = async (): Promise<Season[]> => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'closed')
    .order('id', { ascending: false });

  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching seasons:', error);
    return [];
  }
  return (data || []) as Season[];
};

export const fetchSeasonResults = async (seasonId: string, difficulty?: Difficulty): Promise<SeasonResult[]> => {
  const diff = difficulty ?? getDifficulty();
  const { data, error } = await supabase
    .from('season_results')
    .select('*')
    .eq('season_id', seasonId)
    .eq('difficulty', diff)
    .order('rank', { ascending: true });

  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching season results:', error);
    return [];
  }
  return (data || []) as SeasonResult[];
};

export const fetchPlayerMedals = async (nickname: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching player medals:', error);
    return null;
  }
  return data;
};
