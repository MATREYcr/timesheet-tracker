import { APPROVAL_STATUS, APPROVAL_STATUS_VALUES } from '@timesheet/shared';
import {
  date,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { employees } from './employees.js';

export const approvalStatus = pgEnum('approval_status', APPROVAL_STATUS_VALUES);

export const weeklyApprovals = pgTable(
  'weekly_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id),
    weekStart: date('week_start', { mode: 'string' }).notNull(),
    status: approvalStatus('status').notNull().default(APPROVAL_STATUS.pending),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('weekly_approvals_employee_week_idx').on(
      table.employeeId,
      table.weekStart,
    ),
  ],
);

export type WeeklyApprovalRow = typeof weeklyApprovals.$inferSelect;
