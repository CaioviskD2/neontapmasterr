/**
 * Advanced Cosmetic Skins System
 */
import { trackEvent } from '@/lib/analytics';
import { getStreakData } from '@/lib/streaks';

export type SkinStyleType = 'solid' | 'gradient' | 'elite' | 'spectral';
export type TrailStyle = 'none' | 'solid' | 'gradient' | 'elite' | 'pulse' | 'spark' | 'shadow';

export interface SkinDefinition {
  id: string;
  nameKey: string;
  unlockKey: string;
  primaryColor: string;      // HSL values e.g. "200 100% 55%"
  secondaryColor?: string;   // optional gradient pair
  redColor: string;
  glowIntensity: 'low' | 'medium' | 'high';
  styleType: SkinStyleType;
  trailStyle: TrailStyle;
  trailColor?: string;       // HSL for trail particles
  isUnlocked: () => boolean;
  /** If true, skin is hidden from menu until unlocked */
  secret?: boolean;
}

const isChallengeCompleted = (id: string): boolean => {
  try {
    const completed = JSON.parse(localStorage.getItem('owt_challenges_completed') || '{}');
    return !!completed[id];
  } catch { return false; }
};

const hasBadge = (id: string): boolean => {
  try {
    const badges = JSON.parse(localStorage.getItem('owt_badges') || '[]');
    return badges.includes(id);
  } catch { return false; }
};

export const SKINS: SkinDefinition[] = [
  // ── Original Skins ────────────────────────────────
  {
    id: 'default',
    nameKey: 'skin_default',
    unlockKey: 'skin_default_unlock',
    primaryColor: '',
    redColor: '',
    glowIntensity: 'medium',
    styleType: 'solid',
    trailStyle: 'none',
    isUnlocked: () => true,
  },
  {
    id: 'electric_blue',
    nameKey: 'skin_electric_blue',
    unlockKey: 'skin_electric_blue_unlock',
    primaryColor: '200 100% 55%',
    redColor: '30 100% 55%',
    glowIntensity: 'high',
    styleType: 'solid',
    trailStyle: 'solid',
    trailColor: '200 100% 65%',
    isUnlocked: () => getStreakData().best >= 7,
  },
  {
    id: 'cyber_pulse',
    nameKey: 'skin_cyber_pulse',
    unlockKey: 'skin_cyber_pulse_unlock',
    primaryColor: '270 100% 65%',
    secondaryColor: '320 100% 60%',
    redColor: '0 80% 50%',
    glowIntensity: 'high',
    styleType: 'gradient',
    trailStyle: 'pulse',
    trailColor: '280 100% 70%',
    isUnlocked: () => getStreakData().best >= 14,
  },
  {
    id: 'plasma_core',
    nameKey: 'skin_plasma_core',
    unlockKey: 'skin_plasma_core_unlock',
    primaryColor: '160 100% 50%',
    secondaryColor: '220 100% 60%',
    redColor: '350 90% 50%',
    glowIntensity: 'high',
    styleType: 'gradient',
    trailStyle: 'gradient',
    trailColor: '180 100% 60%',
    isUnlocked: () => hasBadge('challenge_master'),
  },
  {
    id: 'crown_elite',
    nameKey: 'skin_crown_elite',
    unlockKey: 'skin_crown_elite_unlock',
    primaryColor: '45 100% 55%',
    secondaryColor: '35 100% 45%',
    redColor: '0 100% 45%',
    glowIntensity: 'high',
    styleType: 'elite',
    trailStyle: 'elite',
    trailColor: '45 100% 60%',
    isUnlocked: () => hasBadge('monthly_top10'),
  },

  // ── New Skins ─────────────────────────────────────
  {
    id: 'insane_survivor',
    nameKey: 'skin_insane_survivor',
    unlockKey: 'skin_insane_survivor_unlock',
    primaryColor: '0 100% 50%',
    secondaryColor: '350 100% 40%',
    redColor: '30 100% 50%',
    glowIntensity: 'high',
    styleType: 'gradient',
    trailStyle: 'pulse',
    trailColor: '0 100% 60%',
    isUnlocked: () => isChallengeCompleted('score_10_insane'),
  },
  {
    id: 'speed_demon',
    nameKey: 'skin_speed_demon',
    unlockKey: 'skin_speed_demon_unlock',
    primaryColor: '50 100% 55%',
    secondaryColor: '40 100% 45%',
    redColor: '0 90% 50%',
    glowIntensity: 'high',
    styleType: 'gradient',
    trailStyle: 'spark',
    trailColor: '50 100% 65%',
    isUnlocked: () => isChallengeCompleted('survive_20s_insane'),
  },
  {
    id: 'ghost_mode',
    nameKey: 'skin_ghost_mode',
    unlockKey: 'skin_ghost_mode_unlock',
    primaryColor: '220 30% 70%',
    secondaryColor: '240 20% 50%',
    redColor: '0 60% 45%',
    glowIntensity: 'low',
    styleType: 'spectral',
    trailStyle: 'shadow',
    trailColor: '220 20% 60%',
    isUnlocked: () => isChallengeCompleted('perfect_streak_3_insane'),
  },
  {
    id: 'secret_skin',
    nameKey: 'skin_secret',
    unlockKey: 'skin_secret_unlock',
    primaryColor: '280 100% 60%',
    secondaryColor: '320 100% 50%',
    redColor: '0 100% 50%',
    glowIntensity: 'high',
    styleType: 'elite',
    trailStyle: 'elite',
    trailColor: '290 100% 65%',
    secret: true,
    isUnlocked: () => isChallengeCompleted('secret_perfectionist'),
  },
];

