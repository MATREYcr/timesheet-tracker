import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { maintenanceUrl, resolveTestDbUrl } from '../src/db/test-database';

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../.env') }); // apps/api/.env

export default async function setup() {
  const testUrl = resolveTestDbUrl();
  const dbName = new URL(testUrl).pathname.slice(1);

  const admin = postgres(maintenanceUrl(testUrl), { max: 1 });
  try {
    const rows = await admin`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (rows.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }

  const client = postgres(testUrl, { max: 1 });
  try {
    await migrate(drizzle(client), {
      migrationsFolder: resolve(here, '../drizzle'),
    });
  } finally {
    await client.end();
  }
}
