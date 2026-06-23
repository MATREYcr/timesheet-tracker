// The weekly-approval concept: an (employee, week) status that, when `approved`,
// locks the week's time entries. Absence of a stored row means `pending`.

import { z } from 'zod';
import { weekStartSchema } from '../core/dates.js';
import { employeeIdSchema } from './employee.js';

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
 * Approval status of a single (employee, week). `status` is `pending` when no
 * approval row exists. Returned by the approval lookup and the approve/reject
 * actions; the web uses it to lock entries in approved weeks. Single source of
 * truth for the shape — the type derives from this schema; the API decorates it.
 */
export const weekApprovalStatusSchema = z.object({
  employeeId: employeeIdSchema,
  weekStart: weekStartSchema,
  status: z.enum(APPROVAL_STATUS_VALUES),
});

export type WeekApprovalStatus = z.infer<typeof weekApprovalStatusSchema>;

export const weeklyApprovalActionSchema = z.object({
  employeeId: employeeIdSchema,
  weekStart: weekStartSchema,
});

export type WeeklyApprovalActionInput = z.infer<
  typeof weeklyApprovalActionSchema
>;
