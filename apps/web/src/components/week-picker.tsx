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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label={t('week.previous')}
        onClick={() => onChange(addDays(weekStart, -7))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-44 text-center text-sm font-medium tabular-nums">
        {formatWeekRange(weekStart, getWeekEnd(weekStart), locale)}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('week.next')}
        onClick={() => onChange(addDays(weekStart, 7))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
