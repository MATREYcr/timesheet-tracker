'use client';

import { addDays, getWeekEnd } from '@timesheet/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/use-locale';
import { formatWeekRange } from '@/lib/format';

interface Props {
  weekStart: string;
  onChange: (weekStart: string) => void;
}

export function WeekPicker({ weekStart, onChange }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <div className="bg-card flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={t('week.previous')}
        onClick={() => onChange(addDays(weekStart, -7))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium tabular-nums">
        {formatWeekRange(weekStart, getWeekEnd(weekStart), locale)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label={t('week.next')}
        onClick={() => onChange(addDays(weekStart, 7))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
