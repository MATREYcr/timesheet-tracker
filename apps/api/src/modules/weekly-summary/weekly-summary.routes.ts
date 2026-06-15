import { weekStartSchema, weeklyApprovalActionSchema } from '@timesheet/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../common/types.js';
import { validate } from '../../middleware/validate.js';
import * as service from './weekly-summary.service.js';

const summaryQuery = z.object({ weekStart: weekStartSchema });

export const weeklySummaryRoutes = new Hono<AppEnv>()
  .get('/', validate('query', summaryQuery), async (c) => {
    const { weekStart } = c.req.valid('query');
    return c.json(await service.getWeeklySummary(weekStart));
  })
  .post('/approve', validate('json', weeklyApprovalActionSchema), async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.approveWeek(employeeId, weekStart));
  })
  .post('/reject', validate('json', weeklyApprovalActionSchema), async (c) => {
    const { employeeId, weekStart } = c.req.valid('json');
    return c.json(await service.rejectWeek(employeeId, weekStart));
  });
