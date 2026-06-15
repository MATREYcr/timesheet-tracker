// List is query-based: GET /time-entries?employeeId=<uuid>&weekStart=<monday>.

import {
  createTimeEntrySchema,
  employeeIdSchema,
  updateTimeEntrySchema,
  weekStartSchema,
} from '@timesheet/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../common/types.js';
import { validate } from '../../common/validator.js';
import * as service from './time-entries.service.js';

const idParam = z.object({ id: z.uuid() });
const listQuery = z.object({
  employeeId: employeeIdSchema,
  weekStart: weekStartSchema.optional(),
});

export const timeEntriesRoutes = new Hono<AppEnv>()
  .get('/', validate('query', listQuery), async (c) => {
    const { employeeId, weekStart } = c.req.valid('query');
    return c.json(await service.listTimeEntries(employeeId, weekStart));
  })
  .post('/', validate('json', createTimeEntrySchema), async (c) => {
    const created = await service.createTimeEntry(c.req.valid('json'));
    return c.json(created, 201);
  })
  .patch(
    '/:id',
    validate('param', idParam),
    validate('json', updateTimeEntrySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      return c.json(await service.updateTimeEntry(id, c.req.valid('json')));
    },
  )
  .delete('/:id', validate('param', idParam), async (c) => {
    await service.deleteTimeEntry(c.req.valid('param').id);
    return c.body(null, 204);
  });
