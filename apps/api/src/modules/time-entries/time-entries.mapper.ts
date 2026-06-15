import type { TimeEntry } from '@timesheet/shared';
import type { TimeEntryRow } from '../../db/schema/index.js';

export function toTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    employeeId: row.employeeId,
    date: row.date,
    hours: row.hours,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
