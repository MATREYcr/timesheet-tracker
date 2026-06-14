import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load the repo-root .env regardless of where drizzle-kit is invoked from.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../.env') });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
