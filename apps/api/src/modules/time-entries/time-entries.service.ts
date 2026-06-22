import {
  APPROVAL_STATUS,
  getWeekEnd,
  getWeekStart,
  type CreateTimeEntryInput,
  type TimeEntry,
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
} from '../../db/schema/index.js';
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
  if (approval?.status === APPROVAL_STATUS.approved) {
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

export async function listTimeEntries(
  employeeId: string,
  weekStart?: string,
): Promise<TimeEntry[]> {
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

export function createTimeEntry(
  input: CreateTimeEntryInput,
): Promise<TimeEntry> {
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

export function updateTimeEntry(
  id: string,
  input: UpdateTimeEntryInput,
): Promise<TimeEntry> {
  return db.transaction(async (tx) => {
    const entry = await findEntryOrThrow(tx, id);
    await assertWeekNotApproved(tx, entry.employeeId, entry.date);
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

export function deleteTimeEntry(id: string): Promise<void> {
  return db.transaction(async (tx) => {
    const entry = await findEntryOrThrow(tx, id);
    await assertWeekNotApproved(tx, entry.employeeId, entry.date);
    await tx.delete(timeEntries).where(eq(timeEntries.id, id));
  });
}
