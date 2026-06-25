import type { DashboardSummary } from '@timesheet/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  app,
  body,
  closeDb,
  createEmployee,
  logHours,
  truncate,
} from '../../../test/helpers';

const WEEK_START = '2020-04-06'; // a past Monday

describe('dashboard KPIs (integration)', () => {
  beforeAll(async () => {
    await truncate();
    const aliceId = await createEmployee({ firstName: 'Alice', hourlyRate: 20 });
    const bobId = await createEmployee({ firstName: 'Bob', hourlyRate: 10 });
    await createEmployee({ firstName: 'Carol', hourlyRate: 15 }); // active, no entries
    await logHours(aliceId, WEEK_START, 4, 8);
    await logHours(bobId, WEEK_START, 5, 9);
  });

  afterAll(async () => {
    await truncate();
    await closeDb();
  });

  it('returns correct activeEmployees count and totalHours', async () => {
    const res = await app.request(`/dashboard?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const dashboard = await body<DashboardSummary>(res);

    expect(dashboard.activeEmployees).toBe(3);
    expect(dashboard.totalHours).toBe(77);
    expect(dashboard.pendingCount).toBe(2);
    expect(dashboard.pending.length).toBe(2);
  });

  it('totalPay matches shared calculateWeeklyPay summed over employees', async () => {
    // Alice: 32 h @ $20 = $640. Bob: 45 h @ $10 = 40 reg ($400) + 5 OT @ $15 ($75) = $475.
    // Total = $1,115.00 — exercises the overtime calc through the server-side aggregate.
    const res = await app.request(`/dashboard?weekStart=${WEEK_START}`);
    const dashboard = await body<DashboardSummary>(res);
    expect(dashboard.totalPay).toBe(1115);
  });
});
