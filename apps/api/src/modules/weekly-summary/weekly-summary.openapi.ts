import { createRoute, z } from '@hono/zod-openapi';
import {
  employeeIdSchema,
  paginationQuerySchema,
  weekApprovalStatusSchema as weekApprovalShape,
  weeklyApprovalActionSchema,
  weekStartSchema,
  weeklySummaryRowSchema as weeklySummaryRowShape,
} from '@timesheet/shared';
import {
  errorResponse,
  jsonBody,
  jsonResponse,
  paginatedSchema,
} from '../../common/openapi.js';

const weeklySummaryRowSchema = weeklySummaryRowShape.openapi('WeeklySummaryRow');
const weekApprovalStatusSchema = weekApprovalShape.openapi('WeekApprovalStatus');

const tags = ['Weekly summary'];

export const summaryRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'Raw weekly aggregate per employee (client computes pay)',
  request: {
    query: z
      .object({
        weekStart: weekStartSchema,
        employeeId: employeeIdSchema.optional(),
      })
      .extend(paginationQuerySchema.shape),
  },
  responses: {
    200: jsonResponse(
      paginatedSchema(weeklySummaryRowSchema, 'PaginatedWeeklySummary'),
      'Paginated weekly summary rows',
    ),
  },
});

export const approvalRoute = createRoute({
  method: 'get',
  path: '/approval',
  tags,
  summary: 'Approval status of one (employee, week)',
  request: { query: weeklyApprovalActionSchema },
  responses: {
    200: jsonResponse(
      weekApprovalStatusSchema,
      'Approval status (pending if no row)',
    ),
    404: errorResponse('Employee not found'),
  },
});

export const approveRoute = createRoute({
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

export const rejectRoute = createRoute({
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
