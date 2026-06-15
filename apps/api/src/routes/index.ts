// Aggregates every feature module router into a single API router. app.ts mounts
// this once, keeping app-level concerns (middleware, health, error handling)
// separate from route wiring. Adding a feature = one line here.

import { Hono } from 'hono';
import type { AppEnv } from '../common/types.js';
import { employeesRoutes } from '../modules/employees/employees.routes.js';
import { timeEntriesRoutes } from '../modules/time-entries/time-entries.routes.js';
import { weeklySummaryRoutes } from '../modules/weekly-summary/weekly-summary.routes.js';

export const apiRoutes = new Hono<AppEnv>()
  .route('/employees', employeesRoutes)
  .route('/time-entries', timeEntriesRoutes)
  .route('/weekly-summary', weeklySummaryRoutes);
