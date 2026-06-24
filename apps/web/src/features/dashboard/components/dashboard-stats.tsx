'use client';

import { Clock, DollarSign, Hourglass, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, formatHours } from '@/lib/format';
import { ITEM_ENTER, staggerDelay } from '@/lib/motion';

interface Props {
  activeEmployees: number;
  totalHours: number;
  totalPay: number;
  pendingCount: number;
}

export function DashboardStats({
  activeEmployees,
  totalHours,
  totalPay,
  pendingCount,
}: Props) {
  const t = useTranslations('home');
  const locale = useLocale();

  const stats = [
    { key: 'activeEmployees', icon: Users, value: String(activeEmployees) },
    { key: 'hours', icon: Clock, value: formatHours(totalHours, locale) },
    {
      key: 'payroll',
      icon: DollarSign,
      value: formatCurrency(totalPay, locale),
    },
    { key: 'pending', icon: Hourglass, value: String(pendingCount) },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.key}
          className={`bg-card rounded-xl border p-4 shadow-sm sm:p-5 ${ITEM_ENTER}`}
          style={staggerDelay(i)}
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {t(`kpi.${stat.key}`)}
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
  );
}
