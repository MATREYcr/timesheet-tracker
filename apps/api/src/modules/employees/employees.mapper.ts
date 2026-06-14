// Maps a DB row to the API DTO (shared Employee type): derives `status` from
// `deactivatedAt` and serializes timestamps to ISO strings.

import type { Employee } from '@timesheet/shared';
import type { EmployeeRow } from '../../db/schema.js';

export function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    hourlyRate: row.hourlyRate,
    deactivatedAt: row.deactivatedAt ? row.deactivatedAt.toISOString() : null,
    status: row.deactivatedAt ? 'inactive' : 'active',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
