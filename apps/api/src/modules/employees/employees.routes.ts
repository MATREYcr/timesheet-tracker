import { createRoute, z } from '@hono/zod-openapi';
import {
  createEmployeeSchema,
  employeeIdSchema,
  paginationQuerySchema,
  updateEmployeeSchema,
} from '@timesheet/shared';
import {
  createModuleApp,
  employeeSchema,
  errorResponse,
  idParam,
  jsonBody,
  jsonResponse,
  paginatedSchema,
} from '../../common/openapi.js';
import * as service from './employees.service.js';

const tags = ['Employees'];

const listQuery = z
  .object({
    includeInactive: z.stringbool().optional().default(false),
    employeeId: employeeIdSchema.optional(),
    search: z.string().trim().optional(),
  })
  .extend(paginationQuerySchema.shape);

const listRoute = createRoute({
  method: 'get',
  path: '/',
  tags,
  summary: 'List employees (paginated; inactive hidden unless includeInactive)',
  request: { query: listQuery },
  responses: {
    200: jsonResponse(
      paginatedSchema(employeeSchema, 'PaginatedEmployees'),
      'Paginated employees',
    ),
  },
});

const createEmpRoute = createRoute({
  method: 'post',
  path: '/',
  tags,
  summary: 'Create an employee',
  request: jsonBody(createEmployeeSchema),
  responses: {
    201: jsonResponse(employeeSchema, 'Created employee'),
    400: errorResponse('Validation error'),
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags,
  summary: 'Update an employee (name / hourly rate)',
  request: { params: idParam, ...jsonBody(updateEmployeeSchema) },
  responses: {
    200: jsonResponse(employeeSchema, 'Updated employee'),
    400: errorResponse('Validation error'),
    404: errorResponse('Employee not found'),
  },
});

const deactivateRoute = createRoute({
  method: 'post',
  path: '/{id}/deactivate',
  tags,
  summary: 'Soft-delete an employee (sets deactivatedAt)',
  request: { params: idParam },
  responses: {
    200: jsonResponse(employeeSchema, 'Deactivated employee'),
    404: errorResponse('Employee not found'),
  },
});

const reactivateRoute = createRoute({
  method: 'post',
  path: '/{id}/reactivate',
  tags,
  summary: 'Reactivate an employee (clears deactivatedAt)',
  request: { params: idParam },
  responses: {
    200: jsonResponse(employeeSchema, 'Reactivated employee'),
    404: errorResponse('Employee not found'),
  },
});

export const employeesRoutes = createModuleApp()
  .openapi(listRoute, async (c) => {
    const { includeInactive, page, pageSize, employeeId, search } =
      c.req.valid('query');
    return c.json(
      await service.listEmployees(
        includeInactive,
        { page, pageSize },
        { employeeId, search },
      ),
      200,
    );
  })
  .openapi(createEmpRoute, async (c) => {
    const created = await service.createEmployee(c.req.valid('json'));
    return c.json(created, 201);
  })
  .openapi(updateRoute, async (c) => {
    const { id } = c.req.valid('param');
    return c.json(await service.updateEmployee(id, c.req.valid('json')), 200);
  })
  .openapi(deactivateRoute, async (c) => {
    return c.json(await service.deactivateEmployee(c.req.valid('param').id), 200);
  })
  .openapi(reactivateRoute, async (c) => {
    return c.json(await service.reactivateEmployee(c.req.valid('param').id), 200);
  });
