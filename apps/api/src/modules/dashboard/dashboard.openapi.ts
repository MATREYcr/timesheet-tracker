import { createRoute, z } from '@hono/zod-openapi';
import { HttpStatus } from '../../common/http-status.js';
import {
  dashboardSummarySchema as dashboardShape,
  weekStartSchema,
  weeklySummaryRowSchema as weeklySummaryRowShape,
} from '@timesheet/shared';
import { jsonResponse } from '../../common/openapi.js';

const weeklySummaryRowSchema = weeklySummaryRowShape.openapi('WeeklySummaryRow');
const dashboardSummarySchema = z
  .object({ ...dashboardShape.shape, pending: z.array(weeklySummaryRowSchema) })
  .openapi('DashboardSummary');

export const dashboardRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Dashboard'],
  summary: '"This week" KPIs computed server-side',
  request: { query: z.object({ weekStart: weekStartSchema }) },
  responses: {
    [HttpStatus.OK]: jsonResponse(dashboardSummarySchema, 'Dashboard summary'),
  },
});
