'use client';

import { EMPLOYEE_STATUS, type EmployeeStatus } from '@timesheet/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const t = useTranslations('employees');
  const active = status === EMPLOYEE_STATUS.active;
  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1.5 rounded-full border font-medium',
        active
          ? 'bg-primary-soft text-primary border-transparent'
          : 'bg-muted text-muted-foreground border-border',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          active ? 'bg-primary' : 'bg-subtle',
        )}
      />
      {t(`status.${status}`)}
    </Badge>
  );
}
