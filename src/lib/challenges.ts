/**
 * Challenges System — Quick Challenges + Milestone Challenges
 */
import { t } from '@/i18n';
import { getHighScore } from '@/lib/storage';
import { getDifficulty, type Difficulty } from '@/lib/difficulty';
import { getGamesPlayed } from '@/lib/ads';
import { getStreakData } from '@/lib/streaks';

// ── Types ──────────────────────────────────────────────────────
export type ChallengeCategory = 'basic' | 'intermediate' | 'hardcore' | 'legendary';
export type ChallengeType = 'quick' | 'milestone';

export interface ChallengeDefinition {
  id: string;
  titleKey: string;
  descKey: string;
  i18nParams: Record<string, string | number>;
  category: ChallengeCategory;
  type: ChallengeType;
  /** For quick challenges — total time limit in ms */
  totalTimeMs: number;
  /** For quick challenges — target score */
  targetScore: number;
  /** For quick challenges — disable continue */
  disableContinue: boolean;
  /** For milestone challenges — auto-check function */
  checkCondition?: (ctx: MilestoneContext) => boolean;
  /** Skin ID unlocked by this challenge */
  unlocksSkin?: string;
  /** Icon emoji */
  icon?: string;
}

export interface MilestoneContext {
  score: number;
  difficulty: Difficulty;
  gamesPlayed: number;
  highScoreEasy: number;
  highScoreNormal: number;
  highScoreHard: number;
  highScoreInsane: number;
  monthlyRank: number;
  perfectGamesInsane: number;
  streakBest: number;
}

// ── Storage ────────────────────────────────────────────────────
const STORAGE_KEY = 'owt_challenges_completed';
const PROGRESS_KEY = 'owt_challenge_progress';
const INSANE_PERFECT_KEY = 'owt_insane_perfect_count';

export const getCompletedChallenges = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const markChallengeCompleted = (id: string): void => {
  const completed = getCompletedChallenges();
  completed[id] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
};

export const isChallengeCompleted = (id: string): boolean => {
  return !!getCompletedChallenges()[id];
};

// Progress tracking for specific challenges
export const getChallengeProgress = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
};

export const setChallengeProgress = (id: string, value: number): void => {
  const progress = getChallengeProgress();
  progress[id] = value;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

// Insane perfect game counter (games on insane where score > 0 without tapping red)
export const getInsanePerfectCount = (): number => {
  return parseInt(localStorage.getItem(INSANE_PERFECT_KEY) || '0', 10);
};

export const incrementInsanePerfectCount = (): void => {
  const count = getInsanePerfectCount() + 1;
  localStorage.setItem(INSANE_PERFECT_KEY, String(count));
};

// ── Challenge Definitions ──────────────────────────────────────

// Quick challenges (existing)
const QUICK_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'beat_18_in_60s',
    titleKey: 'ch_beat_n_in_sec',
    descKey: 'ch_beat_n_in_sec_desc',
    i18nParams: { n: 18, sec: 60 },
    category: 'intermediate',
    type: 'quick',
    totalTimeMs: 60_000,
    targetScore: 18,
    disableContinue: true,
    icon: '🎯',
  },
  {
    id: 'speed_tap_20s',
    titleKey: 'ch_speed_tap',
    descKey: 'ch_speed_tap_desc',
    i18nParams: { sec: 20 },
    category: 'intermediate',
    type: 'quick',
    totalTimeMs: 20_000,
    targetScore: 0,
    disableContinue: true,
    icon: '⚡',
  },
  {
    id: 'perfect_12',
    titleKey: 'ch_perfect_n',
    descKey: 'ch_perfect_n_desc',
    i18nParams: { n: 12 },
    category: 'intermediate',
    type: 'quick',
    totalTimeMs: 0,
    targetScore: 12,
    disableContinue: true,
    icon: '🏆',
  },
];

