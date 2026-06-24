import { HttpStatus } from '@/common/http-status';
import { createModuleApp } from '@/common/openapi';
import { dashboardRoute } from './dashboard.openapi';
import * as service from './dashboard.service';

export const dashboardRoutes = createModuleApp().openapi(
  dashboardRoute,
  async (c) => {
    const { weekStart } = c.req.valid('query');
    return c.json(await service.getDashboard(weekStart), HttpStatus.OK);
  },
);
