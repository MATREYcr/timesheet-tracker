import { createInstance, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@timesheet/shared';
import en from './locales/en.json';
import es from './locales/es.json';

// A fresh i18next instance per request (server) / per mount (client), initialized
// directly in the given language. No shared singleton — so there's no cross-request
// race on the server and no need to mutate the language during render. Resources are
// bundled, so init runs synchronously and the instance is ready for the first paint.
export function createI18n(locale: Locale): I18n {
  const instance = createInstance();
  instance.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },
  });
  return instance;
}

export type { I18n };
