'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { setApiLocale } from '@/lib/http';
import i18n from './i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Keep the API's Accept-Language in sync with the UI language.
    setApiLocale(i18n.resolvedLanguage ?? i18n.language);
    const onChange = (lng: string) => setApiLocale(lng);
    i18n.on('languageChanged', onChange);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
