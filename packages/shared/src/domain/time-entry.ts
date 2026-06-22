// The TimeEntry concept: its domain type and validation. DB-dependent rules
// (employee must be active, week not approved) are enforced in the API, not here.

import { z } from 'zod';
import { pastOrToday } from '../core/dates.js';
import { employeeIdSchema } from './employee.js';

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

/** Hours worked: 0.25–24 inclusive, in quarter-hour steps. */
export const hoursSchema = z
  .number()
  .min(0.25, 'Hours must be at least 0.25')
  .max(24, 'Hours cannot exceed 24')
  .refine(
    (value) => Number.isInteger(value / 0.25),
    'Hours must be in 0.25 increments',
  );

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

/**
 * Fields of the time-entry form (the employee comes from screen context, not the
 * form). Derived from `createTimeEntrySchema` so validation stays single-sourced.
 */
export const timeEntryFormSchema = createTimeEntrySchema.omit({
  employeeId: true,
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type TimeEntryFormInput = z.infer<typeof timeEntryFormSchema>;
