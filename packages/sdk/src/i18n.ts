import { Build } from "@stencil/core";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de.json";
import en from "./locales/en.json";
import { unidyState } from "./shared/store/unidy-store";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const t = (key: string, opts: any = {}) => i18n.t(key, opts, { lng: unidyState.locale });
