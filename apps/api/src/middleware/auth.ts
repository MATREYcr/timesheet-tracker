import { createMiddleware } from 'hono/factory';
import { auth } from '@/auth';
import { AppError } from '@/common/errors';
import type { AppEnv } from '@/common/types';

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const { headers, response } = await auth.api.getSession({
    headers: c.req.raw.headers,
    returnHeaders: true,
  });
  if (!response) {
    // Expire the stale cookie, or the web proxy keeps redirecting away from /login.
    for (const cookie of headers.getSetCookie()) {
      c.header('set-cookie', cookie, { append: true });
    }
    throw new AppError('UNAUTHORIZED');
  }
  c.set('user', response.user);
  c.set('session', response.session);
  await next();
});
