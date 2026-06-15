// Resolves the locale once and stores it on the context for downstream handlers.

import { createMiddleware } from 'hono/factory';
import { parseAcceptLanguage } from './i18n.js';
import type { AppEnv } from './types.js';

export const localeMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  c.set('locale', parseAcceptLanguage(c.req.header('Accept-Language')));
  await next();
});
