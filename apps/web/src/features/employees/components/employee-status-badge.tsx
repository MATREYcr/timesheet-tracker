'use client';

import type { EmployeeStatus } from '@timesheet/shared';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
      {t(`employees.status.${status}`)}
    </Badge>
  );
}
