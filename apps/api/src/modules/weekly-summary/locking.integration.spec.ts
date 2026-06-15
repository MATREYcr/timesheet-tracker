// Approving a week locks its entries. Runs the real app against real Postgres via
// app.request() (CI provides the DB).

import type { TimeEntry, WeeklySummaryRow } from '@timesheet/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { closeDb, db } from '../../db/client.js';
import {
  employees,
  timeEntries,
  weeklyApprovals,
} from '../../db/schema/index.js';

const app = createApp();
const WEEK_START = '2026-06-08';

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

async function clean() {
  await db.delete(weeklyApprovals);
  await db.delete(timeEntries);
  await db.delete(employees);
}

describe('approval locking flow (integration)', () => {
  let employeeId: string;
  let entryId: string;

  beforeAll(async () => {
    await clean();
    const res = await postJson('/employees', {
      firstName: 'Test',
      lastName: 'User',
      hourlyRate: 20,
    });
    employeeId = (await body<{ id: string }>(res)).id;
  });

  afterAll(async () => {
    await clean();
    await closeDb();
  });

  it('allows creating an entry while the week is pending', async () => {
    const res = await postJson('/time-entries', {
      employeeId,
      date: '2026-06-08',
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
      date: '2026-06-09',
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
    const rows = await body<WeeklySummaryRow[]>(res);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      employeeId,
      hourlyRate: 20,
      totalHours: 6,
      status: 'rejected',
    });
    expect(rows[0]).not.toHaveProperty('totalPay');
  });
});
