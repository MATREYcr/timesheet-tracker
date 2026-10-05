import { createAuthClient } from 'better-auth/react';
import { env } from './env';

// Auth lives in the API (/api/auth/*); the client sends credentials by default.
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
});