// Milestone challenges (new)
const MILESTONE_CHALLENGES: ChallengeDefinition[] = [
  // Basic
  {
    id: 'score_10_any_mode',
    titleKey: 'ch_score_10_any',
    descKey: 'ch_score_10_any_desc',
    i18nParams: {},
    category: 'basic',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '🎯',
    checkCondition: (ctx) => ctx.score >= 10,
  },
  {
    id: 'play_3_matches',
    titleKey: 'ch_play_3',
    descKey: 'ch_play_3_desc',
    i18nParams: {},
    category: 'basic',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '🎮',
    checkCondition: (ctx) => ctx.gamesPlayed >= 3,
  },
  {
    id: 'no_miss_5_rounds',
    titleKey: 'ch_no_miss_5',
    descKey: 'ch_no_miss_5_desc',
    i18nParams: {},
    category: 'basic',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '✨',
    checkCondition: (ctx) => ctx.score >= 5,
  },
  // Intermediate
  {
    id: 'score_25_normal',
    titleKey: 'ch_score_25_normal',
    descKey: 'ch_score_25_normal_desc',
    i18nParams: {},
    category: 'intermediate',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '💪',
    checkCondition: (ctx) => ctx.highScoreNormal >= 25,
  },
  {
    id: 'score_15_hard',
    titleKey: 'ch_score_15_hard',
    descKey: 'ch_score_15_hard_desc',
    i18nParams: {},
    category: 'intermediate',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '🔥',
    checkCondition: (ctx) => ctx.highScoreHard >= 15,
  },
  {
    id: 'no_continue_challenge',
    titleKey: 'ch_no_continue',
    descKey: 'ch_no_continue_desc',
    i18nParams: {},
    category: 'intermediate',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '🛡️',
    // Completed when any quick challenge is completed (they all disable continue)
    checkCondition: () => {
      const completed = getCompletedChallenges();
      return QUICK_CHALLENGES.some(c => completed[c.id]);
    },
  },
  // Hardcore
  {
    id: 'score_10_insane',
    titleKey: 'ch_score_10_insane',
    descKey: 'ch_score_10_insane_desc',
    i18nParams: {},
    category: 'hardcore',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '💀',
    unlocksSkin: 'insane_survivor',
    checkCondition: (ctx) => ctx.highScoreInsane >= 10,
  },
  {
    id: 'survive_20s_insane',
    titleKey: 'ch_survive_20s',
    descKey: 'ch_survive_20s_desc',
    i18nParams: {},
    category: 'hardcore',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '⏱️',
    unlocksSkin: 'speed_demon',
    // ~20s on insane requires ~15+ score (based on timing params)
    checkCondition: (ctx) => ctx.highScoreInsane >= 15,
  },
  {
    id: 'perfect_streak_3_insane',
    titleKey: 'ch_perfect_streak_3',
    descKey: 'ch_perfect_streak_3_desc',
    i18nParams: {},
    category: 'hardcore',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '👻',
    unlocksSkin: 'ghost_mode',
    checkCondition: (ctx) => ctx.perfectGamesInsane >= 3,
  },
  // Legendary
  {
    id: 'top_10_monthly',
    titleKey: 'ch_top_10_monthly',
    descKey: 'ch_top_10_monthly_desc',
    i18nParams: {},
    category: 'legendary',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '👑',
    unlocksSkin: 'crown_elite_v2',
    checkCondition: (ctx) => ctx.monthlyRank > 0 && ctx.monthlyRank <= 10,
  },
  {
    id: 'score_50_no_miss',
    titleKey: 'ch_score_50',
    descKey: 'ch_score_50_desc',
    i18nParams: {},
    category: 'legendary',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '🌟',
    checkCondition: (ctx) => ctx.score >= 50,
  },
];

// Secret challenge (not visible until unlocked)
const SECRET_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'secret_perfectionist',
    titleKey: 'ch_secret',
    descKey: 'ch_secret_desc',
    i18nParams: {},
    category: 'legendary',
    type: 'milestone',
    totalTimeMs: 0,
    targetScore: 0,
    disableContinue: false,
    icon: '🔮',
    unlocksSkin: 'secret_skin',
    checkCondition: (ctx) => ctx.perfectGamesInsane >= 20,
  },
];

export const CHALLENGES: ChallengeDefinition[] = [
  ...QUICK_CHALLENGES,
  ...MILESTONE_CHALLENGES,
  ...SECRET_CHALLENGES,
];

/** Get only quick challenges (launchable game modes) */
export const getQuickChallenges = (): ChallengeDefinition[] => QUICK_CHALLENGES;

/** Get visible challenges grouped by category */
export const getVisibleChallenges = (): ChallengeDefinition[] => {
  const completed = getCompletedChallenges();
  return CHALLENGES.filter(c => {
    // Secret challenges only visible when completed
    if (SECRET_CHALLENGES.some(s => s.id === c.id)) {
      return completed[c.id];
    }
    return true;
  });
};

