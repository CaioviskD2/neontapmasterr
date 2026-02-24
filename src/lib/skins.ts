/**
 * Advanced Cosmetic Skins System
 */
import { trackEvent } from '@/lib/analytics';
import { getStreakData } from '@/lib/streaks';

export type SkinStyleType = 'solid' | 'gradient' | 'elite';
export type TrailStyle = 'none' | 'solid' | 'gradient' | 'elite' | 'pulse';

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
}

export const SKINS: SkinDefinition[] = [
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
    isUnlocked: () => {
      try {
        const badges = JSON.parse(localStorage.getItem('owt_badges') || '[]');
        return badges.includes('challenge_master');
      } catch { return false; }
    },
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
    isUnlocked: () => {
      try {
        const badges = JSON.parse(localStorage.getItem('owt_badges') || '[]');
        return badges.includes('monthly_top10');
      } catch { return false; }
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
  return SKINS[0];
};

/** Build CSS background for a circle based on skin style */
export const getCircleBg = (skin: SkinDefinition, isRed: boolean): string => {
  if (skin.id === 'default') return '';
  if (isRed) return `hsl(${skin.redColor})`;
  
  if (skin.styleType === 'gradient' && skin.secondaryColor) {
    return `linear-gradient(135deg, hsl(${skin.primaryColor}), hsl(${skin.secondaryColor}))`;
  }
  return `hsl(${skin.primaryColor})`;
};

/** Build CSS box-shadow glow for a circle */
export const getCircleGlow = (skin: SkinDefinition, isRed: boolean): string => {
  if (skin.id === 'default') return '';
  const color = isRed ? skin.redColor : skin.primaryColor;
  const intensity = skin.glowIntensity;
  const spread = intensity === 'high' ? 20 : intensity === 'medium' ? 12 : 6;
  const outerSpread = intensity === 'high' ? 40 : intensity === 'medium' ? 25 : 15;
  
  let shadow = `0 0 ${spread}px hsl(${color} / 0.6), 0 0 ${outerSpread}px hsl(${color} / 0.3)`;
  
  if (skin.styleType === 'elite' && !isRed) {
    shadow += `, inset 0 0 8px hsl(${color} / 0.4)`;
  }
  return shadow;
};

/** Build CSS border for elite skins */
export const getCircleBorder = (skin: SkinDefinition, isRed: boolean): string => {
  if (skin.styleType === 'elite' && !isRed) {
    return `2px solid hsl(${skin.primaryColor} / 0.8)`;
  }
  return '';
};
