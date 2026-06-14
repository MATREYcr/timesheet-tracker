// Domain types shared across API and web. Plain TypeScript, no framework imports.

/** Derived from `deactivatedAt`: active when null, otherwise inactive. */
export type EmployeeStatus = 'active' | 'inactive';

/** Absence of a stored row means `pending`. Only `approved` locks the week. */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

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
