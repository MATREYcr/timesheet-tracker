// Thin wrapper over @hono/zod-validator so validation failures flow through our
// error envelope (as VALIDATION_ERROR) instead of zod-validator's default 400.

import { zValidator } from '@hono/zod-validator';
import type { ZodType } from 'zod';
import { AppError } from '../common/errors.js';

type Target = 'json' | 'query' | 'param' | 'header' | 'form';

export function validate<T extends ZodType>(target: Target, schema: T) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError('VALIDATION_ERROR');
    }
  });
}
