import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@timesheet/shared';
import { env } from '@/config/env';
import { db } from '@/db/client';
import * as schema from '@/db/schema';

const DAY_SECONDS = 60 * 60 * 24;

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
  // Pinned (rather than library defaults) because the authentication spec promises them.
  session: {
    expiresIn: 7 * DAY_SECONDS,
    updateAge: DAY_SECONDS,
  },
  advanced: {
    database: { generateId: 'uuid' },
    useSecureCookies: env.NODE_ENV === 'production',
    // Better Auth skips the origin/CSRF check under NODE_ENV=test by default; pin it on so
    // the integration tests exercise the same protection as production.
    disableOriginCheck: false,
  },
  telemetry: { enabled: false },
});

export type AuthSession = typeof auth.$Infer.Session;
