import { z } from 'zod';

export const EMPLOYEE_STATUS = {
  active: 'active',
  inactive: 'inactive',
} as const;
export type EmployeeStatus =
  (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

export const employeeSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  hourlyRate: z.number(),
  deactivatedAt: z.string().nullable(),
  status: z.enum([EMPLOYEE_STATUS.active, EMPLOYEE_STATUS.inactive]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;

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
