// Pure URL helpers for test-database isolation. No env/framework imports, so this
// is safe to use from the Vitest globalSetup and the db client alike.

export const TEST_DB_NAME = 'timesheet_test';

/** Return `url` with its database name swapped for `dbName`. */
function withDatabase(url: string, dbName: string): string {
  const u = new URL(url);
  u.pathname = `/${dbName}`;
  return u.toString();
}

/**
 * The isolated test database URL: explicit `TEST_DATABASE_URL`, or `DATABASE_URL`
 * with its database name swapped to `timesheet_test`. Never the dev/prod DB.
 */
export function resolveTestDbUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) return explicit;
  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error('DATABASE_URL is required to derive the test database URL');
  }
  return withDatabase(base, TEST_DB_NAME);
}

/** The maintenance (`postgres`) DB URL — used to CREATE the test database. */
export function maintenanceUrl(url: string): string {
  return withDatabase(url, 'postgres');
}

/**
 * Under Vitest, always resolve to the isolated test DB so tests can never touch
 * the dev/prod database; otherwise use the given URL as-is.
 */
export function activeDbUrl(databaseUrl: string): string {
  return process.env.VITEST ? resolveTestDbUrl() : databaseUrl;
}
