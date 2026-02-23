/**
 * Cosmetic Skins System
 */
import { trackEvent } from '@/lib/analytics';
import { getStreakData } from '@/lib/streaks';

export interface SkinDefinition {
  id: string;
  /** i18n key for name */
  nameKey: string;
  /** CSS color for green circles (HSL values without hsl()) */
  greenColor: string;
  /** CSS color for red circles */
  redColor: string;
  /** Optional glow override color */
  glowColor?: string;
  /** Unlock condition description i18n key */
  unlockKey: string;
  /** Check if this skin is unlocked */
  isUnlocked: () => boolean;
}

export const SKINS: SkinDefinition[] = [
  {
    id: 'default',
    nameKey: 'skin_default',
    greenColor: '',  // uses CSS variable default
    redColor: '',
    unlockKey: 'skin_default_unlock',
    isUnlocked: () => true,
  },
  {
    id: 'neon_blue',
    nameKey: 'skin_neon_blue',
    greenColor: '200 100% 55%',
    redColor: '30 100% 55%',
    glowColor: '200 100% 55%',
    unlockKey: 'skin_neon_blue_unlock',
    isUnlocked: () => getStreakData().best >= 7,
  },
  {
    id: 'cyber_purple',
    nameKey: 'skin_cyber_purple',
    greenColor: '270 100% 65%',
    redColor: '320 100% 60%',
    glowColor: '270 100% 65%',
    unlockKey: 'skin_cyber_purple_unlock',
    isUnlocked: () => getStreakData().best >= 14,
  },
  {
    id: 'crown_gold',
    nameKey: 'skin_crown_gold',
    greenColor: '45 100% 55%',
    redColor: '0 100% 45%',
    glowColor: '45 100% 55%',
    unlockKey: 'skin_crown_gold_unlock',
    isUnlocked: () => {
      // Unlocked if player has been in monthly top 10
      try {
        const badges = JSON.parse(localStorage.getItem('owt_badges') || '[]');
        return badges.includes('monthly_top10');
      } catch {
        return false;
      }
    },
  },
];

const STORAGE_KEY = 'owt_selected_skin';

export const getSelectedSkin = (): string => {
  return localStorage.getItem(STORAGE_KEY) || 'default';
};

export const setSelectedSkin = (id: string): void => {
  const prev = getSelectedSkin();
  localStorage.setItem(STORAGE_KEY, id);
  if (prev !== id) {
    trackEvent('skin_change', { from: prev, to: id });
  }
};

export const getActiveSkin = (): SkinDefinition => {
  const id = getSelectedSkin();
  const skin = SKINS.find(s => s.id === id);
  if (skin && skin.isUnlocked()) return skin;
  return SKINS[0]; // fallback to default
};
