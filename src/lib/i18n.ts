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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already safe from xss
    },
  });

export default i18n;
