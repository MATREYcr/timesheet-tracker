import { createRoute, z } from '@hono/zod-openapi';
import {
  createTimeEntrySchema,
  employeeIdSchema,
  timeEntrySchema as timeEntryShape,
  updateTimeEntrySchema,
  weekStartSchema,
} from '@timesheet/shared';
import {
  errorResponse,
  idParam,
  jsonBody,
  jsonResponse,
} from '../../common/openapi.js';

const timeEntrySchema = timeEntryShape.openapi('TimeEntry');

const tags = ['Time entries'];

export const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'List time entries for an employee (optionally a single week)',
  request: {
    query: z.object({
      employeeId: employeeIdSchema,
      weekStart: weekStartSchema.optional(),
    }),
  },
  responses: {
    200: jsonResponse(z.array(timeEntrySchema), 'Time entries'),
  },
});

export const createEntryRoute = createRoute({
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

export const updateRoute = createRoute({
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

export const deleteRoute = createRoute({
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
