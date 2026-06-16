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

// Date-only strings are parsed as UTC and formatted with timeZone UTC, so the day
// never shifts across timezones (same rule as the shared date helpers).
function parseUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(
  date: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  },
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    ...options,
    timeZone: 'UTC',
  }).format(parseUtc(date));
}

/** Compact range label for a Monday–Sunday week, e.g. "Jun 16 – 22, 2026". */
export function formatWeekRange(
  weekStart: string,
  weekEnd: string,
  locale: Locale,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(parseUtc(weekStart), parseUtc(weekEnd));
}
