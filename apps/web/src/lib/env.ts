import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:3333'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error('Invalid environment configuration. See .env.example.');
}

export const env = parsed.data;
