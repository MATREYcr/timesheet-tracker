import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  app,
  body,
  closeDb,
  createEmployee,
  postJson,
  truncate,
} from '../../../test/helpers';

const PAST_DATE = '2020-03-09'; // a past Monday

describe('time-entries validation (integration)', () => {
  let activeEmployeeId: string;
  let inactiveEmployeeId: string;

  beforeAll(async () => {
    await truncate();
    activeEmployeeId = await createEmployee({ firstName: 'Active', hourlyRate: 20 });
    inactiveEmployeeId = await createEmployee({ firstName: 'Inactive', hourlyRate: 15 });
    const deactivate = await app.request(
      `/employees/${inactiveEmployeeId}/deactivate`,
      { method: 'POST' },
    );
    expect(deactivate.status).toBe(200);
  });

  afterAll(async () => {
    await truncate();
    await closeDb();
  });

  it('valid entry is created with status 201', async () => {
    const res = await postJson('/time-entries', {
      employeeId: activeEmployeeId,
      date: PAST_DATE,
      hours: 7.5,
    });
    expect(res.status).toBe(201);
    const entry = await body<{ id: string; hours: number }>(res);
    expect(entry.hours).toBe(7.5);
    expect(entry.id).toBeDefined();
  });

  it('future date → VALIDATION_ERROR (400)', async () => {
    // Future-date is enforced by the shared `pastOrToday` schema (input validation),
    // so it surfaces as VALIDATION_ERROR, not a dedicated code.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = tomorrow.toISOString().slice(0, 10);

    const res = await postJson('/time-entries', {
      employeeId: activeEmployeeId,
      date: futureDate,
      hours: 8,
    });
    expect(res.status).toBe(400);
    const { error } = await body<{ error: { code: string } }>(res);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('hours not a 0.25 multiple (7.3) → VALIDATION_ERROR (400)', async () => {
    const res = await postJson('/time-entries', {
      employeeId: activeEmployeeId,
      date: PAST_DATE,
      hours: 7.3,
    });
    expect(res.status).toBe(400);
    const { error } = await body<{ error: { code: string } }>(res);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('hours below minimum (0) → VALIDATION_ERROR (400)', async () => {
    const res = await postJson('/time-entries', {
      employeeId: activeEmployeeId,
      date: PAST_DATE,
      hours: 0,
    });
    expect(res.status).toBe(400);
    const { error } = await body<{ error: { code: string } }>(res);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('hours above maximum (24.25) → VALIDATION_ERROR (400)', async () => {
    const res = await postJson('/time-entries', {
      employeeId: activeEmployeeId,
      date: PAST_DATE,
      hours: 24.25,
    });
    expect(res.status).toBe(400);
    const { error } = await body<{ error: { code: string } }>(res);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('entry for inactive employee → EMPLOYEE_INACTIVE (409)', async () => {
    const res = await postJson('/time-entries', {
      employeeId: inactiveEmployeeId,
      date: PAST_DATE,
      hours: 8,
    });
    expect(res.status).toBe(409);
    const { error } = await body<{ error: { code: string } }>(res);
    expect(error.code).toBe('EMPLOYEE_INACTIVE');
  });
});
