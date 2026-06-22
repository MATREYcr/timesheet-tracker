// Cookie that persists the UI language. Read on the server (root layout) to render
// the first HTML in the right language, written on the client (locale switch).
export const LOCALE_COOKIE = 'locale';

/** One year, in seconds. */
const ONE_YEAR = 60 * 60 * 24 * 365;

export function setLocaleCookie(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
}
