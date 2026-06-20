'use client';

import {
  APPROVAL_STATUS,
  calculateWeeklyPay,
  getCurrentWeekStart,
  getWeekEnd,
} from '@timesheet/shared';
import {
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  Hourglass,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '@/features/employees/hooks';
import { useWeeklySummary } from '@/features/weekly-summary/hooks';
import { useLocale } from '@/i18n/use-locale';
import { formatCurrency, formatHours, formatWeekRange } from '@/lib/format';

const PENDING_PREVIEW = 5;

export default function Home() {
  const { t } = useTranslation();
  const locale = useLocale();

  const weekStart = getCurrentWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  // Active count comes free from the paginated envelope's `total`.
  const employees = useEmployees(false, 1, 1);
  // One generous page covers every employee with hours this week (seed << 100).
  const summary = useWeeklySummary(weekStart, 1, 100);

  const rows = summary.data?.data ?? [];
  const totalHours = rows.reduce((sum, row) => sum + row.totalHours, 0);
  const totalPayroll = rows.reduce(
    (sum, row) => sum + calculateWeeklyPay(row.totalHours, row.hourlyRate).totalPay,
    0,
  );
  const pending = rows.filter((row) => row.status === APPROVAL_STATUS.pending);

  const stats = [
    {
      key: 'activeEmployees',
      icon: Users,
      value: String(employees.data?.total ?? 0),
    },
    { key: 'hours', icon: Clock, value: formatHours(totalHours, locale) },
    {
      key: 'payroll',
      icon: DollarSign,
      value: formatCurrency(totalPayroll, locale),
    },
    { key: 'pending', icon: Hourglass, value: String(pending.length) },
  ] as const;

  const isPending = employees.isPending || summary.isPending;
  const isError = employees.isError || summary.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('home.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('home.description')}
          </p>
        </div>
        <span className="bg-primary-soft text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <CalendarDays className="size-4" />
          <span className="uppercase tracking-wide">{t('home.subtitle')}</span>
          <span className="text-primary/40">·</span>
          <span className="tabular-nums">
            {formatWeekRange(weekStart, weekEnd, locale)}
          </span>
        </span>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            {t('common.errorBody')}
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                employees.refetch();
                summary.refetch();
              }}
            >
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.key}
                className="bg-card rounded-xl border p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t(`home.kpi.${stat.key}`)}
                  </span>
                  <span className="bg-primary-soft text-primary flex size-9 items-center justify-center rounded-lg">
                    <stat.icon className="size-4" />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold tabular-nums">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card mt-12 overflow-hidden rounded-xl border shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="bg-primary-soft text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Hourglass className="size-4" />
                </span>
                <h2 className="truncate font-semibold">
                  {t('home.pending.title')}
                </h2>
                <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {pending.length}
                </span>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary shrink-0"
              >
                <Link href="/weekly-summary">
                  {t('home.pending.viewAll')}
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
            {pending.length === 0 ? (
              <p className="text-muted-foreground px-5 py-10 text-center text-sm">
                {t('home.pending.empty')}
              </p>
            ) : (
              <ul className="divide-y">
                {pending.slice(0, PENDING_PREVIEW).map((row) => {
                  const pay = calculateWeeklyPay(row.totalHours, row.hourlyRate);
                  return (
                    <li
                      key={row.employeeId}
                      className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5"
                    >
                      <span className="flex-1 truncate font-medium">
                        {row.firstName} {row.lastName}
                      </span>
                      <span className="text-muted-foreground hidden w-20 text-right text-sm tabular-nums sm:block">
                        {formatHours(row.totalHours, locale)}
                      </span>
                      <span className="text-right font-medium tabular-nums sm:w-24">
                        {formatCurrency(pay.totalPay, locale)}
                      </span>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      >
                        <Link href="/weekly-summary">
                          {t('home.pending.review')}
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
