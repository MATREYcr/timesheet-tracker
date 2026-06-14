// Time entries business logic. Enforces the DB-dependent rules: the employee must
// be active (on create), and the entry's week must not be approved/locked
// (create/edit/delete). Hours range / no-future-date are enforced by the shared
// Zod schema at the route boundary. Mutations run in a transaction so the
// week-locked check and the write are atomic.

import {
  getWeekEnd,
  getWeekStart,
  type CreateTimeEntryInput,
  type UpdateTimeEntryInput,
} from '@timesheet/shared';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { AppError } from '../../common/errors.js';
import { db } from '../../db/client.js';
import {
  employees,
  timeEntries,
  weeklyApprovals,
  type TimeEntryRow,
} from '../../db/schema.js';
import { toTimeEntry } from './time-entries.mapper.js';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function assertWeekNotApproved(tx: Tx, employeeId: string, date: string) {
  const weekStart = getWeekStart(date);
  const [approval] = await tx
    .select()
    .from(weeklyApprovals)
    .where(
      and(
        eq(weeklyApprovals.employeeId, employeeId),
        eq(weeklyApprovals.weekStart, weekStart),
      ),
    );
  if (approval?.status === 'approved') {
    throw new AppError('WEEK_LOCKED');
  }
}

async function findEntryOrThrow(tx: Tx, id: string): Promise<TimeEntryRow> {
  const [row] = await tx
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.id, id));
  if (!row) throw new AppError('NOT_FOUND');
  return row;
}

export async function listTimeEntries(employeeId: string, weekStart?: string) {
  const conditions = [eq(timeEntries.employeeId, employeeId)];
  if (weekStart) {
    conditions.push(
      gte(timeEntries.date, weekStart),
      lte(timeEntries.date, getWeekEnd(weekStart)),
    );
  }
  const rows = await db
    .select()
    .from(timeEntries)
    .where(and(...conditions))
    .orderBy(asc(timeEntries.date));
  return rows.map(toTimeEntry);
}

export function createTimeEntry(input: CreateTimeEntryInput) {
  return db.transaction(async (tx) => {
    const [employee] = await tx
      .select()
      .from(employees)
      .where(eq(employees.id, input.employeeId));
    if (!employee) throw new AppError('NOT_FOUND');
    if (employee.deactivatedAt) throw new AppError('EMPLOYEE_INACTIVE');

    await assertWeekNotApproved(tx, input.employeeId, input.date);

    const [row] = await tx.insert(timeEntries).values(input).returning();
    return toTimeEntry(row);
  });
}

export function updateTimeEntry(id: string, input: UpdateTimeEntryInput) {
  return db.transaction(async (tx) => {
    const entry = await findEntryOrThrow(tx, id);
    // The current week must be open...
    await assertWeekNotApproved(tx, entry.employeeId, entry.date);
    // ...and if the date moves to another week, that week must be open too.
    if (input.date && input.date !== entry.date) {
      await assertWeekNotApproved(tx, entry.employeeId, input.date);
    }

    const [row] = await tx
      .update(timeEntries)
      .set(input)
      .where(eq(timeEntries.id, id))
      .returning();
    return toTimeEntry(row);
  });
}

export function deleteTimeEntry(id: string) {
  return db.transaction(async (tx) => {
    const entry = await findEntryOrThrow(tx, id);
    await assertWeekNotApproved(tx, entry.employeeId, entry.date);
    await tx.delete(timeEntries).where(eq(timeEntries.id, id));
  });
}