/** Get challenges by category */
export const getChallengesByCategory = (category: ChallengeCategory): ChallengeDefinition[] => {
  return getVisibleChallenges().filter(c => c.category === category);
};

export const CATEGORY_ORDER: ChallengeCategory[] = ['basic', 'intermediate', 'hardcore', 'legendary'];

export const CATEGORY_LABELS: Record<ChallengeCategory, { en: string; pt: string; icon: string }> = {
  basic:        { en: 'BASIC',        pt: 'BÁSICO',        icon: '🟢' },
  intermediate: { en: 'INTERMEDIATE', pt: 'INTERMEDIÁRIO', icon: '🟡' },
  hardcore:     { en: 'HARDCORE',     pt: 'HARDCORE',      icon: '🔴' },
  legendary:    { en: 'LEGENDARY',    pt: 'LENDÁRIO',      icon: '💎' },
};

/** Get translated title for a challenge */
export const getChallengeTitle = (c: ChallengeDefinition): string =>
  t(c.titleKey as any, c.i18nParams);

/** Get translated description for a challenge */
export const getChallengeDesc = (c: ChallengeDefinition): string =>
  t(c.descKey as any, c.i18nParams);

/**
 * Check milestone challenges after a game.
 * Returns array of newly completed challenge IDs.
 */
export const checkMilestoneChallenges = (ctx: MilestoneContext): string[] => {
  const completed = getCompletedChallenges();
  const newlyCompleted: string[] = [];

  const allMilestones = [...MILESTONE_CHALLENGES, ...SECRET_CHALLENGES];

  for (const challenge of allMilestones) {
    if (completed[challenge.id]) continue;
    if (challenge.checkCondition && challenge.checkCondition(ctx)) {
      markChallengeCompleted(challenge.id);
      newlyCompleted.push(challenge.id);
    }
  }

  return newlyCompleted;
};

/** Build milestone context from current game state */
export const buildMilestoneContext = (
  score: number,
  monthlyRank: number,
): MilestoneContext => {
  return {
    score,
    difficulty: getDifficulty(),
    gamesPlayed: getGamesPlayed(),
    highScoreEasy: getHighScore('easy'),
    highScoreNormal: getHighScore('normal'),
    highScoreHard: getHighScore('hard'),
    highScoreInsane: getHighScore('insane'),
    monthlyRank,
    perfectGamesInsane: getInsanePerfectCount(),
    streakBest: getStreakData().best,
  };
};

/** Get progress info for a milestone challenge (for UI) */
export const getMilestoneProgress = (c: ChallengeDefinition): { current: number; target: number } | null => {
  if (c.type !== 'milestone') return null;

  switch (c.id) {
    case 'score_10_any_mode':
      return { current: Math.min(Math.max(getHighScore('easy'), getHighScore('normal'), getHighScore('hard'), getHighScore('insane')), 10), target: 10 };
    case 'play_3_matches':
      return { current: Math.min(getGamesPlayed(), 3), target: 3 };
    case 'no_miss_5_rounds':
      return { current: Math.min(Math.max(getHighScore('easy'), getHighScore('normal'), getHighScore('hard'), getHighScore('insane')), 5), target: 5 };
    case 'score_25_normal':
      return { current: Math.min(getHighScore('normal'), 25), target: 25 };
    case 'score_15_hard':
      return { current: Math.min(getHighScore('hard'), 15), target: 15 };
    case 'score_10_insane':
      return { current: Math.min(getHighScore('insane'), 10), target: 10 };
    case 'survive_20s_insane':
      return { current: Math.min(getHighScore('insane'), 15), target: 15 };
    case 'perfect_streak_3_insane':
      return { current: Math.min(getInsanePerfectCount(), 3), target: 3 };
    case 'top_10_monthly':
      return null; // Can't show partial progress
    case 'score_50_no_miss':
      return { current: Math.min(Math.max(getHighScore('easy'), getHighScore('normal'), getHighScore('hard'), getHighScore('insane')), 50), target: 50 };
    case 'secret_perfectionist':
      return { current: Math.min(getInsanePerfectCount(), 20), target: 20 };
    default:
      return null;
  }
};
