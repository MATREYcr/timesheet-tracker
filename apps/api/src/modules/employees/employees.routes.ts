import { createModuleApp } from '../../common/openapi.js';
import {
  createEmpRoute,
  deactivateRoute,
  listRoute,
  reactivateRoute,
  updateRoute,
} from './employees.openapi.js';
import * as service from './employees.service.js';

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
