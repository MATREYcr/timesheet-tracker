'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { setApiLocale } from '@/lib/http';
import i18n from './i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Keep the API's Accept-Language in sync with the UI language.
    setApiLocale(i18n.resolvedLanguage ?? i18n.language);
    const onChange = (lng: string) => setApiLocale(lng);
    i18n.on('languageChanged', onChange);
    setMounted(true);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, []);

  // i18next detects the locale from localStorage on the client, which the server
  // can't know. Render only after mount so the first client paint matches the
  // server (default locale) and there's no hydration mismatch — fine here since
  // the app is fully client-rendered (data comes from TanStack Query).
  if (!mounted) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
