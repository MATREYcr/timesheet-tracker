// Central handler -> localized `{ error: { code, message } }`. Unexpected errors
// collapse to INTERNAL_ERROR so internals never leak.

import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiErrorBody } from '@timesheet/shared';
import { AppError } from './errors.js';
import { DEFAULT_LOCALE, getMessage } from './i18n.js';
import type { AppEnv } from './types.js';

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  const locale = c.get('locale') ?? DEFAULT_LOCALE;

  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: getMessage(err.code, locale) },
    };
    return c.json(body, err.status as ContentfulStatusCode);
  }

  console.error(err);
  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: getMessage('INTERNAL_ERROR', locale),
    },
  };
  return c.json(body, 500);
};
