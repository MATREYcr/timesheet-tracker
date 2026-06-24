import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/common/types';
import { dashboardRoutes } from '@/modules/dashboard/dashboard.routes';
import { employeesRoutes } from '@/modules/employees/employees.routes';
import { timeEntriesRoutes } from '@/modules/time-entries/time-entries.routes';
import { weeklySummaryRoutes } from '@/modules/weekly-summary/weekly-summary.routes';

export const apiRoutes = new OpenAPIHono<AppEnv>()
  .route('/dashboard', dashboardRoutes)
  .route('/employees', employeesRoutes)
  .route('/time-entries', timeEntriesRoutes)
  .route('/weekly-summary', weeklySummaryRoutes);
