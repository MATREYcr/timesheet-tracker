// Weekly summary: the API returns the RAW aggregate per employee (total hours,
// rate, approval status). It does NOT compute pay — the web client derives
// regular/overtime/pay via calculateWeeklyPay from @timesheet/shared.

import {
  getWeekEnd,
  type ApprovalStatus,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { AppError } from '../../common/errors.js';
import { db } from '../../db/client.js';
import {
  employees,
  timeEntries,
  weeklyApprovals,
} from '../../db/schema/index.js';

export async function getWeeklySummary(
  weekStart: string,
): Promise<WeeklySummaryRow[]> {
  const weekEnd = getWeekEnd(weekStart);

  const rows = await db
    .select({
      employeeId: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      hourlyRate: employees.hourlyRate,
      totalHours: sql<string>`sum(${timeEntries.hours})`,
      status: sql<ApprovalStatus>`coalesce(${weeklyApprovals.status}, 'pending')`,
    })
    .from(timeEntries)
    .innerJoin(employees, eq(employees.id, timeEntries.employeeId))
    .leftJoin(
      weeklyApprovals,
      and(
        eq(weeklyApprovals.employeeId, employees.id),
        eq(weeklyApprovals.weekStart, weekStart),
      ),
    )
    .where(
      and(gte(timeEntries.date, weekStart), lte(timeEntries.date, weekEnd)),
    )
    .groupBy(employees.id, weeklyApprovals.status)
    .orderBy(asc(employees.firstName), asc(employees.lastName));

  // sum() comes back as a string from Postgres numeric — normalize to number.
  return rows.map((row) => ({ ...row, totalHours: Number(row.totalHours) }));
}

async function setStatus(
  employeeId: string,
  weekStart: string,
  status: ApprovalStatus,
) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId));
  if (!employee) throw new AppError('NOT_FOUND');

  await db
    .insert(weeklyApprovals)
    .values({ employeeId, weekStart, status })
    .onConflictDoUpdate({
      target: [weeklyApprovals.employeeId, weeklyApprovals.weekStart],
      set: { status, updatedAt: new Date() },
    });

  return { employeeId, weekStart, status };
}

export function approveWeek(employeeId: string, weekStart: string) {
  return setStatus(employeeId, weekStart, 'approved');
}

export function rejectWeek(employeeId: string, weekStart: string) {
  return setStatus(employeeId, weekStart, 'rejected');
}
