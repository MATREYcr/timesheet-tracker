import type { ApiErrorBody } from '@timesheet/shared';
import axios, { type AxiosError } from 'axios';
import { ApiError } from './api-error';
import { isAuthPath, loginPath } from './auth-routes';
import { env } from './env';

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  // Read locale from the <html lang> attribute set server-side by [locale]/layout.tsx.
  const locale =
    typeof document !== 'undefined'
      ? document.documentElement.lang || 'en'
      : 'en';
  config.headers.set('Accept-Language', locale);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data;
    if (body?.error?.code === 'UNAUTHORIZED' && typeof window !== 'undefined') {
      redirectToLogin();
    }
    if (body?.error) {
      return Promise.reject(
        new ApiError(
          body.error.code,
          body.error.message,
          error.response?.status ?? 500,
        ),
      );
    }
    return Promise.reject(error);
  },
);

// Full navigation so the proxy re-evaluates the (now expired) session cookie.
function redirectToLogin() {
  const locale = document.documentElement.lang || 'en';
  const prefix = `/${locale}`;
  const { pathname, search } = window.location;
  const path =
    pathname === prefix
      ? '/'
      : pathname.replace(new RegExp(`^${prefix}(?=/)`), '');
  if (isAuthPath(path)) return;
  window.location.assign(loginPath(locale, `${path}${search}`));
}
