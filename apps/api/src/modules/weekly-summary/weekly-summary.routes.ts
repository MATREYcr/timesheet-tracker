import { createRoute, z } from '@hono/zod-openapi';
import {
  employeeIdSchema,
  paginationQuerySchema,
  weekStartSchema,
  weeklyApprovalActionSchema,
} from '@timesheet/shared';
import {
  createModuleApp,
  errorResponse,
  jsonBody,
  jsonResponse,
  paginatedSchema,
  weekApprovalStatusSchema,
  weeklySummaryRowSchema,
} from '../../common/openapi.js';
import * as service from './weekly-summary.service.js';

const tags = ['Weekly summary'];

const summaryQuery = z
  .object({
    weekStart: weekStartSchema,
    employeeId: employeeIdSchema.optional(),
  })
  .extend(paginationQuerySchema.shape);

const summaryRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'Raw weekly aggregate per employee (client computes pay)',
  request: { query: summaryQuery },
  responses: {
    200: jsonResponse(
      paginatedSchema(weeklySummaryRowSchema, 'PaginatedWeeklySummary'),
      'Paginated weekly summary rows',
    ),
  },
});

const approvalRoute = createRoute({
  method: 'get',
  path: '/approval',
  tags,
  summary: 'Approval status of one (employee, week)',
  request: { query: weeklyApprovalActionSchema },
  responses: {
    200: jsonResponse(weekApprovalStatusSchema, 'Approval status (pending if no row)'),
    404: errorResponse('Employee not found'),
  },
});

const approveRoute = createRoute({
  method: 'post',
  path: '/approve',
  tags,
  summary: 'Approve a week (locks its entries)',
  request: jsonBody(weeklyApprovalActionSchema),
  responses: {
    200: jsonResponse(weekApprovalStatusSchema, 'Approved'),
    404: errorResponse('Employee not found'),
  },
});

const rejectRoute = createRoute({
  method: 'post',
  path: '/reject',
  tags,
  summary: 'Reject a week (keeps it editable)',
  request: jsonBody(weeklyApprovalActionSchema),
  responses: {
    200: jsonResponse(weekApprovalStatusSchema, 'Rejected'),
    404: errorResponse('Employee not found'),
  },
});

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
