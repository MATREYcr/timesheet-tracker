'use client';

import { APPROVAL_STATUS, type ApprovalStatus } from '@timesheet/shared';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const VARIANT: Record<ApprovalStatus, 'default' | 'secondary' | 'destructive'> =
  {
    [APPROVAL_STATUS.approved]: 'default',
    [APPROVAL_STATUS.pending]: 'secondary',
    [APPROVAL_STATUS.rejected]: 'destructive',
  };

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation();
  return <Badge variant={VARIANT[status]}>{t(`approval.status.${status}`)}</Badge>;
}
