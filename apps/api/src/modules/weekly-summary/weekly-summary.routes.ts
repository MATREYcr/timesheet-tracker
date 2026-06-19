import {
  employeeIdSchema,
  paginationQuerySchema,
  weekStartSchema,
  weeklyApprovalActionSchema,
} from '@timesheet/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../common/types.js';
import { validate } from '../../middleware/validate.js';
import * as service from './weekly-summary.service.js';

const summaryQuery = z
  .object({
    weekStart: weekStartSchema,
    employeeId: employeeIdSchema.optional(),
  })
  .extend(paginationQuerySchema.shape);

export const weeklySummaryRoutes = new Hono<AppEnv>()
  .get('/', validate('query', summaryQuery), async (c) => {
    const { weekStart, page, pageSize, employeeId } = c.req.valid('query');
    return c.json(
      await service.getWeeklySummary(weekStart, { page, pageSize }, employeeId),
    );
  })
  // Approval status for one (employee, week) — the web uses it to lock entries.
  .get('/approval', validate('query', weeklyApprovalActionSchema), async (c) => {
    const { employeeId, weekStart } = c.req.valid('query');
    return c.json(await service.getApprovalStatus(employeeId, weekStart));
  })
  .post('/approve', validate('json', weeklyApprovalActionSchema), async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.approveWeek(employeeId, weekStart));
  })
  .post('/reject', validate('json', weeklyApprovalActionSchema), async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.rejectWeek(employeeId, weekStart));
  });
