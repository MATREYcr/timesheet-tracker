import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/config/env';
import * as schema from '@/db/schema';
import { activeDbUrl } from '@/db/test-database';

// Under Vitest this resolves to an isolated test DB; otherwise the configured one.
const queryClient = postgres(activeDbUrl(env.DATABASE_URL));

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;

/** Close the underlying connection (used by tests / graceful shutdown). */
export function closeDb() {
  return queryClient.end();
}
