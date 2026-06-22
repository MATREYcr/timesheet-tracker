// Read-models computed from time entries + approvals. These are returned by the
// API but carry no validation of their own (no one submits them as input).

import type { ApprovalStatus } from './approval.js';

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

/**
 * Aggregated "this week" snapshot for the dashboard. The API computes the scalar
 * KPIs server-side (counts in SQL; `totalPay` via the shared `calculateWeeklyPay`)
 * so the client doesn't over-fetch. `pending` carries only the preview rows for
 * the list; `pendingCount` is the full number of pending weeks.
 */
export interface DashboardSummary {
  weekStart: string;
  activeEmployees: number;
  totalHours: number;
  totalPay: number;
  pendingCount: number;
  pending: WeeklySummaryRow[];
}
