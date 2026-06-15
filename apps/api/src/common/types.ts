import type { Locale } from './i18n.js';

/**
 * The Hono environment for this app: typed variables that middleware sets on the
 * request context (so handlers and the error handler can read them type-safely).
 */
export type AppEnv = {
  Variables: {
    locale: Locale;
  };
};
