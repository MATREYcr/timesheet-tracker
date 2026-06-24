import { createRoute, z } from '@hono/zod-openapi';
import { HttpStatus } from '@/common/http-status';
import {
  createEmployeeSchema,
  employeeIdSchema,
  employeeSchema as employeeShape,
  paginationQuerySchema,
  updateEmployeeSchema,
} from '@timesheet/shared';
import {
  errorResponse,
  idParam,
  jsonBody,
  jsonResponse,
  paginatedSchema,
} from '@/common/openapi';

const employeeSchema = employeeShape.openapi('Employee');

const tags = ['Employees'];

export const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'List employees (paginated; inactive hidden unless includeInactive)',
  request: {
    query: z
      .object({
        includeInactive: z.stringbool().optional().default(false),
        employeeId: employeeIdSchema.optional(),
        search: z.string().trim().optional(),
      })
      .extend(paginationQuerySchema.shape),
  },
  responses: {
    [HttpStatus.OK]: jsonResponse(
      paginatedSchema(employeeSchema, 'PaginatedEmployees'),
      'Paginated employees',
    ),
  },
});

export const createEmpRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'Create an employee',
  request: jsonBody(createEmployeeSchema),
  responses: {
    [HttpStatus.CREATED]: jsonResponse(employeeSchema, 'Created employee'),
    [HttpStatus.BAD_REQUEST]: errorResponse('Validation error'),
  },
});

export const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags,
  summary: 'Update an employee (name / hourly rate)',
  request: { params: idParam, ...jsonBody(updateEmployeeSchema) },
  responses: {
    [HttpStatus.OK]: jsonResponse(employeeSchema, 'Updated employee'),
    [HttpStatus.BAD_REQUEST]: errorResponse('Validation error'),
    [HttpStatus.NOT_FOUND]: errorResponse('Employee not found'),
  },
});

export const deactivateRoute = createRoute({
  method: 'post',
  path: '/{id}/deactivate',
  tags,
  summary: 'Soft-delete an employee (sets deactivatedAt)',
  request: { params: idParam },
  responses: {
    [HttpStatus.OK]: jsonResponse(employeeSchema, 'Deactivated employee'),
    [HttpStatus.NOT_FOUND]: errorResponse('Employee not found'),
  },
});

export const reactivateRoute = createRoute({
  method: 'post',
  path: '/{id}/reactivate',
  tags,
  summary: 'Reactivate an employee (clears deactivatedAt)',
  request: { params: idParam },
  responses: {
    [HttpStatus.OK]: jsonResponse(employeeSchema, 'Reactivated employee'),
    [HttpStatus.NOT_FOUND]: errorResponse('Employee not found'),
  },
});
