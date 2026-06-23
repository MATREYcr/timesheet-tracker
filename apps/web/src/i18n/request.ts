import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@timesheet/shared';
import { LOCALE_COOKIE } from './locale-cookie';
import en from './locales/en.json';
import es from './locales/es.json';

const messages = { en, es } satisfies Record<Locale, unknown>;

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: messages[locale],
  };
});
