/**
 * Daily Streak System
 */
import { trackEvent } from '@/lib/analytics';

const STORAGE_KEY = 'owt_streak';

interface StreakData {
  current: number;
  best: number;
  lastPlayDate: string; // YYYY-MM-DD
}

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getStreakData = (): StreakData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, best: 0, lastPlayDate: '' };
};

const saveStreak = (data: StreakData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

/**
 * Call after each game over to update daily streak.
 * Returns the updated streak data.
 */
export const updateStreak = (): StreakData => {
  const data = getStreakData();
  const today = getToday();
  const yesterday = getYesterday();

  if (data.lastPlayDate === today) {
    // Already played today, no change
    return data;
  }

  if (data.lastPlayDate === yesterday) {
    data.current += 1;
  } else {
    data.current = 1;
  }

  data.lastPlayDate = today;

  if (data.current > data.best) {
    data.best = data.current;
  }

  saveStreak(data);
  trackEvent('streak_update', { current: data.current, best: data.best });
  return data;
};
