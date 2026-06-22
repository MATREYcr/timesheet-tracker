import { weekStartSchema } from '@timesheet/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../common/types.js';
import { validate } from '../../middleware/validate.js';
import * as service from './dashboard.service.js';

const dashboardQuery = z.object({ weekStart: weekStartSchema });

export const dashboardRoutes = new Hono<AppEnv>().get(
  '/',
  validate('query', dashboardQuery),
  async (c) => {
    const { weekStart } = c.req.valid('query');
    return c.json(await service.getDashboard(weekStart));
  },
);
