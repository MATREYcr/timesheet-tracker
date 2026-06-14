// Validated environment. Parsed once at startup so the app fails fast with a clear
// message instead of blowing up later on an undefined value. No scattered
// `process.env` reads or hardcoded fallbacks elsewhere.

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().int().positive().default(3333),
  /** Allowed CORS origin for the web client. '*' is fine for local dev. */
  CORS_ORIGIN: z.string().min(1).default('*'),
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
