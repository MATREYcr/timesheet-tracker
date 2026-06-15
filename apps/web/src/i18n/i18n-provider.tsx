'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { setApiLocale } from '@/lib/http';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from './config';
import { en, type Dictionary } from './en';
import { es } from './es';

const dictionaries: Record<Locale, Dictionary> = { en, es };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Restore the saved locale on mount (client-only).
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'es') setLocaleState(saved);
  }, []);

  // Keep the API's Accept-Language in sync so error messages match the UI.
  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  };

  return (
    <I18nContext.Provider
      value={{ locale, setLocale, t: dictionaries[locale] }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
