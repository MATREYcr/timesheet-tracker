import type {
  DashboardSummary,
  Employee,
  Paginated,
  WeeklySummaryRow,
} from '@timesheet/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { closeDb, db } from '@/db/client';

const app = createApp();
const WEEK_START = '2020-04-06'; // a past Monday

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

async function createEmployee(firstName: string, hourlyRate: number) {
  const res = await postJson('/employees', {
    firstName,
    lastName: 'Agg',
    hourlyRate,
  });
  expect(res.status).toBe(201);
  return (await body<Employee>(res)).id;
}

async function logHours(employeeId: string, days: number, hoursPerDay: number) {
  for (let offset = 0; offset < days; offset++) {
    const d = new Date(WEEK_START);
    d.setDate(d.getDate() + offset);
    const res = await postJson('/time-entries', {
      employeeId,
      date: d.toISOString().slice(0, 10),
      hours: hoursPerDay,
    });
    expect(res.status).toBe(201);
  }
}

describe('weekly-summary and dashboard aggregation (integration)', () => {
  let aliceId: string; // 32 h, all regular
  let bobId: string; // 45 h (5 h overtime)
  let carolId: string; // no entries this week

  beforeAll(async () => {
    await reset();
    aliceId = await createEmployee('Alice', 20);
    bobId = await createEmployee('Bob', 10);
    carolId = await createEmployee('Carol', 15);
    await logHours(aliceId, 4, 8);
    await logHours(bobId, 5, 9);
  });

  afterAll(async () => {
    await reset();
    await closeDb();
  });

  it('only employees with ≥1 entry in the week appear in the summary', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const page = await body<Paginated<WeeklySummaryRow>>(res);

    const ids = page.data.map((r) => r.employeeId);
    expect(ids).toContain(aliceId);
    expect(ids).toContain(bobId);
    expect(ids).not.toContain(carolId);
    expect(page.total).toBe(2);
  });

  it('totalHours is the correct sum across all days for each employee', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    const page = await body<Paginated<WeeklySummaryRow>>(res);

    expect(page.data.find((r) => r.employeeId === aliceId)?.totalHours).toBe(32);
    expect(page.data.find((r) => r.employeeId === bobId)?.totalHours).toBe(45);
  });

  it('the API response does not include totalPay (client computes it)', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    const page = await body<Paginated<WeeklySummaryRow>>(res);

    for (const row of page.data) {
      expect(row).not.toHaveProperty('totalPay');
    }
  });

  it('GET /dashboard returns correct activeEmployees count and totalHours', async () => {
    const res = await app.request(`/dashboard?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const dashboard = await body<DashboardSummary>(res);

    expect(dashboard.activeEmployees).toBe(3);
    expect(dashboard.totalHours).toBe(77);
    expect(dashboard.pendingCount).toBe(2);
    expect(dashboard.pending.length).toBe(2);
  });

  it('dashboard totalPay matches shared calculateWeeklyPay summed over employees', async () => {
    // Alice: 32 h @ $20 = $640. Bob: 45 h @ $10 = 40 reg ($400) + 5 OT @ $15 ($75) = $475.
    // Total = $1,115.00 — exercises the overtime calc through the server-side aggregate.
    const res = await app.request(`/dashboard?weekStart=${WEEK_START}`);
    const dashboard = await body<DashboardSummary>(res);
    expect(dashboard.totalPay).toBe(1115);
  });
});
