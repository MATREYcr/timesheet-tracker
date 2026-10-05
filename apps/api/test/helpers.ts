import type { Employee } from '@timesheet/shared';
import { sql } from 'drizzle-orm';
import { expect } from 'vitest';
import { createApp } from '@/app';
import { db } from '@/db/client';

export { closeDb } from '@/db/client';

const rawApp = createApp();

let sessionCookie = '';

function withSession(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  if (sessionCookie) headers.set('cookie', sessionCookie);
  return { ...init, headers };
}

/** The app as an authenticated client: every request carries the test user's session. */
export const app = {
  request: (path: string, init?: RequestInit) =>
    rawApp.request(path, withSession(init)),
};

/** The app with no session, for exercising auth itself. */
export const anonymousApp = rawApp;

export const WEB_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

export async function signUp(
  user: { name?: string; email?: string; password?: string } = {},
): Promise<{ cookie: string; email: string; password: string }> {
  const email = user.email ?? `test-${crypto.randomUUID()}@example.com`;
  const password = user.password ?? 'secret123';
  const res = await rawApp.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ name: user.name ?? 'Test User', email, password }),
  });
  expect(res.status).toBe(200);
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0];
  expect(cookie).toMatch(/session_token=/);
  return { cookie, email, password };
}

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
    headers:
      payload === undefined
        ? undefined
        : { 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

export const postJson = (path: string, payload: unknown) =>
  send('POST', path, payload);
export const patchJson = (path: string, payload: unknown) =>
  send('PATCH', path, payload);
export const del = (path: string) => send('DELETE', path);

/** Clean slate (business + auth tables), then sign in a fresh test user for `app`. */
export async function truncate() {
  await db.execute(
    sql`TRUNCATE TABLE weekly_approvals, time_entries, employees, sessions, accounts, verifications, users RESTART IDENTITY CASCADE`,
  );
  sessionCookie = (await signUp()).cookie;
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
