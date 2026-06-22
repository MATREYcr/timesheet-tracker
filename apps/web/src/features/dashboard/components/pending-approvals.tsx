'use client';

import { calculateWeeklyPay, type WeeklySummaryRow } from '@timesheet/shared';
import { ChevronRight, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/use-locale';
import { formatCurrency, formatHours } from '@/lib/format';
import { ITEM_ENTER, staggerDelay } from '@/lib/motion';

interface Props {
  rows: WeeklySummaryRow[];
  count: number;
}

export function PendingApprovals({ rows, count }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="bg-primary-soft text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Hourglass className="size-4" />
          </span>
          <h2 className="truncate font-semibold">{t('home.pending.title')}</h2>
          <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
            {count}
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
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-5 py-10 text-center text-sm">
          {t('home.pending.empty')}
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((row, i) => {
            const pay = calculateWeeklyPay(row.totalHours, row.hourlyRate);
            return (
              <li
                key={row.employeeId}
                className={`flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 ${ITEM_ENTER}`}
                style={staggerDelay(i)}
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
                <Button asChild size="sm" variant="soft">
                  <Link href="/weekly-summary">{t('home.pending.review')}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
