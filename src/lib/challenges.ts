/**
 * Quick Challenges — persistence & definitions
 */

export interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  /** Total time limit in ms (0 = no global timer, use per-round timer) */
  totalTimeMs: number;
  /** Target score to complete (0 = no target, just survive) */
  targetScore: number;
  /** Disable continue/rewarded for this challenge */
  disableContinue: boolean;
}

export const CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'beat_18_in_60s',
    title: 'BEAT 18 IN 60s',
    description: 'Score 18 points within 60 seconds',
    totalTimeMs: 60_000,
    targetScore: 18,
    disableContinue: true,
  },
  {
    id: 'speed_tap_20s',
    title: 'SPEED TAP 20s',
    description: 'Get the highest score in 20 seconds',
    totalTimeMs: 20_000,
    targetScore: 0,
    disableContinue: true,
  },
  {
    id: 'perfect_12',
    title: 'PERFECT 12',
    description: 'Score 12 points without any mistakes',
    totalTimeMs: 0,
    targetScore: 12,
    disableContinue: true,
  },
];

const STORAGE_KEY = 'owt_challenges_completed';

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
