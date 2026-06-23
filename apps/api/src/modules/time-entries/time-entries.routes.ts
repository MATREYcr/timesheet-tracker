import { createRoute, z } from '@hono/zod-openapi';
import {
  createTimeEntrySchema,
  employeeIdSchema,
  updateTimeEntrySchema,
  weekStartSchema,
} from '@timesheet/shared';
import {
  createModuleApp,
  errorResponse,
  idParam,
  jsonBody,
  jsonResponse,
  timeEntrySchema,
} from '../../common/openapi.js';
import * as service from './time-entries.service.js';

const tags = ['Time entries'];

const listQuery = z.object({
  employeeId: employeeIdSchema,
  weekStart: weekStartSchema.optional(),
});

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'List time entries for an employee (optionally a single week)',
  request: { query: listQuery },
  responses: {
    200: jsonResponse(z.array(timeEntrySchema), 'Time entries'),
  },
});

const createEntryRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'Log a time entry',
  request: jsonBody(createTimeEntrySchema),
  responses: {
    201: jsonResponse(timeEntrySchema, 'Created time entry'),
    400: errorResponse('Validation error or future date'),
    409: errorResponse('Inactive employee or approved (locked) week'),
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags,
  summary: 'Edit a time entry (blocked if its week is approved)',
  request: { params: idParam, ...jsonBody(updateTimeEntrySchema) },
  responses: {
    200: jsonResponse(timeEntrySchema, 'Updated time entry'),
    400: errorResponse('Validation error or future date'),
    404: errorResponse('Time entry not found'),
    409: errorResponse('Approved (locked) week'),
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: 'Delete a time entry (blocked if its week is approved)',
  request: { params: idParam },
  responses: {
    204: { description: 'Deleted' },
    404: errorResponse('Time entry not found'),
    409: errorResponse('Approved (locked) week'),
  },
});

export const timeEntriesRoutes = createModuleApp()
  .openapi(listRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('query');
    return c.json(await service.listTimeEntries(employeeId, weekStart), 200);
  })
  .openapi(createEntryRoute, async (c) => {
    const created = await service.createTimeEntry(c.req.valid('json'));
    return c.json(created, 201);
  })
  .openapi(updateRoute, async (c) => {
    const { id } = c.req.valid('param');
    return c.json(await service.updateTimeEntry(id, c.req.valid('json')), 200);
  })
  .openapi(deleteRoute, async (c) => {
    await service.deleteTimeEntry(c.req.valid('param').id);
    return c.body(null, 204);
  });
