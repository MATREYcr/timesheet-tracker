'use client';

import {
  APPROVAL_STATUS,
  calculateWeeklyPay,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import { ChevronUp, Lock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatHours } from '@/lib/format';
import { ITEM_ENTER, staggerDelay } from '@/lib/motion';
import { useApproveWeek, useRejectWeek } from '../hooks';
import { ApprovalStatusBadge } from './approval-status-badge';

interface Props {
  rows: WeeklySummaryRow[];
  weekStart: string;
  containerClassName?: string;
}

export function WeeklySummaryTable({
  rows,
  weekStart,
  containerClassName,
}: Props) {
  const t = useTranslations('weeklySummary');
  const tApproval = useTranslations('approval');
  const locale = useLocale();
  const approve = useApproveWeek();
  const reject = useRejectWeek();

  const isRowPending = (employeeId: string) =>
    (approve.isPending && approve.variables?.employeeId === employeeId) ||
    (reject.isPending && reject.variables?.employeeId === employeeId);

  const onApprove = (employeeId: string) =>
    approve.mutate(
      { employeeId, weekStart },
      { onSuccess: () => toast.success(tApproval('toast.approved')) },
    );
  const onReject = (employeeId: string) =>
    reject.mutate(
      { employeeId, weekStart },
      { onSuccess: () => toast.success(tApproval('toast.rejected')) },
    );

  const headers: { label: string; className?: string }[] = [
    { label: t('columns.employee') },
    { label: t('columns.regularHours') },
    { label: t('columns.overtimeHours') },
    { label: t('columns.totalHours') },
    { label: t('columns.pay') },
    { label: t('columns.status') },
    { label: t('columns.actions'), className: 'text-center' },
  ];

  return (
    <Table
      aria-label={t('title')}
      containerClassName={containerClassName}
      className="min-w-210 table-fixed"
    >
      <TableHeader>
        <TableRow>
          {headers.map(({ label, className }) => (
            <TableHead key={label} className={className}>
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          const pay = calculateWeeklyPay(row.totalHours, row.hourlyRate);
          const pending = isRowPending(row.employeeId);
          return (
            <TableRow
              key={row.employeeId}
              className={ITEM_ENTER}
              style={staggerDelay(i)}
            >
              <TableCell className="font-medium">
                {row.firstName} {row.lastName}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatHours(pay.regularHours, locale)}
              </TableCell>
              <TableCell className="tabular-nums">
                {pay.overtimeHours > 0 ? (
                  <span className="bg-overtime-bg text-overtime border-overtime-border inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-bold">
                    <ChevronUp className="size-3" />
                    {formatHours(pay.overtimeHours, locale)}
                  </span>
                ) : (
                  <span className="text-subtle">
                    {formatHours(pay.overtimeHours, locale)}
                  </span>
                )}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatHours(pay.totalHours, locale)}
              </TableCell>
              <TableCell className="tabular-nums">
                <div className="font-medium">
                  {formatCurrency(pay.totalPay, locale)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatCurrency(pay.regularPay, locale)} +{' '}
                  {formatCurrency(pay.overtimePay, locale)}
                </div>
              </TableCell>
              <TableCell>
                <ApprovalStatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {row.status === APPROVAL_STATUS.approved && (
                    <Lock className="text-subtle size-3.5" />
                  )}
                  {row.status !== APPROVAL_STATUS.approved && (
                    <ConfirmDialog
                      title={tApproval('confirm.approve.title')}
                      description={tApproval('confirm.approve.description')}
                      confirmLabel={tApproval('actions.approve')}
                      onConfirm={() => onApprove(row.employeeId)}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        className="bg-success-bg text-success border-success-border hover:bg-success-bg hover:text-success"
                      >
                        {tApproval('actions.approve')}
                      </Button>
                    </ConfirmDialog>
                  )}
                  {row.status !== APPROVAL_STATUS.rejected && (
                    <ConfirmDialog
                      title={tApproval('confirm.reject.title')}
                      description={tApproval('confirm.reject.description')}
                      confirmLabel={tApproval('actions.reject')}
                      destructive
                      onConfirm={() => onReject(row.employeeId)}
                    >
                      <Button size="sm" variant="destructive" disabled={pending}>
                        {tApproval('actions.reject')}
                      </Button>
                    </ConfirmDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
