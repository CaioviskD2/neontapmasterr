import { getDifficulty, type Difficulty } from '@/lib/difficulty';

const KEYS = {
  HIGH_SCORE: 'owt_high_score',
  GAMES_PLAYED: 'owt_games_played',
} as const;

const highScoreKey = (d?: Difficulty): string => {
  const diff = d ?? getDifficulty();
  return `${KEYS.HIGH_SCORE}_${diff}`;
};

export const getHighScore = (d?: Difficulty): number => {
  return parseInt(localStorage.getItem(highScoreKey(d)) || '0', 10);
};

export const setHighScore = (score: number, d?: Difficulty) => {
  localStorage.setItem(highScoreKey(d), String(score));
};

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  timestamp: number;
}

export const getLocalLeaderboard = (): LeaderboardEntry[] => {
  try {
    return JSON.parse(localStorage.getItem('owt_leaderboard') || '[]');
  } catch {
    return [];
  }
};

export const addToLocalLeaderboard = (entry: LeaderboardEntry) => {
  const lb = getLocalLeaderboard();
  lb.push(entry);
  lb.sort((a, b) => b.score - a.score || a.timestamp - b.timestamp);
  localStorage.setItem('owt_leaderboard', JSON.stringify(lb.slice(0, 100)));
};
