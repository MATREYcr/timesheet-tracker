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
  patchJson,
  postJson,
  truncate,
} from '../../../test/helpers';

const WEEK_START = '2020-01-06'; // a past Monday

describe('approval locking flow (integration)', () => {
  let employeeId: string;
  let entryId: string;

  beforeAll(async () => {
    await truncate();
    employeeId = await createEmployee({ hourlyRate: 20 });
  });

  afterAll(async () => {
    await truncate();
    await closeDb();
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
