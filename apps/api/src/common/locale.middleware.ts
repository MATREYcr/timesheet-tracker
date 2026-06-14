// Resolves the request locale from Accept-Language and stores it on the context,
// so the error handler (and anything else) can localize without re-parsing.

import { createMiddleware } from 'hono/factory';
import { parseAcceptLanguage, type Locale } from './i18n.js';

export type AppEnv = {
  Variables: {
    locale: Locale;
  };
};

export const localeMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  c.set('locale', parseAcceptLanguage(c.req.header('Accept-Language')));
  await next();
});
