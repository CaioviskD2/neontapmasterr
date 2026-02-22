import pt, { type TranslationKey } from './pt';
import en from './en';
import { trackEvent } from '@/lib/analytics';

export type Language = 'pt' | 'en';

const translations: Record<Language, Record<TranslationKey, string>> = { pt, en };

const STORAGE_KEY = 'owt_language';

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored === 'pt' || stored === 'en') return stored;

  // Auto-detect from browser
  const browserLang = navigator.language || '';
  const detected: Language = browserLang.startsWith('pt') ? 'pt' : 'en';
  localStorage.setItem(STORAGE_KEY, detected);
  trackEvent('language_detected', { language: detected, browserLang });
  return detected;
}

let currentLang: Language = detectInitialLanguage();

export const getLanguage = (): Language => currentLang;

export const setLanguage = (lang: Language): void => {
  const prev = currentLang;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  if (prev !== lang) {
    trackEvent('language_change', { from: prev, to: lang });
  }
};

/**
 * Translate a key, with optional interpolation: t('key', { n: 5, sec: 60 })
 * Replaces {varName} in the translated string.
 */
export const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
  let text = translations[currentLang]?.[key] ?? translations.pt[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
};

export type { TranslationKey };
