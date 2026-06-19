import {
  createEmployeeSchema,
  employeeIdSchema,
  paginationQuerySchema,
  updateEmployeeSchema,
} from '@timesheet/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../common/types.js';
import { validate } from '../../middleware/validate.js';
import * as service from './employees.service.js';

const idParam = z.object({ id: employeeIdSchema });
const listQuery = z
  .object({
    includeInactive: z.stringbool().optional().default(false),
    employeeId: employeeIdSchema.optional(),
  })
  .extend(paginationQuerySchema.shape);

export const employeesRoutes = new Hono<AppEnv>()
  .get('/', validate('query', listQuery), async (c) => {
    const { includeInactive, page, pageSize, employeeId } =
      c.req.valid('query');
    return c.json(
      await service.listEmployees(includeInactive, { page, pageSize }, employeeId),
    );
  })
  .post('/', validate('json', createEmployeeSchema), async (c) => {
    const created = await service.createEmployee(c.req.valid('json'));
    return c.json(created, 201);
  })
  .patch(
    '/:id',
    validate('param', idParam),
    validate('json', updateEmployeeSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      return c.json(await service.updateEmployee(id, c.req.valid('json')));
    },
  )
  .post('/:id/deactivate', validate('param', idParam), async (c) => {
    return c.json(await service.deactivateEmployee(c.req.valid('param').id));
  })
  .post('/:id/reactivate', validate('param', idParam), async (c) => {
    return c.json(await service.reactivateEmployee(c.req.valid('param').id));
  });
