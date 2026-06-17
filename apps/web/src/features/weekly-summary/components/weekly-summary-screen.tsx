'use client';

import { getCurrentWeekStart } from '@timesheet/shared';
import { CalendarRange } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeekPicker } from '@/components/week-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeeklySummary } from '../hooks';
import { WeeklySummaryTable } from './weekly-summary-table';

const SKELETON_ROWS = 4;

export function WeeklySummaryScreen() {
  const { t } = useTranslation();
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
  const { data, isPending, isError, refetch } = useWeeklySummary(weekStart);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('weeklySummary.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('weeklySummary.subtitle')}
          </p>
        </div>
        <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarRange />
            </EmptyMedia>
            <EmptyTitle>{t('weeklySummary.empty.title')}</EmptyTitle>
            <EmptyDescription>
              {t('weeklySummary.empty.description')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <WeeklySummaryTable rows={data} weekStart={weekStart} />
        </div>
      )}
    </div>
  );
}
