import { Build } from "@stencil/core";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    debug: Build.isDev,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
  });

export default i18n;