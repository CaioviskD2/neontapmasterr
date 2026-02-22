/**
 * Difficulty system for One Wrong Tap
 */
import { trackEvent } from '@/lib/analytics';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';

export interface DifficultyConfig {
  initialTimeMs: number;
  minTimeMs: number;
  timeDecreasePerPoint: number;
  circleStepPoints: number;
}

const CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    initialTimeMs: 2200,
    minTimeMs: 900,
    timeDecreasePerPoint: 25,
    circleStepPoints: 6,
  },
  normal: {
    initialTimeMs: 2000,
    minTimeMs: 800,
    timeDecreasePerPoint: 30,
    circleStepPoints: 5,
  },
  hard: {
    initialTimeMs: 1700,
    minTimeMs: 700,
    timeDecreasePerPoint: 40,
    circleStepPoints: 4,
  },
  insane: {
    initialTimeMs: 1500,
    minTimeMs: 600,
    timeDecreasePerPoint: 50,
    circleStepPoints: 3,
  },
};

const STORAGE_KEY = 'owt_difficulty';

export const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'insane'];

export const getDifficulty = (): Difficulty => {
  const stored = localStorage.getItem(STORAGE_KEY) as Difficulty | null;
  if (stored && stored in CONFIGS) return stored;
  return 'normal';
};

export const setDifficulty = (d: Difficulty): void => {
  const prev = getDifficulty();
  localStorage.setItem(STORAGE_KEY, d);
  if (prev !== d) {
    trackEvent('difficulty_change', { from: prev, to: d });
  }
};

export const getDifficultyConfig = (d?: Difficulty): DifficultyConfig => {
  return CONFIGS[d ?? getDifficulty()];
};

export const getMaxTimeForScore = (score: number, d?: Difficulty): number => {
  const cfg = getDifficultyConfig(d);
  return Math.max(cfg.minTimeMs, cfg.initialTimeMs - score * cfg.timeDecreasePerPoint);
};

export const getCircleCountForScore = (score: number, d?: Difficulty): number => {
  const cfg = getDifficultyConfig(d);
  return 3 + Math.floor(score / cfg.circleStepPoints);
};
