import { createMiddleware } from 'hono/factory';
import { auth } from '@/auth';
import { AppError } from '@/common/errors';
import type { AppEnv } from '@/common/types';

// The API is the authority on sessions: the web's proxy only checks that a cookie exists.
export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const { headers, response } = await auth.api.getSession({
    headers: c.req.raw.headers,
    returnHeaders: true,
  });
  if (!response) {
    // Forward Better Auth's cookie-expiry headers so a stale cookie is dropped; otherwise the
    // web proxy would keep treating the visitor as signed in and bounce them off /login.
    for (const cookie of headers.getSetCookie()) {
      c.header('set-cookie', cookie, { append: true });
    }
    throw new AppError('UNAUTHORIZED');
  }
  c.set('user', response.user);
  c.set('session', response.session);
  await next();
});
