// Single Drizzle client for the API, backed by postgres-js.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

const queryClient = postgres(env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;

/** Close the underlying connection (used by tests / graceful shutdown). */
export function closeDb() {
  return queryClient.end();
}
