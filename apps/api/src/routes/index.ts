import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@/common/types';
import { requireSession } from '@/middleware/auth';
import { dashboardRoutes } from '@/modules/dashboard/dashboard.routes';
import { employeesRoutes } from '@/modules/employees/employees.routes';
import { timeEntriesRoutes } from '@/modules/time-entries/time-entries.routes';
import { weeklySummaryRoutes } from '@/modules/weekly-summary/weekly-summary.routes';

// Scoped per module prefix (not '*') so /health, /openapi, /docs and /api/auth stay public.
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/employees',
  '/time-entries',
  '/weekly-summary',
];

export const apiRoutes = new OpenAPIHono<AppEnv>();
for (const prefix of PROTECTED_PREFIXES) {
  apiRoutes.use(prefix, requireSession).use(`${prefix}/*`, requireSession);
}

apiRoutes
  .route('/dashboard', dashboardRoutes)
  .route('/employees', employeesRoutes)
  .route('/time-entries', timeEntriesRoutes)
  .route('/weekly-summary', weeklySummaryRoutes);
