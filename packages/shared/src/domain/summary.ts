// Read-models computed from time entries + approvals. Returned by the API; they
// carry no input validation (no one submits them), but the shape is single-sourced
// here as Zod schemas so the types derive from them and the API can decorate them
// for OpenAPI.

import { z } from 'zod';
import { APPROVAL_STATUS_VALUES } from './approval.js';

/**
 * Raw per-employee aggregate the API returns for a week. The API does NOT
 * compute pay — the web client derives it via `calculateWeeklyPay`.
 */
export const weeklySummaryRowSchema = z.object({
  employeeId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  hourlyRate: z.number(),
  totalHours: z.number(),
  status: z.enum(APPROVAL_STATUS_VALUES),
});

export type WeeklySummaryRow = z.infer<typeof weeklySummaryRowSchema>;

/**
 * Aggregated "this week" snapshot for the dashboard. The API computes the scalar
 * KPIs server-side (counts in SQL; `totalPay` via the shared `calculateWeeklyPay`)
 * so the client doesn't over-fetch. `pending` carries only the preview rows for
 * the list; `pendingCount` is the full number of pending weeks.
 */
export const dashboardSummarySchema = z.object({
  weekStart: z.string(),
  activeEmployees: z.number().int(),
  totalHours: z.number(),
  totalPay: z.number(),
  pendingCount: z.number().int(),
  pending: z.array(weeklySummaryRowSchema),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
