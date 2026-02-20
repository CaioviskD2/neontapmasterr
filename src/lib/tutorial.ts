/** Tutorial persistence helpers */

const KEY = 'owt_tutorial_completed';
const FIRST_GAME_KEY = 'owt_first_game_start_ts';

export const isTutorialCompleted = (): boolean =>
  localStorage.getItem(KEY) === 'true';

export const markTutorialCompleted = (): void =>
  localStorage.setItem(KEY, 'true');

/** Called when a real game starts — stores timestamp to detect quick death */
export const markFirstGameStart = (): void => {
  if (!localStorage.getItem(FIRST_GAME_KEY)) {
    localStorage.setItem(FIRST_GAME_KEY, String(Date.now()));
  }
};

/**
 * Returns true if this is the very first game AND the player died within 2s.
 * Clears the marker afterward so the hint only shows once.
 */
export const checkQuickDeath = (score: number): boolean => {
  const raw = localStorage.getItem(FIRST_GAME_KEY);
  if (!raw) return false;
  const elapsed = Date.now() - Number(raw);
  localStorage.removeItem(FIRST_GAME_KEY);
  return elapsed < 2000 && score === 0;
};
