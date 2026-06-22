// Canonical, stable error codes shared by the API and the web client.
// The human-readable en/es messages live in the API (per spec 02); here we only
// define the machine-readable contract so both sides agree on the codes.

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'EMPLOYEE_INACTIVE'
  | 'FUTURE_DATE'
  | 'WEEK_LOCKED'
  | 'INTERNAL_ERROR';

/** The consistent error envelope every API error responds with. */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
  };
}
