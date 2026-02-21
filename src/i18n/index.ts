import pt, { type TranslationKey } from './pt';
import en from './en';

export type Language = 'pt' | 'en';

const translations: Record<Language, Record<TranslationKey, string>> = { pt, en };

const STORAGE_KEY = 'owt_language';

let currentLang: Language = (localStorage.getItem(STORAGE_KEY) as Language) || 'pt';

export const getLanguage = (): Language => currentLang;

export const setLanguage = (lang: Language): void => {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
};

export const t = (key: TranslationKey): string =>
  translations[currentLang]?.[key] ?? translations.pt[key] ?? key;

export type { TranslationKey };
