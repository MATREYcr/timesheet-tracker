import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@timesheet/shared';
import { env } from '@/config/env';
import { db } from '@/db/client';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CORS_ORIGIN],
  database: drizzleAdapter(db, { provider: 'pg', schema, usePlural: true }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  advanced: {
    database: { generateId: 'uuid' },
    // Better Auth skips the origin/CSRF check under NODE_ENV=test by default; pin it on so
    // the integration tests exercise the same protection as production.
    disableOriginCheck: false,
  },
  telemetry: { enabled: false },
});

export type AuthSession = typeof auth.$Infer.Session;
