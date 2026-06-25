import type { Employee, Paginated, WeeklySummaryRow } from '@timesheet/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  app,
  body,
  closeDb,
  createEmployee,
  logHours,
  truncate,
} from '../../../test/helpers';

const WEEK_START = '2020-02-03'; // a past Monday

describe('employees soft-delete (integration)', () => {
  let employeeId: string;

  beforeAll(async () => {
    await truncate();
    employeeId = await createEmployee({ firstName: 'SoftDelete', hourlyRate: 25 });
    await logHours(employeeId, WEEK_START, 1, 8);
  });

  afterAll(async () => {
    await truncate();
    await closeDb();
  });

  it('deactivate sets status=inactive without deleting the row', async () => {
    const res = await app.request(`/employees/${employeeId}/deactivate`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const emp = await body<Employee>(res);
    expect(emp.id).toBe(employeeId);
    expect(emp.status).toBe('inactive');
    expect(emp.deactivatedAt).not.toBeNull();
  });

  it('inactive employee is hidden from the default GET /employees list', async () => {
    const res = await app.request('/employees');
    expect(res.status).toBe(200);
    const page = await body<Paginated<Employee>>(res);
    expect(page.data.map((e) => e.id)).not.toContain(employeeId);
  });

  it('inactive employee appears with ?includeInactive=true', async () => {
    const res = await app.request('/employees?includeInactive=true');
    expect(res.status).toBe(200);
    const page = await body<Paginated<Employee>>(res);
    const found = page.data.find((e) => e.id === employeeId);
    expect(found).toBeDefined();
    expect(found?.status).toBe('inactive');
  });

  it("inactive employee's historical week still shows in GET /weekly-summary", async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const summary = await body<Paginated<WeeklySummaryRow>>(res);
    const row = summary.data.find((r) => r.employeeId === employeeId);
    expect(row).toBeDefined();
    expect(row?.totalHours).toBe(8);
  });

  it('reactivate clears deactivatedAt and restores the employee to active lists', async () => {
    const res = await app.request(`/employees/${employeeId}/reactivate`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const emp = await body<Employee>(res);
    expect(emp.status).toBe('active');
    expect(emp.deactivatedAt).toBeNull();

    const list = await app.request('/employees');
    const page = await body<Paginated<Employee>>(list);
    expect(page.data.map((e) => e.id)).toContain(employeeId);
  });
});
