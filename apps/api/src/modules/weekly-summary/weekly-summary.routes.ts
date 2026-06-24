import { createModuleApp } from '../../common/openapi.js';
import * as service from './weekly-summary.service.js';
import {
  approvalRoute,
  approveRoute,
  rejectRoute,
  summaryRoute,
} from './weekly-summary.openapi.js';

export const weeklySummaryRoutes = createModuleApp()
  .openapi(summaryRoute, async (c) => {
    const { weekStart, page, pageSize, employeeId } = c.req.valid('query');
    return c.json(
      await service.getWeeklySummary(weekStart, { page, pageSize }, employeeId),
      200,
    );
  })
  .openapi(approvalRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('query');
    return c.json(await service.getApprovalStatus(employeeId, weekStart), 200);
  })
  .openapi(approveRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.approveWeek(employeeId, weekStart), 200);
  })
  .openapi(rejectRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.rejectWeek(employeeId, weekStart), 200);
  });
