import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';

const resources = {
  en: { common: enCommon },
  es: { common: esCommon }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Constant base language for SSR hydration
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
