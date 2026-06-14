// Drizzle schema. snake_case columns in the DB, camelCase in TS.
// Money/hours are `numeric` (never float). Date-only values use `date`; audit
// fields use `timestamp`. Soft delete via `deactivated_at` (no row removal).

import { sql } from 'drizzle-orm';
import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const approvalStatus = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  hourlyRate: numeric('hourly_rate', {
    precision: 10,
    scale: 2,
    mode: 'number',
  }).notNull(),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const timeEntries = pgTable(
  'time_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id),
    date: date('date', { mode: 'string' }).notNull(),
    hours: numeric('hours', {
      precision: 5,
      scale: 2,
      mode: 'number',
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('time_entries_employee_date_idx').on(table.employeeId, table.date),
  ],
);

export const weeklyApprovals = pgTable(
  'weekly_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id),
    weekStart: date('week_start', { mode: 'string' }).notNull(),
    status: approvalStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex('weekly_approvals_employee_week_idx').on(
      table.employeeId,
      table.weekStart,
    ),
  ],
);

export type EmployeeRow = typeof employees.$inferSelect;
export type TimeEntryRow = typeof timeEntries.$inferSelect;
export type WeeklyApprovalRow = typeof weeklyApprovals.$inferSelect;
