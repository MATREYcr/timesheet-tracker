// Builds the Hono app: global middleware, feature modules, and the central error
// handler. Exported as a factory so tests can spin up a fresh instance.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './config/env.js';
import { localeMiddleware, type AppEnv } from './common/locale.middleware.js';
import { onError } from './common/on-error.js';
import { employeesRoutes } from './modules/employees/employees.routes.js';
import { timeEntriesRoutes } from './modules/time-entries/time-entries.routes.js';
import { weeklySummaryRoutes } from './modules/weekly-summary/weekly-summary.routes.js';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use('*', logger());
  app.use('*', cors({ origin: env.CORS_ORIGIN }));
  app.use('*', localeMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/employees', employeesRoutes);
  app.route('/time-entries', timeEntriesRoutes);
  app.route('/weekly-summary', weeklySummaryRoutes);

  app.onError(onError);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
