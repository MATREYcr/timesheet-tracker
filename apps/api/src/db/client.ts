// Single Drizzle client for the API, backed by postgres-js.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and start Postgres.',
  );
}

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
