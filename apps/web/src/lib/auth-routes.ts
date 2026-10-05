import { DEFAULT_LOCALE, type Locale } from '@timesheet/shared';

export const AUTH_PATHS = ['/login', '/register'] as const;
export const NEXT_PARAM = 'next';

export function isAuthPath(path: string): boolean {
  return (AUTH_PATHS as readonly string[]).includes(path);
}

/** Mirrors next-intl's `localePrefix: 'as-needed'`: the default locale has no prefix. */
export function localizedPath(locale: string, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** Only same-site relative paths ("/x"), never "//host" or "/\host", to block open redirects. */
export function safeNextPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.startsWith('/\\')
  ) {
    return '/';
  }
  return next;
}

export function loginPath(locale: Locale | string, next?: string): string {
  const base = localizedPath(locale, '/login');
  return next && next !== '/'
    ? `${base}?${NEXT_PARAM}=${encodeURIComponent(next)}`
    : base;
}
