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

// Presence check only; the API is the authority and answers 401 for invalid sessions.
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
