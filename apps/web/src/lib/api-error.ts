import type { ErrorCode } from '@timesheet/shared';

/**
 * The client's view of a received API error envelope. Pure value type, kept out of
 * `http.ts` so consumers can `instanceof`-check it without pulling in the axios
 * instance and its interceptor side-effects.
 */
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
