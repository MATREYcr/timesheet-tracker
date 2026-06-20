'use client';

import {
  APPROVAL_STATUS,
  calculateWeeklyPay,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import { ChevronUp, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { useLocale } from '@/i18n/use-locale';
import { formatCurrency, formatHours } from '@/lib/format';
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
  const { t } = useTranslation();
  const locale = useLocale();
  const approve = useApproveWeek();
  const reject = useRejectWeek();

  const isRowPending = (employeeId: string) =>
    (approve.isPending && approve.variables?.employeeId === employeeId) ||
    (reject.isPending && reject.variables?.employeeId === employeeId);

  const onApprove = (employeeId: string) =>
    approve.mutate(
      { employeeId, weekStart },
      { onSuccess: () => toast.success(t('approval.toast.approved')) },
    );
  const onReject = (employeeId: string) =>
    reject.mutate(
      { employeeId, weekStart },
      { onSuccess: () => toast.success(t('approval.toast.rejected')) },
    );

  return (
    <Table
      aria-label={t('weeklySummary.title')}
      containerClassName={containerClassName}
      className="min-w-210 table-fixed"
    >
      <TableHeader>
        <TableRow>
          <TableHead className="text-center">
            {t('weeklySummary.columns.employee')}
          </TableHead>
          <TableHead className="text-center">
            {t('weeklySummary.columns.regularHours')}
          </TableHead>
          <TableHead className="text-center">
            {t('weeklySummary.columns.overtimeHours')}
          </TableHead>
          <TableHead className="text-center">
            {t('weeklySummary.columns.totalHours')}
          </TableHead>
          <TableHead className="text-center">
            {t('weeklySummary.columns.pay')}
          </TableHead>
          <TableHead className="text-center">
            {t('weeklySummary.columns.status')}
          </TableHead>
          <TableHead className="text-center">
            {t('weeklySummary.columns.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const pay = calculateWeeklyPay(row.totalHours, row.hourlyRate);
          const pending = isRowPending(row.employeeId);
          return (
            <TableRow key={row.employeeId}>
              <TableCell className="text-center font-medium">
                {row.firstName} {row.lastName}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {formatHours(pay.regularHours, locale)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
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
              <TableCell className="text-center tabular-nums">
                {formatHours(pay.totalHours, locale)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                <div className="font-medium">
                  {formatCurrency(pay.totalPay, locale)}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatCurrency(pay.regularPay, locale)} +{' '}
                  {formatCurrency(pay.overtimePay, locale)}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <ApprovalStatusBadge status={row.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {row.status !== APPROVAL_STATUS.approved && (
                    <ConfirmDialog
                      title={t('approval.confirm.approve.title')}
                      description={t('approval.confirm.approve.description')}
                      confirmLabel={t('approval.actions.approve')}
                      onConfirm={() => onApprove(row.employeeId)}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        className="bg-success-bg text-success border-success-border hover:bg-success-bg hover:text-success"
                      >
                        {t('approval.actions.approve')}
                      </Button>
                    </ConfirmDialog>
                  )}
                  {row.status === APPROVAL_STATUS.approved ? (
                    <span className="flex items-center gap-1.5">
                      <Lock className="text-subtle size-3.5" />
                      <ConfirmDialog
                        title={t('approval.confirm.reopen.title')}
                        description={t('approval.confirm.reopen.description')}
                        confirmLabel={t('approval.actions.reopen')}
                        onConfirm={() => onReject(row.employeeId)}
                      >
                        <Button size="sm" variant="outline" disabled={pending}>
                          {t('approval.actions.reopen')}
                        </Button>
                      </ConfirmDialog>
                    </span>
                  ) : (
                    row.status !== APPROVAL_STATUS.rejected && (
                      <ConfirmDialog
                        title={t('approval.confirm.reject.title')}
                        description={t('approval.confirm.reject.description')}
                        confirmLabel={t('approval.actions.reject')}
                        destructive
                        onConfirm={() => onReject(row.employeeId)}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                        >
                          {t('approval.actions.reject')}
                        </Button>
                      </ConfirmDialog>
                    )
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
