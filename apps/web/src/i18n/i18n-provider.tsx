'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { setApiLocale } from '@/lib/http';
import type { I18n } from './i18n';

export function I18nProvider({
  i18n,
  children,
}: {
  i18n: I18n;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Keep the API's Accept-Language and the <html lang> in sync with the UI language.
    const sync = (lng: string) => {
      setApiLocale(lng);
      document.documentElement.lang = lng;
    };
    sync(i18n.resolvedLanguage ?? i18n.language);
    i18n.on('languageChanged', sync);
    return () => {
      i18n.off('languageChanged', sync);
    };
  }, [i18n]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
