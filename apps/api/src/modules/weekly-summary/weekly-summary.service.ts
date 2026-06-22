import {
  APPROVAL_STATUS,
  buildPaginated,
  getWeekEnd,
  type ApprovalStatus,
  type Paginated,
  type PaginationQuery,
  type WeekApprovalStatus,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import { and, asc, countDistinct, eq, gte, lte, sql } from 'drizzle-orm';
import { AppError } from '../../common/errors.js';
import { db } from '../../db/client.js';
import {
  employees,
  timeEntries,
  weeklyApprovals,
} from '../../db/schema/index.js';

export type WeeklyApprovalResult = WeekApprovalStatus;

export async function selectWeeklyAggregate(
  weekStart: string,
  {
    employeeId,
    pagination,
  }: { employeeId?: string; pagination?: { limit: number; offset: number } } = {},
): Promise<WeeklySummaryRow[]> {
  const where = employeeId
    ? and(inWeek(weekStart), eq(timeEntries.employeeId, employeeId))
    : inWeek(weekStart);

  const base = db
    .select({
      employeeId: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      hourlyRate: employees.hourlyRate,
      totalHours: sql<string>`sum(${timeEntries.hours})`,
      status: sql<ApprovalStatus>`coalesce(${weeklyApprovals.status}, ${APPROVAL_STATUS.pending})`,
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
    .where(where)
    .groupBy(employees.id, weeklyApprovals.status)
    .orderBy(asc(employees.firstName), asc(employees.lastName));

  const rows = pagination
    ? await base.limit(pagination.limit).offset(pagination.offset)
    : await base;
  return rows.map((row) => ({ ...row, totalHours: Number(row.totalHours) }));
}

export async function getWeeklySummary(
  weekStart: string,
  { page, pageSize }: PaginationQuery,
  employeeId?: string,
): Promise<Paginated<WeeklySummaryRow>> {
  const where = employeeId
    ? and(inWeek(weekStart), eq(timeEntries.employeeId, employeeId))
    : inWeek(weekStart);

  const [{ total }] = await db
    .select({ total: countDistinct(timeEntries.employeeId) })
    .from(timeEntries)
    .where(where);

  const data = await selectWeeklyAggregate(weekStart, {
    employeeId,
    pagination: { limit: pageSize, offset: (page - 1) * pageSize },
  });
  return buildPaginated(data, total, page, pageSize);
}

export async function getApprovalStatus(
  employeeId: string,
  weekStart: string,
): Promise<WeekApprovalStatus> {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.id, employeeId));
  if (!employee) throw new AppError('NOT_FOUND');

  const [approval] = await db
    .select({ status: weeklyApprovals.status })
    .from(weeklyApprovals)
    .where(
      and(
        eq(weeklyApprovals.employeeId, employeeId),
        eq(weeklyApprovals.weekStart, weekStart),
      ),
    );

  return {
    employeeId,
    weekStart,
    status: approval?.status ?? APPROVAL_STATUS.pending,
  };
}

async function setStatus(
  employeeId: string,
  weekStart: string,
  status: ApprovalStatus,
): Promise<WeeklyApprovalResult> {
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

export function approveWeek(
  employeeId: string,
  weekStart: string,
): Promise<WeeklyApprovalResult> {
  return setStatus(employeeId, weekStart, APPROVAL_STATUS.approved);
}

export function rejectWeek(
  employeeId: string,
  weekStart: string,
): Promise<WeeklyApprovalResult> {
  return setStatus(employeeId, weekStart, APPROVAL_STATUS.rejected);
}

function inWeek(weekStart: string) {
  return and(
    gte(timeEntries.date, weekStart),
    lte(timeEntries.date, getWeekEnd(weekStart)),
  );
}
