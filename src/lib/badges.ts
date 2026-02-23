/**
 * Badge / Achievement System
 */
import { trackEvent } from '@/lib/analytics';
import { getHighScore } from '@/lib/storage';
import { getStreakData } from '@/lib/streaks';
import { getCompletedChallenges, CHALLENGES } from '@/lib/challenges';
import { getDifficulty } from '@/lib/difficulty';

export interface BadgeDefinition {
  id: string;
  /** i18n key for display name */
  nameKey: string;
  /** i18n key for description */
  descKey: string;
  /** emoji icon */
  icon: string;
}

export const BADGES: BadgeDefinition[] = [
  { id: 'score_50',       nameKey: 'badge_score_50',       descKey: 'badge_score_50_desc',       icon: '🎯' },
  { id: 'score_100',      nameKey: 'badge_score_100',      descKey: 'badge_score_100_desc',      icon: '💯' },
  { id: 'insane_20',      nameKey: 'badge_insane_20',      descKey: 'badge_insane_20_desc',      icon: '💀' },
  { id: 'streak_3',       nameKey: 'badge_streak_3',       descKey: 'badge_streak_3_desc',       icon: '🔥' },
  { id: 'streak_7',       nameKey: 'badge_streak_7',       descKey: 'badge_streak_7_desc',       icon: '⚡' },
  { id: 'monthly_top10',  nameKey: 'badge_monthly_top10',  descKey: 'badge_monthly_top10_desc',  icon: '⭐' },
  { id: 'challenge_master', nameKey: 'badge_challenge_master', descKey: 'badge_challenge_master_desc', icon: '🏆' },
];

const STORAGE_KEY = 'owt_badges';

export const getUnlockedBadges = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveBadges = (badges: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
};

export const isBadgeUnlocked = (id: string): boolean => {
  return getUnlockedBadges().includes(id);
};

/**
 * Check and unlock badges after a game over.
 * @param score - the score from the game that just ended
 * @param monthlyRank - player's current monthly rank (0 = not ranked)
 * @returns array of newly unlocked badge IDs
 */
export const checkAndUnlockBadges = (score: number, monthlyRank: number): string[] => {
  const unlocked = getUnlockedBadges();
  const newlyUnlocked: string[] = [];

  const tryUnlock = (id: string, condition: boolean) => {
    if (!unlocked.includes(id) && condition) {
      newlyUnlocked.push(id);
    }
  };

  const highScore = Math.max(getHighScore(), score);
  const streak = getStreakData();
  const completedChallenges = getCompletedChallenges();
  const allChallengesDone = CHALLENGES.every(c => completedChallenges[c.id]);

  tryUnlock('score_50', highScore >= 50);
  tryUnlock('score_100', highScore >= 100);
  tryUnlock('insane_20', getDifficulty() === 'insane' && score >= 20);
  tryUnlock('streak_3', streak.current >= 3 || streak.best >= 3);
  tryUnlock('streak_7', streak.current >= 7 || streak.best >= 7);
  tryUnlock('monthly_top10', monthlyRank > 0 && monthlyRank <= 10);
  tryUnlock('challenge_master', allChallengesDone);

  if (newlyUnlocked.length > 0) {
    const all = [...unlocked, ...newlyUnlocked];
    saveBadges(all);
    newlyUnlocked.forEach(id => {
      trackEvent('badge_unlocked', { badge_id: id });
    });
  }

  return newlyUnlocked;
};

export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return BADGES.find(b => b.id === id);
};
