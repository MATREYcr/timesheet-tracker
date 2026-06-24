import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { HttpStatus } from '@/common/http-status';
import type { ApiErrorBody } from '@timesheet/shared';
import { AppError } from './app-error';
import { DEFAULT_LOCALE, getMessage } from './messages';
import type { AppEnv } from '@/common/types';
import { env } from '@/config/env';

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  const locale = c.get('locale') ?? DEFAULT_LOCALE;

  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: getMessage(err.code, locale) },
    };
    return c.json(body, err.status as ContentfulStatusCode);
  }

  if (env.NODE_ENV !== 'production') {
    console.error(err.stack ?? err);
  } else {
    console.error(err.message);
  }
  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: getMessage('INTERNAL_ERROR', locale),
    },
  };
  return c.json(body, HttpStatus.INTERNAL_SERVER_ERROR);
};
