'use client';

import { APPROVAL_STATUS, type ApprovalStatus } from '@timesheet/shared';
import { Check, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STYLE: Record<ApprovalStatus, { cls: string; icon: LucideIcon | null }> = {
  [APPROVAL_STATUS.pending]: {
    cls: 'bg-muted text-muted-foreground border-border',
    icon: null,
  },
  [APPROVAL_STATUS.approved]: {
    cls: 'bg-success-bg text-success border-success-border',
    icon: Check,
  },
  [APPROVAL_STATUS.rejected]: {
    cls: 'bg-destructive-bg text-destructive border-destructive-border',
    icon: X,
  },
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation();
  const { cls, icon: Icon } = STYLE[status];
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1 rounded-full border font-medium', cls)}
    >
      {Icon && <Icon className="size-3" />}
      {t(`approval.status.${status}`)}
    </Badge>
  );
}
