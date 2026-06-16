import type { Locale } from '@/i18n/config';

const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES' };

/**
 * Currency is always USD. We format the number with each locale's grouping and
 * decimals via Intl, then prefix a literal "$" so the symbol stays in front for
 * both locales (en → $1,085.63, es → $1.085,63). Intl's es currency output would
 * otherwise rename/move the symbol ("1.085,63 US$").
 */
export function formatCurrency(amount: number, locale: Locale): string {
  const n = new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `$${n}`;
}

export function formatHours(hours: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 2,
  }).format(hours);
}
