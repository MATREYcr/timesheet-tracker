import { createRoute, z } from '@hono/zod-openapi';
import { weekStartSchema } from '@timesheet/shared';
import {
  createModuleApp,
  dashboardSummarySchema,
  jsonResponse,
} from '../../common/openapi.js';
import * as service from './dashboard.service.js';

const dashboardRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Dashboard'],
  summary: '"This week" KPIs computed server-side',
  request: { query: z.object({ weekStart: weekStartSchema }) },
  responses: {
    200: jsonResponse(dashboardSummarySchema, 'Dashboard summary'),
  },
});

export const dashboardRoutes = createModuleApp().openapi(
  dashboardRoute,
  async (c) => {
    const { weekStart } = c.req.valid('query');
    return c.json(await service.getDashboard(weekStart), 200);
  },
);
