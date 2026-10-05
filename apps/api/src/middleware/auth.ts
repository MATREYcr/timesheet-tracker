import { createMiddleware } from 'hono/factory';
import { auth } from '@/auth';
import { AppError } from '@/common/errors';
import type { AppEnv } from '@/common/types';

// The API is the authority on sessions: the web's proxy only checks that a cookie exists.
export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!result) throw new AppError('UNAUTHORIZED');
  c.set('user', result.user);
  c.set('session', result.session);
  await next();
});
