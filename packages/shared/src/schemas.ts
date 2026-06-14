// Zod schemas — the single source of validation truth for both the API (request
// parsing) and the web (form validation). Rules that need the database (employee
// must be active, week not approved) are enforced in the API, not here.

import { z } from 'zod';
import { getWeekStart, isFutureDate } from './dates.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in `YYYY-MM-DD` form (rejects e.g. 2026-02-30). */
const dateOnly = z
  .string()
  .regex(DATE_RE, 'Date must be in YYYY-MM-DD format')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return (
      d.getUTCFullYear() === year &&
      d.getUTCMonth() === month - 1 &&
      d.getUTCDate() === day
    );
  }, 'Invalid calendar date');

const pastOrToday = dateOnly.refine(
  (value) => !isFutureDate(value),
  'Date cannot be in the future',
);

/** Hours worked: 0.25–24 inclusive, in quarter-hour steps. */
export const hoursSchema = z
  .number()
  .min(0.25, 'Hours must be at least 0.25')
  .max(24, 'Hours cannot exceed 24')
  .refine(
    (value) => Number.isInteger(value / 0.25),
    'Hours must be in 0.25 increments',
  );

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

export const createTimeEntrySchema = z.object({
  employeeId: employeeIdSchema,
  date: pastOrToday,
  hours: hoursSchema,
});

/** Editable fields of a time entry (the employee cannot be reassigned). */
export const updateTimeEntrySchema = z
  .object({
    date: pastOrToday,
    hours: hoursSchema,
  })
  .partial();

/** A `weekStart` must be the Monday of its week. */
export const weekStartSchema = dateOnly.refine(
  (value) => getWeekStart(value) === value,
  'weekStart must be a Monday',
);

export const weeklyApprovalActionSchema = z.object({
  employeeId: employeeIdSchema,
  weekStart: weekStartSchema,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type WeeklyApprovalActionInput = z.infer<
  typeof weeklyApprovalActionSchema
>;
