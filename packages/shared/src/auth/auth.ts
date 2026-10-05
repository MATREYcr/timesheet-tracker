import { z } from 'zod';

// Messages are stable keys, not copy: the web resolves them against its en/es catalogs.
export const AUTH_VALIDATION = {
  nameRequired: 'nameRequired',
  nameTooLong: 'nameTooLong',
  emailInvalid: 'emailInvalid',
  passwordRequired: 'passwordRequired',
  passwordTooShort: 'passwordTooShort',
  passwordTooLong: 'passwordTooLong',
} as const;

export type AuthValidationKey =
  (typeof AUTH_VALIDATION)[keyof typeof AUTH_VALIDATION];

export function isAuthValidationKey(value: string): value is AuthValidationKey {
  return Object.values<string>(AUTH_VALIDATION).includes(value);
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email(AUTH_VALIDATION.emailInvalid));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, AUTH_VALIDATION.passwordRequired),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, AUTH_VALIDATION.nameRequired)
    .max(100, AUTH_VALIDATION.nameTooLong),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, AUTH_VALIDATION.passwordTooShort)
    .max(PASSWORD_MAX_LENGTH, AUTH_VALIDATION.passwordTooLong),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
