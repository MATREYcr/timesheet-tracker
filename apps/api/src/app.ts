// Builds the Hono app: global middleware, feature modules, and the central error
// handler. Exported as a factory so tests can spin up a fresh instance.

import { Hono } from 'hono';
import { localeMiddleware, type AppEnv } from './common/locale.middleware.js';
import { onError } from './common/on-error.js';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('*', localeMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Feature modules are mounted here (employees, time-entries, weekly-summary).

  app.onError(onError);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
