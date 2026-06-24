import { HttpStatus } from '../../common/http-status.js';
import { createModuleApp } from '../../common/openapi.js';
import { dashboardRoute } from './dashboard.openapi.js';
import * as service from './dashboard.service.js';

export const dashboardRoutes = createModuleApp().openapi(
  dashboardRoute,
  async (c) => {
    const { weekStart } = c.req.valid('query');
    return c.json(await service.getDashboard(weekStart), HttpStatus.OK);
  },
);
