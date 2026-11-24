import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pt from '../locales/pt/common.json';
import en from '../locales/en/common.json';
import es from '../locales/es/common.json';

const resources = {
  pt: { common: pt },
  en: { common: en },
  es: { common: es },
};

const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANGUAGE_STORAGE_KEY = 'juhasmoney_language';

function detectInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
    if (import.meta.env.MODE !== 'test' && typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0].toLowerCase();
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(browserLang)) {
        return browserLang as SupportedLanguage;
      }
    }
  } catch {
    // Fallback if localStorage is blocked
  }
  return 'pt';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
  });

export default i18n;
