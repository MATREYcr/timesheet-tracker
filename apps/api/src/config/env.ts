import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Optional: isolated DB for tests. If unset, it's derived from DATABASE_URL
  // (the same Postgres, database name swapped to `timesheet_test`).
  TEST_DATABASE_URL: z.string().min(1).optional(),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().min(1).default('*'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error(
    'Invalid environment configuration. Copy .env.example to .env.',
  );
}

export const env = parsed.data;
