import type { ErrorCode } from '@timesheet/shared';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  FUTURE_DATE: 400,
  NOT_FOUND: 404,
  EMPLOYEE_INACTIVE: 409,
  WEEK_LOCKED: 409,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(code);
    this.name = 'AppError';
  }

  get status(): number {
    return ERROR_STATUS[this.code];
  }
}
