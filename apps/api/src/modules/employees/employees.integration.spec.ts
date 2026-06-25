import type { Employee, Paginated, WeeklySummaryRow } from '@timesheet/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { closeDb, db } from '@/db/client';

const app = createApp();
const WEEK_START = '2020-02-03'; // a past Monday

async function body<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function postJson(path: string, payload: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function reset() {
  await db.execute(
    sql`TRUNCATE TABLE weekly_approvals, time_entries, employees RESTART IDENTITY CASCADE`,
  );
}

describe('employees soft-delete (integration)', () => {
  let employeeId: string;

  beforeAll(async () => {
    await reset();
    const res = await postJson('/employees', {
      firstName: 'SoftDelete',
      lastName: 'Test',
      hourlyRate: 25,
    });
    expect(res.status).toBe(201);
    employeeId = (await body<Employee>(res)).id;

    const entry = await postJson('/time-entries', {
      employeeId,
      date: WEEK_START,
      hours: 8,
    });
    expect(entry.status).toBe(201);
  });

  afterAll(async () => {
    await reset();
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
    const ids = page.data.map((e) => e.id);
    expect(ids).not.toContain(employeeId);
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
    const res = await app.request(
      `/weekly-summary?weekStart=${WEEK_START}`,
    );
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
    const ids = page.data.map((e) => e.id);
    expect(ids).toContain(employeeId);
  });
});
