// Domain types shared across API and web. Plain TypeScript, no framework imports.
// Status values use `as const` (not TS enum): reusable constants + the literal type.

/** Derived from `deactivatedAt`: active when null, otherwise inactive. */
export const EMPLOYEE_STATUS = {
  active: 'active',
  inactive: 'inactive',
} as const;
export type EmployeeStatus =
  (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

/** Absence of a stored row means `pending`. Only `approved` locks the week. */
export const APPROVAL_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;
export type ApprovalStatus =
  (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

/** Tuple of approval values for places that need an array (Drizzle pgEnum, Zod). */
export const APPROVAL_STATUS_VALUES = Object.values(APPROVAL_STATUS) as [
  ApprovalStatus,
  ...ApprovalStatus[],
];

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  /** Hourly rate in the currency's major unit (e.g. dollars), e.g. 22.5. */
  hourlyRate: number;
  /** ISO timestamp when deactivated, or null when active. */
  deactivatedAt: string | null;
  /** Derived convenience field (active | inactive). */
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  /** Date-only, `YYYY-MM-DD`, no time, no timezone. */
  date: string;
  /** Hours worked, 0.25–24 in 0.25 increments. */
  hours: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyApproval {
  id: string;
  employeeId: string;
  /** Monday of the week, date-only `YYYY-MM-DD`. */
  weekStart: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Raw per-employee aggregate the API returns for a week. The API does NOT
 * compute pay — the web client derives it via `calculateWeeklyPay`.
 */
export interface WeeklySummaryRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  totalHours: number;
  status: ApprovalStatus;
}
