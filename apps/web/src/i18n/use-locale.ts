'use client';

import { useLocale as useNextIntlLocale } from 'next-intl';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@timesheet/shared';

export function useLocale(): Locale {
  const lng = useNextIntlLocale();
  return LOCALES.includes(lng as Locale) ? (lng as Locale) : DEFAULT_LOCALE;
}
