type AuthError = { code?: string; status?: number } | null | undefined;

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'tooManyRequests'
  | 'generic';

export function authErrorKey(error: AuthError): AuthErrorKey {
  if (error?.status === 429) return 'tooManyRequests';
  switch (error?.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'invalidCredentials';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'emailTaken';
    default:
      return 'generic';
  }
}
