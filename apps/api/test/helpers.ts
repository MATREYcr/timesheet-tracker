// Shared harness for API integration tests: one app instance, JSON request helpers,
// a truncate for a clean slate, and tiny data builders. Tests run against the
// isolated test DB (timesheet_test), so TRUNCATE is safe.

import type { Employee } from '@timesheet/shared';
import { sql } from 'drizzle-orm';
import { expect } from 'vitest';
import { createApp } from '@/app';
import { db } from '@/db/client';

export { closeDb } from '@/db/client';

export const app = createApp();

// UTC-safe date math, kept local so the test layer never *value*-imports
// @timesheet/shared — doing so loads its zod schemas before the app extends zod
// for OpenAPI (`@hono/zod-openapi`), breaking `.openapi()`. Mirrors shared `addDays`.
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export async function body<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function send(method: string, path: string, payload?: unknown) {
  return app.request(path, {
    method,
    headers: payload === undefined ? undefined : { 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

export const postJson = (path: string, payload: unknown) => send('POST', path, payload);
export const patchJson = (path: string, payload: unknown) => send('PATCH', path, payload);
export const del = (path: string) => send('DELETE', path);

export async function truncate() {
  await db.execute(
    sql`TRUNCATE TABLE weekly_approvals, time_entries, employees RESTART IDENTITY CASCADE`,
  );
}

export async function createEmployee(
  fields: { firstName?: string; lastName?: string; hourlyRate?: number } = {},
): Promise<string> {
  const res = await postJson('/employees', {
    firstName: fields.firstName ?? 'Test',
    lastName: fields.lastName ?? 'User',
    hourlyRate: fields.hourlyRate ?? 20,
  });
  expect(res.status).toBe(201);
  return (await body<Employee>(res)).id;
}

/** Log `days` consecutive entries from `weekStart` (UTC-safe), `hoursPerDay` each. */
export async function logHours(
  employeeId: string,
  weekStart: string,
  days: number,
  hoursPerDay: number,
): Promise<void> {
  for (let i = 0; i < days; i++) {
    const res = await postJson('/time-entries', {
      employeeId,
      date: addDays(weekStart, i),
      hours: hoursPerDay,
    });
    expect(res.status).toBe(201);
  }
}
