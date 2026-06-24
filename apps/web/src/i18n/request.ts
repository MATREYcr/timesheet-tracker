import { getRequestConfig } from 'next-intl/server';
import { type Locale } from '@timesheet/shared';
import { routing } from './routing';
import en from './locales/en.json';
import es from './locales/es.json';

const messages = { en, es } satisfies Record<Locale, unknown>;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: messages[locale as Locale],
  };
});
