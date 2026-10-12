import { createAuthClient } from 'better-auth/react';
import { env } from './env';

export const authClient = createAuthClient({
  // Full endpoint URL: Better Auth only appends /api/auth when the URL has no path (e.g. /backend).
  baseURL: `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/auth`,
});
