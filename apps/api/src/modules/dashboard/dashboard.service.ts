import {
  APPROVAL_STATUS,
  calculateWeeklyPay,
  round2,
  type DashboardSummary,
} from '@timesheet/shared';
import { count, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { employees } from '@/db/schema';
import { selectWeeklyAggregate } from '@/modules/weekly-summary/weekly-summary.service';

const PENDING_PREVIEW = 5;

export async function getDashboard(weekStart: string): Promise<DashboardSummary> {
  const [{ activeEmployees }] = await db
    .select({ activeEmployees: count() })
    .from(employees)
    .where(isNull(employees.deactivatedAt));

  const normalized = await selectWeeklyAggregate(weekStart);

  const totalHours = normalized.reduce((sum, row) => sum + row.totalHours, 0);
  const totalPay = round2(
    normalized.reduce(
      (sum, row) => sum + calculateWeeklyPay(row.totalHours, row.hourlyRate).totalPay,
      0,
    ),
  );
  const pending = normalized.filter(
    (row) => row.status === APPROVAL_STATUS.pending,
  );

  return {
    weekStart,
    activeEmployees,
    totalHours,
    totalPay,
    pendingCount: pending.length,
    pending: pending.slice(0, PENDING_PREVIEW),
  };
}
