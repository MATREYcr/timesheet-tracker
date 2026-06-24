import { z } from 'zod';
import { weekStartSchema } from '../core/dates.js';
import { employeeIdSchema } from './employee.js';

// Absence of a stored row means `pending`. Only `approved` locks the week.
export const APPROVAL_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;
export type ApprovalStatus =
  (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

export const APPROVAL_STATUS_VALUES = Object.values(APPROVAL_STATUS) as [
  ApprovalStatus,
  ...ApprovalStatus[],
];

export interface WeeklyApproval {
  id: string;
  employeeId: string;
  weekStart: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

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
