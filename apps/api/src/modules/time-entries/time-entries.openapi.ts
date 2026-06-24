import { createRoute, z } from '@hono/zod-openapi';
import { HttpStatus } from '../../common/http-status.js';
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
    [HttpStatus.OK]: jsonResponse(z.array(timeEntrySchema), 'Time entries'),
  },
});

export const createEntryRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'Log a time entry',
  request: jsonBody(createTimeEntrySchema),
  responses: {
    [HttpStatus.CREATED]: jsonResponse(timeEntrySchema, 'Created time entry'),
    [HttpStatus.BAD_REQUEST]: errorResponse('Validation error or future date'),
    [HttpStatus.CONFLICT]: errorResponse('Inactive employee or approved (locked) week'),
  },
});

export const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags,
  summary: 'Edit a time entry (blocked if its week is approved)',
  request: { params: idParam, ...jsonBody(updateTimeEntrySchema) },
  responses: {
    [HttpStatus.OK]: jsonResponse(timeEntrySchema, 'Updated time entry'),
    [HttpStatus.BAD_REQUEST]: errorResponse('Validation error or future date'),
    [HttpStatus.NOT_FOUND]: errorResponse('Time entry not found'),
    [HttpStatus.CONFLICT]: errorResponse('Approved (locked) week'),
  },
});

export const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags,
  summary: 'Delete a time entry (blocked if its week is approved)',
  request: { params: idParam },
  responses: {
    [HttpStatus.NO_CONTENT]: { description: 'Deleted' },
    [HttpStatus.NOT_FOUND]: errorResponse('Time entry not found'),
    [HttpStatus.CONFLICT]: errorResponse('Approved (locked) week'),
  },
});
