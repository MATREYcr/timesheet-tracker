import type { ErrorCode } from '@timesheet/shared';
import { HttpStatus } from '../http-status.js';

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  FUTURE_DATE: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  EMPLOYEE_INACTIVE: HttpStatus.CONFLICT,
  WEEK_LOCKED: HttpStatus.CONFLICT,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
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
