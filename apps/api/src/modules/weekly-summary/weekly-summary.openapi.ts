import { createRoute, z } from '@hono/zod-openapi';
import { HttpStatus } from '@/common/http-status';
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
} from '@/common/openapi';

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
    [HttpStatus.OK]: jsonResponse(
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
    [HttpStatus.OK]: jsonResponse(
      weekApprovalStatusSchema,
      'Approval status (pending if no row)',
    ),
    [HttpStatus.NOT_FOUND]: errorResponse('Employee not found'),
  },
});

export const approveRoute = createRoute({
  method: 'post',
  path: '/approve',
  tags,
  summary: 'Approve a week (locks its entries)',
  request: jsonBody(weeklyApprovalActionSchema),
  responses: {
    [HttpStatus.OK]: jsonResponse(weekApprovalStatusSchema, 'Approved'),
    [HttpStatus.NOT_FOUND]: errorResponse('Employee not found'),
  },
});

export const rejectRoute = createRoute({
  method: 'post',
  path: '/reject',
  tags,
  summary: 'Reject a week (keeps it editable)',
  request: jsonBody(weeklyApprovalActionSchema),
  responses: {
    [HttpStatus.OK]: jsonResponse(weekApprovalStatusSchema, 'Rejected'),
    [HttpStatus.NOT_FOUND]: errorResponse('Employee not found'),
  },
});
