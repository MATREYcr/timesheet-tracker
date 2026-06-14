// Employees HTTP routes. Thin: validate input (shared Zod via zValidator), call
// the service, shape the response. Mounted at /employees.

import {
  createEmployeeSchema,
  employeeIdSchema,
  updateEmployeeSchema,
} from '@timesheet/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../../common/types.js';
import { validate } from '../../common/validator.js';
import * as service from './employees.service.js';

const idParam = z.object({ id: employeeIdSchema });

export const employeesRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const includeInactive = c.req.query('includeInactive') === 'true';
    return c.json(await service.listEmployees(includeInactive));
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
