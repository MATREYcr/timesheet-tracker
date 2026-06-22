import { Hono } from 'hono';
import type { AppEnv } from '../common/types.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { employeesRoutes } from '../modules/employees/employees.routes.js';
import { timeEntriesRoutes } from '../modules/time-entries/time-entries.routes.js';
import { weeklySummaryRoutes } from '../modules/weekly-summary/weekly-summary.routes.js';

export const apiRoutes = new Hono<AppEnv>()
  .route('/dashboard', dashboardRoutes)
  .route('/employees', employeesRoutes)
  .route('/time-entries', timeEntriesRoutes)
  .route('/weekly-summary', weeklySummaryRoutes);
