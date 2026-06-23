// The Employee concept: its domain type and the validation that governs it.
// Status values use `as const` (not a TS enum): reusable constants + literal type.

import { z } from 'zod';

/** Derived from `deactivatedAt`: active when null, otherwise inactive. */
export const EMPLOYEE_STATUS = {
  active: 'active',
  inactive: 'inactive',
} as const;
export type EmployeeStatus =
  (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

/**
 * An employee as returned by the API. Single source of truth for the shape: the
 * `Employee` type is derived from this schema, and the API decorates it for OpenAPI.
 */
export const employeeSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  /** Hourly rate in the currency's major unit (e.g. dollars), e.g. 22.5. */
  hourlyRate: z.number(),
  /** ISO timestamp when deactivated, or null when active. */
  deactivatedAt: z.string().nullable(),
  /** Derived convenience field (active | inactive). */
  status: z.enum([EMPLOYEE_STATUS.active, EMPLOYEE_STATUS.inactive]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;

/** An employee identifier. Reused by every concept that references an employee. */
export const employeeIdSchema = z.uuid();

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  hourlyRate: z
    .number()
    .positive('Hourly rate must be greater than 0')
    .max(10000),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
