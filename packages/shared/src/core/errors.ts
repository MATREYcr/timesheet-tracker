// en/es messages live in the API; here only the machine-readable codes.
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'EMPLOYEE_INACTIVE',
  'FUTURE_DATE',
  'WEEK_LOCKED',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
  };
}
