'use client';

import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALES, type Locale } from './config';

export function useLocale(): Locale {
  const { i18n } = useTranslation();
  const lng = (i18n.resolvedLanguage ?? i18n.language)?.split('-')[0];
  return LOCALES.includes(lng as Locale) ? (lng as Locale) : DEFAULT_LOCALE;
}
