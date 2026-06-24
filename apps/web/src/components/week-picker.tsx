'use client';

import { addDays, getWeekEnd } from '@timesheet/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatWeekRange } from '@/lib/format';

interface Props {
  weekStart: string;
  onChange: (weekStart: string) => void;
}

export function WeekPicker({ weekStart, onChange }: Props) {
  const t = useTranslations('week');
  const locale = useLocale();
  return (
    <div className="bg-card flex w-full items-center justify-between gap-1 rounded-lg border p-1 sm:w-auto sm:justify-start">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t('previous')}
        onClick={() => onChange(addDays(weekStart, -7))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="flex-1 text-center text-sm font-medium tabular-nums sm:min-w-40 sm:flex-none">
        {formatWeekRange(weekStart, getWeekEnd(weekStart), locale)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t('next')}
        onClick={() => onChange(addDays(weekStart, 7))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
