'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { setApiLocale } from '@/lib/http';
import i18n from './i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = (lng: string) => {
      setApiLocale(lng);
      document.documentElement.lang = lng;
    };
    sync(i18n.resolvedLanguage ?? i18n.language);
    i18n.on('languageChanged', sync);
    setMounted(true);
    return () => {
      i18n.off('languageChanged', sync);
    };
  }, []);

  // i18next reads the locale from localStorage (client-only), so render after mount
  // to avoid a hydration mismatch. Safe here: the app is fully client-rendered.
  if (!mounted) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
