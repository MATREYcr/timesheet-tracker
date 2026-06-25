import type { Paginated, WeeklySummaryRow } from '@timesheet/shared';
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

describe('weekly-summary aggregation (integration)', () => {
  let aliceId: string; // 32 h, all regular
  let bobId: string; // 45 h (5 h overtime)
  let carolId: string; // no entries this week

  beforeAll(async () => {
    await truncate();
    aliceId = await createEmployee({ firstName: 'Alice', hourlyRate: 20 });
    bobId = await createEmployee({ firstName: 'Bob', hourlyRate: 10 });
    carolId = await createEmployee({ firstName: 'Carol', hourlyRate: 15 });
    await logHours(aliceId, WEEK_START, 4, 8);
    await logHours(bobId, WEEK_START, 5, 9);
  });

  afterAll(async () => {
    await truncate();
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
});
