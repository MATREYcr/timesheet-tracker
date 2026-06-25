import type {
  Paginated,
  TimeEntry,
  WeekApprovalStatus,
  WeeklySummaryRow,
} from '@timesheet/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addDays,
  app,
  body,
  closeDb,
  createEmployee,
  del,
  logHours,
  patchJson,
  postJson,
  truncate,
} from '../../../test/helpers';

const WEEK_START = '2020-01-06'; // a past Monday

// One DB client per file, so close it once after every describe has run (a
// per-describe closeDb would shut the connection before the next describe).
afterAll(async () => {
  await truncate();
  await closeDb();
});

describe('approval locking flow (integration)', () => {
  let employeeId: string;
  let entryId: string;

  beforeAll(async () => {
    await truncate();
    employeeId = await createEmployee({ hourlyRate: 20 });
  });

  it('allows creating an entry while the week is pending', async () => {
    const res = await postJson('/time-entries', {
      employeeId,
      date: WEEK_START,
      hours: 8,
    });
    expect(res.status).toBe(201);
    entryId = (await body<TimeEntry>(res)).id;
  });

  it('locks create/edit/delete once the week is approved', async () => {
    const approve = await postJson('/weekly-summary/approve', {
      employeeId,
      weekStart: WEEK_START,
    });
    expect(approve.status).toBe(200);

    const create = await postJson('/time-entries', {
      employeeId,
      date: addDays(WEEK_START, 1),
      hours: 4,
    });
    expect(create.status).toBe(409);
    expect((await body<{ error: { code: string } }>(create)).error.code).toBe(
      'WEEK_LOCKED',
    );

    const edit = await patchJson(`/time-entries/${entryId}`, { hours: 5 });
    expect(edit.status).toBe(409);
    expect((await body<{ error: { code: string } }>(edit)).error.code).toBe(
      'WEEK_LOCKED',
    );

    const removed = await del(`/time-entries/${entryId}`);
    expect(removed.status).toBe(409);
  });

  it('re-opens the week when rejected so it can be fixed', async () => {
    const reject = await postJson('/weekly-summary/reject', {
      employeeId,
      weekStart: WEEK_START,
    });
    expect(reject.status).toBe(200);

    const edit = await patchJson(`/time-entries/${entryId}`, { hours: 6 });
    expect(edit.status).toBe(200);
    expect((await body<TimeEntry>(edit)).hours).toBe(6);
  });

  it('returns the raw weekly aggregate (no pay computed by the API)', async () => {
    const res = await app.request(`/weekly-summary?weekStart=${WEEK_START}`);
    expect(res.status).toBe(200);
    const summary = await body<Paginated<WeeklySummaryRow>>(res);
    expect(summary.total).toBe(1);
    expect(summary.data).toHaveLength(1);
    expect(summary.data[0]).toMatchObject({
      employeeId,
      hourlyRate: 20,
      totalHours: 6,
      status: 'rejected',
    });
    expect(summary.data[0]).not.toHaveProperty('totalPay');
  });

  it('exposes the approval status for an (employee, week)', async () => {
    const approve = await postJson('/weekly-summary/approve', {
      employeeId,
      weekStart: WEEK_START,
    });
    expect(approve.status).toBe(200);

    const res = await app.request(
      `/weekly-summary/approval?employeeId=${employeeId}&weekStart=${WEEK_START}`,
    );
    expect(res.status).toBe(200);
    expect(await body<WeekApprovalStatus>(res)).toMatchObject({
      employeeId,
      weekStart: WEEK_START,
      status: 'approved',
    });

    // A week with no approval row is implicitly pending.
    const pending = await app.request(
      `/weekly-summary/approval?employeeId=${employeeId}&weekStart=${addDays(WEEK_START, 7)}`,
    );
    expect((await body<WeekApprovalStatus>(pending)).status).toBe('pending');

    const missing = await app.request(
      `/weekly-summary/approval?employeeId=00000000-0000-0000-0000-000000000000&weekStart=${WEEK_START}`,
    );
    expect(missing.status).toBe(404);
  });
});

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
