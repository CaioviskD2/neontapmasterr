/**
 * Quick Challenges — persistence & definitions
 */
import { t } from '@/i18n';

export interface ChallengeDefinition {
  id: string;
  /** i18n key for title */
  titleKey: string;
  /** i18n key for description */
  descKey: string;
  /** Interpolation params for the i18n keys */
  i18nParams: Record<string, string | number>;
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
    titleKey: 'ch_beat_n_in_sec',
    descKey: 'ch_beat_n_in_sec_desc',
    i18nParams: { n: 18, sec: 60 },
    totalTimeMs: 60_000,
    targetScore: 18,
    disableContinue: true,
  },
  {
    id: 'speed_tap_20s',
    titleKey: 'ch_speed_tap',
    descKey: 'ch_speed_tap_desc',
    i18nParams: { sec: 20 },
    totalTimeMs: 20_000,
    targetScore: 0,
    disableContinue: true,
  },
  {
    id: 'perfect_12',
    titleKey: 'ch_perfect_n',
    descKey: 'ch_perfect_n_desc',
    i18nParams: { n: 12 },
    totalTimeMs: 0,
    targetScore: 12,
    disableContinue: true,
  },
];

/** Get translated title for a challenge */
export const getChallengeTitle = (c: ChallengeDefinition): string =>
  t(c.titleKey as any, c.i18nParams);

/** Get translated description for a challenge */
export const getChallengeDesc = (c: ChallengeDefinition): string =>
  t(c.descKey as any, c.i18nParams);

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
