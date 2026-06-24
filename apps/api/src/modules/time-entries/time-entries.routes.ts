import { HttpStatus } from '../../common/http-status.js';
import { createModuleApp } from '../../common/openapi.js';
import {
  createEntryRoute,
  deleteRoute,
  listRoute,
  updateRoute,
} from './time-entries.openapi.js';
import * as service from './time-entries.service.js';

export const timeEntriesRoutes = createModuleApp()
  .openapi(listRoute, async (c) => {
    const { employeeId, weekStart } = c.req.valid('query');
    return c.json(await service.listTimeEntries(employeeId, weekStart), HttpStatus.OK);
  })
  .openapi(createEntryRoute, async (c) => {
    const created = await service.createTimeEntry(c.req.valid('json'));
    return c.json(created, HttpStatus.CREATED);
  })
  .openapi(updateRoute, async (c) => {
    const { id } = c.req.valid('param');
    return c.json(await service.updateTimeEntry(id, c.req.valid('json')), HttpStatus.OK);
  })
  .openapi(deleteRoute, async (c) => {
    await service.deleteTimeEntry(c.req.valid('param').id);
    return c.body(null, HttpStatus.NO_CONTENT);
  });
