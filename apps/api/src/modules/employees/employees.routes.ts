import { HttpStatus } from '../../common/http-status.js';
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
      HttpStatus.OK,
    );
  })
  .openapi(createEmpRoute, async (c) => {
    const created = await service.createEmployee(c.req.valid('json'));
    return c.json(created, HttpStatus.CREATED);
  })
  .openapi(updateRoute, async (c) => {
    const { id } = c.req.valid('param');
    return c.json(await service.updateEmployee(id, c.req.valid('json')), HttpStatus.OK);
  })
  .openapi(deactivateRoute, async (c) => {
    return c.json(await service.deactivateEmployee(c.req.valid('param').id), HttpStatus.OK);
  })
  .openapi(reactivateRoute, async (c) => {
    return c.json(await service.reactivateEmployee(c.req.valid('param').id), HttpStatus.OK);
  });
