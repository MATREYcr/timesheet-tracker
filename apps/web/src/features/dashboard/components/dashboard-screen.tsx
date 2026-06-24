'use client';

import { CalendarDays } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PageHeader } from '@/components/page-header';
import { QueryError } from '@/components/query-error';
import { Skeleton } from '@/components/ui/skeleton';
import { formatWeekRange } from '@/lib/format';
import { ENTER } from '@/lib/motion';
import { useDashboard } from '../hooks';
import { DashboardStats } from './dashboard-stats';
import { PendingApprovals } from './pending-approvals';

export function DashboardScreen() {
  const t = useTranslations('home');
  const locale = useLocale();
  const {
    weekStart,
    weekEnd,
    activeEmployees,
    totalHours,
    totalPay,
    pending,
    pendingCount,
    isPending,
    isError,
    refetch,
  } = useDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <span className="bg-primary-soft text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <CalendarDays className="size-4" />
          <span className="uppercase tracking-wide">{t('subtitle')}</span>
          <span className="text-primary/40">·</span>
          <span className="tabular-nums">
            {formatWeekRange(weekStart, weekEnd, locale)}
          </span>
        </span>
      </PageHeader>

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <QueryError onRetry={refetch} />
      ) : (
        <div className={`space-y-12 ${ENTER}`}>
          <DashboardStats
            activeEmployees={activeEmployees}
            totalHours={totalHours}
            totalPay={totalPay}
            pendingCount={pendingCount}
          />
          <PendingApprovals rows={pending} count={pendingCount} />
        </div>
      )}
    </div>
  );
}
