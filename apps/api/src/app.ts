// Factory so tests can spin up a fresh instance.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './config/env.js';
import { localeMiddleware } from './common/locale.middleware.js';
import { onError } from './common/on-error.js';
import type { AppEnv } from './common/types.js';
import { apiRoutes } from './routes/index.js';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  app.use('*', cors({ origin: env.CORS_ORIGIN }));
  app.use('*', localeMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/', apiRoutes);

  app.onError(onError);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
