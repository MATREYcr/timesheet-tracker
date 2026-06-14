// Resolves the request locale from Accept-Language and stores it on the context,
// so the error handler (and anything else) can localize without re-parsing.

import { createMiddleware } from 'hono/factory';
import { parseAcceptLanguage } from './i18n.js';
import type { AppEnv } from './types.js';

export const localeMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  c.set('locale', parseAcceptLanguage(c.req.header('Accept-Language')));
  await next();
});
