import {
  date,
  index,
  numeric,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { employees } from './employees';

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
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('time_entries_employee_date_idx').on(table.employeeId, table.date),
  ],
);

export type TimeEntryRow = typeof timeEntries.$inferSelect;
