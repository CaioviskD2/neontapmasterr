const KEYS = {
  HIGH_SCORE: 'owt_high_score',
  GAMES_PLAYED: 'owt_games_played',
} as const;

export const getHighScore = (): number => {
  return parseInt(localStorage.getItem(KEYS.HIGH_SCORE) || '0', 10);
};

export const setHighScore = (score: number) => {
  localStorage.setItem(KEYS.HIGH_SCORE, String(score));
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
