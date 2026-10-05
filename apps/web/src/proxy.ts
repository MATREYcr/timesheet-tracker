import { getSessionCookie } from 'better-auth/cookies';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE } from '@timesheet/shared';
import { isAuthPath, localizedPath, loginPath } from './lib/auth-routes';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

function splitLocale(pathname: string): { locale: string; path: string } {
  const [, first, ...rest] = pathname.split('/');
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first, path: `/${rest.join('/')}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

// Optimistic gate: only checks that a session cookie exists (no DB/API call). The API is the
// authority — a stale cookie gets a 401 there and the client sends the user to login.
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);
  const hasSession = Boolean(getSessionCookie(request));
  const onAuthPage = isAuthPath(path);

  if (!hasSession && !onAuthPage) {
    return NextResponse.redirect(
      new URL(loginPath(locale, `${path}${search}`), request.url),
    );
  }
  if (hasSession && onAuthPage) {
    return NextResponse.redirect(
      new URL(localizedPath(locale, '/'), request.url),
    );
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
