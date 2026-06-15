// Axios transport: one instance for the whole app. Interceptors inject the active
// locale (Accept-Language) and turn the API error envelope into a typed ApiError.
// This is the single seam between the web and the API.

import type { ApiErrorBody, ErrorCode } from '@timesheet/shared';
import axios, { type AxiosError } from 'axios';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Current locale for Accept-Language; the i18n provider keeps this in sync.
let currentLocale = 'en';
export function setApiLocale(locale: string) {
  currentLocale = locale;
}

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
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
