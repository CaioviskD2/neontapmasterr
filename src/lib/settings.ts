/**
 * App settings — persistence helpers
 */

export type Theme = 'green' | 'blue' | 'purple';

export interface AppSettings {
  soundOn: boolean;
  vibrationOn: boolean;
  selectedTheme: Theme;
}

const KEY = 'owt_settings';

const defaults: AppSettings = {
  soundOn: true,
  vibrationOn: true,
  selectedTheme: 'green',
};

export const getSettings = (): AppSettings => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...defaults, ...stored };
  } catch {
    return { ...defaults };
  }
};

export const saveSettings = (s: Partial<AppSettings>): void => {
  const current = getSettings();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...s }));
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
};
