// Approving a week locks its entries. Runs the real app against an isolated test
// Postgres (timesheet_test, provisioned by the Vitest globalSetup) via app.request().

import type {
  Paginated,
  TimeEntry,
  WeekApprovalStatus,
  WeeklySummaryRow,
} from '@timesheet/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { closeDb, db } from '@/db/client';

const app = createApp();
// Any past Monday works — the test DB is isolated and truncated per run, so dates
// only need to satisfy the no-future-date rule.
const WEEK_START = '2020-01-06'; // Monday
const TEST_FIRST_NAME = 'IntegrationTest';

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

function patchJson(path: string, payload: unknown) {
  return app.request(path, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Isolated test DB → a full truncate is safe and gives every run a clean slate.
async function reset() {
  await db.execute(
    sql`TRUNCATE TABLE weekly_approvals, time_entries, employees RESTART IDENTITY CASCADE`,
  );
}

describe('approval locking flow (integration)', () => {
  let employeeId: string;
  let entryId: string;

  beforeAll(async () => {
    await reset();
    const res = await postJson('/employees', {
      firstName: TEST_FIRST_NAME,
      lastName: 'User',
      hourlyRate: 20,
    });
    employeeId = (await body<{ id: string }>(res)).id;
  });

  afterAll(async () => {
    await reset();
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
      date: '2020-01-07',
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

    const del = await app.request(`/time-entries/${entryId}`, {
      method: 'DELETE',
    });
    expect(del.status).toBe(409);
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
      `/weekly-summary/approval?employeeId=${employeeId}&weekStart=2020-01-13`,
    );
    expect((await body<WeekApprovalStatus>(pending)).status).toBe('pending');

    // Unknown employee → 404.
    const missing = await app.request(
      `/weekly-summary/approval?employeeId=00000000-0000-0000-0000-000000000000&weekStart=${WEEK_START}`,
    );
    expect(missing.status).toBe(404);
  });
});
