import { HttpStatus } from '@/common/http-status';
import { createModuleApp } from '@/common/openapi';
import * as service from './weekly-summary.service';
import {
  approvalRoute,
  approveRoute,
  rejectRoute,
  summaryRoute,
} from './weekly-summary.openapi';

export const weeklySummaryRoutes = createModuleApp()
  .openapi(summaryRoute, async (c) => {
    const { weekStart, page, pageSize, employeeId } = c.req.valid('query');
    return c.json(
      await service.getWeeklySummary(weekStart, { page, pageSize }, employeeId),
      HttpStatus.OK,
    );
  })
  .openapi(approvalRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('query');
    return c.json(await service.getApprovalStatus(employeeId, weekStart), HttpStatus.OK);
  })
  .openapi(approveRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.approveWeek(employeeId, weekStart), HttpStatus.OK);
  })
  .openapi(rejectRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.rejectWeek(employeeId, weekStart), HttpStatus.OK);
  });
