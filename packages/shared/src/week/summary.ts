import { z } from 'zod';
import { APPROVAL_STATUS_VALUES } from '../approval/approval.js';

// The API does NOT compute pay — the web client derives it via `calculateWeeklyPay`.
export const weeklySummaryRowSchema = z.object({
  employeeId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  hourlyRate: z.number(),
  totalHours: z.number(),
  status: z.enum(APPROVAL_STATUS_VALUES),
});

export type WeeklySummaryRow = z.infer<typeof weeklySummaryRowSchema>;

export const dashboardSummarySchema = z.object({
  weekStart: z.string(),
  activeEmployees: z.number().int(),
  totalHours: z.number(),
  totalPay: z.number(),
  pendingCount: z.number().int(),
  pending: z.array(weeklySummaryRowSchema),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
