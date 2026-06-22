import type { ApiErrorBody } from '@timesheet/shared';
import axios, { type AxiosError } from 'axios';
import { ApiError } from './api-error';
import { env } from './env';

// Current locale for Accept-Language; the i18n provider keeps this in sync.
let currentLocale = 'en';
export function setApiLocale(locale: string) {
  currentLocale = locale;
}

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
});

http.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', currentLocale);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data;
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