/** Get skins visible in the menu (excludes secret skins unless unlocked) */
export const getVisibleSkins = (): SkinDefinition[] => {
  return SKINS.filter(s => !s.secret || s.isUnlocked());
};

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
  return SKINS[0];
};

/** Build CSS background for a circle based on skin style */
export const getCircleBg = (skin: SkinDefinition, isRed: boolean): string => {
  if (skin.id === 'default') return '';
  if (isRed) return `hsl(${skin.redColor})`;

  if (skin.styleType === 'spectral') {
    // Semi-transparent ghostly look
    if (skin.secondaryColor) {
      return `radial-gradient(circle at 35% 35%, hsla(${skin.primaryColor} / 0.6), hsla(${skin.secondaryColor} / 0.4))`;
    }
    return `hsla(${skin.primaryColor} / 0.5)`;
  }
  
  if ((skin.styleType === 'gradient' || skin.styleType === 'elite') && skin.secondaryColor) {
    return `radial-gradient(circle at 35% 35%, hsl(${skin.primaryColor}), hsl(${skin.secondaryColor}))`;
  }
  return `hsl(${skin.primaryColor})`;
};

/** Build CSS box-shadow glow for a circle */
export const getCircleGlow = (skin: SkinDefinition, isRed: boolean): string => {
  if (skin.id === 'default') return '';
  const color = isRed ? skin.redColor : skin.primaryColor;
  const intensity = skin.glowIntensity;
  const spread = intensity === 'high' ? 22 : intensity === 'medium' ? 12 : 6;
  const outerSpread = intensity === 'high' ? 45 : intensity === 'medium' ? 25 : 15;
  
  let shadow = `0 0 ${spread}px hsl(${color} / 0.7), 0 0 ${outerSpread}px hsl(${color} / 0.35)`;
  
  if (skin.styleType === 'elite' && !isRed) {
    shadow += `, inset 0 0 10px hsl(${color} / 0.5), 0 0 60px hsl(${color} / 0.2)`;
  }

  if (skin.styleType === 'spectral' && !isRed) {
    shadow = `0 0 ${spread}px hsla(${color} / 0.4), 0 0 ${outerSpread}px hsla(${color} / 0.15)`;
  }

  return shadow;
};

/** Build CSS border for elite/spectral skins */
export const getCircleBorder = (skin: SkinDefinition, isRed: boolean): string => {
  if (skin.styleType === 'elite' && !isRed) {
    return `2px solid hsl(${skin.primaryColor} / 0.8)`;
  }
  if (skin.styleType === 'spectral' && !isRed) {
    return `1px solid hsla(${skin.primaryColor} / 0.3)`;
  }
  return '';
};
