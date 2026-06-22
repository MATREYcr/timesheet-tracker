'use client';

import { getCurrentWeekStart, type Employee } from '@timesheet/shared';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmployeeCombobox } from '@/components/employee-combobox';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { QueryError } from '@/components/query-error';
import { TablePagination } from '@/components/table-pagination';
import { TableSkeleton } from '@/components/table-skeleton';
import { WeekPicker } from '@/components/week-picker';
import { ENTER } from '@/lib/motion';
import { useWeeklySummary } from '../hooks';
import { WeeklySummaryTable } from './weekly-summary-table';

export function WeeklySummaryScreen() {
  const { t } = useTranslation();
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
  const [selected, setSelected] = useState<Employee | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useWeeklySummary(
    weekStart,
    page,
    10,
    selected?.id,
  );

  const changeWeek = (next: string) => {
    setWeekStart(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('weeklySummary.title')}
        description={t('weeklySummary.subtitle')}
      >
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <EmployeeCombobox
            value={selected}
            onChange={(employee) => {
              setSelected(employee);
              setPage(1);
            }}
            allLabel={t('common.allEmployees')}
            className="w-full sm:w-64"
          />
          <WeekPicker weekStart={weekStart} onChange={changeWeek} />
        </div>
      </PageHeader>

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={<CalendarRange />}
          title={t('weeklySummary.empty.title')}
          description={t('weeklySummary.empty.description')}
        />
      ) : (
        <div
          className={`bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm ${ENTER}`}
        >
          <WeeklySummaryTable
            rows={data.data}
            weekStart={weekStart}
            containerClassName="max-h-[calc(100dvh-20rem)] overflow-auto"
          />
          <TablePagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
