// Aggregation correctness for the weekly-summary and dashboard endpoints.
// Runs the real app against the isolated test DB (timesheet_test) via app.request().

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
// A past Monday — satisfies no-future-date. Different week from other spec files.
const WEEK_START = '2020-04-06'; // Monday

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

describe('weekly-summary and dashboard aggregation (integration)', () => {
  let emp1Id: string; // active, has entries in WEEK_START
  let emp2Id: string; // active, has entries in WEEK_START (overtime scenario)
  let emp3Id: string; // active, no entries in WEEK_START

  beforeAll(async () => {
    await reset();

    // Employee 1 — 32 h total, all regular.
    const r1 = await postJson('/employees', {
      firstName: 'Alice',
      lastName: 'Agg',
      hourlyRate: 20,
    });
    expect(r1.status).toBe(201);
    emp1Id = (await body<Employee>(r1)).id;

    // Employee 2 — 45 h total (5 h overtime).
    const r2 = await postJson('/employees', {
      firstName: 'Bob',
      lastName: 'Agg',
      hourlyRate: 10,
    });
    expect(r2.status).toBe(201);
    emp2Id = (await body<Employee>(r2)).id;

    // Employee 3 — no entries this week (should not appear in summary).
    const r3 = await postJson('/employees', {
      firstName: 'Carol',
      lastName: 'Agg',
      hourlyRate: 15,
    });
    expect(r3.status).toBe(201);
    emp3Id = (await body<Employee>(r3)).id;

    // Seed Alice's entries: 8 + 8 + 8 + 8 = 32 h.
    for (const [dayOffset, hours] of [
      [0, 8],
      [1, 8],
      [2, 8],
      [3, 8],
    ] as [number, number][]) {
      const d = new Date(WEEK_START);
      d.setDate(d.getDate() + dayOffset);
      const date = d.toISOString().slice(0, 10);
      const e = await postJson('/time-entries', {
        employeeId: emp1Id,
        date,
        hours,
      });
      expect(e.status).toBe(201);
    }

    // Seed Bob's entries: 9 + 9 + 9 + 9 + 9 = 45 h.
    for (const [dayOffset, hours] of [
      [0, 9],
      [1, 9],
      [2, 9],
      [3, 9],
      [4, 9],
    ] as [number, number][]) {
      const d = new Date(WEEK_START);
      d.setDate(d.getDate() + dayOffset);
      const date = d.toISOString().slice(0, 10);
      const e = await postJson('/time-entries', {
        employeeId: emp2Id,
        date,
        hours,
      });
      expect(e.status).toBe(201);
    }

    // Carol gets no entries (emp3Id intentionally left empty).
    void emp3Id;
  });

  afterAll(async () => {
    await reset();
    await closeDb();
  });

  it('only employees with ≥1 entry in the week appear in the summary', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const page = await body<Paginated<WeeklySummaryRow>>(res);

    // Carol has no entries → must not appear.
    const ids = page.data.map((r) => r.employeeId);
    expect(ids).toContain(emp1Id);
    expect(ids).toContain(emp2Id);
    expect(ids).not.toContain(emp3Id);
    expect(page.total).toBe(2);
  });

  it('totalHours is the correct sum across all days for each employee', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    const page = await body<Paginated<WeeklySummaryRow>>(res);

    const alice = page.data.find((r) => r.employeeId === emp1Id);
    const bob = page.data.find((r) => r.employeeId === emp2Id);

    expect(alice?.totalHours).toBe(32);
    expect(bob?.totalHours).toBe(45);
  });

  it('the API response does not include totalPay (client computes it)', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    const page = await body<Paginated<WeeklySummaryRow>>(res);

    for (const row of page.data) {
      expect(row).not.toHaveProperty('totalPay');
    }
  });

  it('GET /dashboard returns correct activeEmployees count and totalHours for the week', async () => {
    const res = await app.request(`/dashboard?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const dashboard = await body<DashboardSummary>(res);

    // 3 active employees total (none deactivated in this spec).
    expect(dashboard.activeEmployees).toBe(3);

    // totalHours = Alice's 32 + Bob's 45 = 77.
    expect(dashboard.totalHours).toBe(77);

    // Both weeks are pending (no approvals set), so pendingCount = 2.
    expect(dashboard.pendingCount).toBe(2);

    // Pending preview is ≤5 rows and references pending employees.
    expect(dashboard.pending.length).toBeLessThanOrEqual(5);
    expect(dashboard.pending.length).toBe(2);

    // totalPay is computed server-side via shared calc (spot-check it is a number).
    expect(typeof dashboard.totalPay).toBe('number');
    expect(dashboard.totalPay).toBeGreaterThan(0);
  });

  it('dashboard totalPay matches shared calculateWeeklyPay summed over each employee', async () => {
    // Alice: 32 h @ $20 → all regular → $640.00
    // Bob:   45 h @ $10 → 40 regular ($400) + 5 OT @ $15 ($75) → $475.00
    // Expected totalPay = $640 + $475 = $1,115.00
    const res = await app.request(`/dashboard?weekStart=${WEEK_START}`);
    const dashboard = await body<DashboardSummary>(res);
    expect(dashboard.totalPay).toBe(1115);
  });
});
