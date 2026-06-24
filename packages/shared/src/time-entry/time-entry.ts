import { z } from 'zod';
import { pastOrToday } from '../utils/dates.js';
import { employeeIdSchema } from '../employee/employee.js';

export const timeEntrySchema = z.object({
  id: z.uuid(),
  employeeId: employeeIdSchema,
  date: z.string(),
  hours: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TimeEntry = z.infer<typeof timeEntrySchema>;

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

export const updateTimeEntrySchema = z
  .object({
    date: pastOrToday,
    hours: hoursSchema,
  })
  .partial();

export const timeEntryFormSchema = createTimeEntrySchema.omit({
  employeeId: true,
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type TimeEntryFormInput = z.infer<typeof timeEntryFormSchema>;
