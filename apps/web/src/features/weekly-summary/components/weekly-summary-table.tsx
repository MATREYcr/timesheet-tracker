'use client';

import {
  APPROVAL_STATUS,
  calculateWeeklyPay,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import { ChevronUp, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
}

export function WeeklySummaryTable({ rows, weekStart }: Props) {
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
    <Table aria-label={t('weeklySummary.title')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('weeklySummary.columns.employee')}</TableHead>
          <TableHead className="text-right">
            {t('weeklySummary.columns.regularHours')}
          </TableHead>
          <TableHead className="text-right">
            {t('weeklySummary.columns.overtimeHours')}
          </TableHead>
          <TableHead className="text-right">
            {t('weeklySummary.columns.totalHours')}
          </TableHead>
          <TableHead className="text-right">
            {t('weeklySummary.columns.pay')}
          </TableHead>
          <TableHead>{t('weeklySummary.columns.status')}</TableHead>
          <TableHead className="text-right">
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
              <TableCell className="font-medium">
                {row.firstName} {row.lastName}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatHours(pay.regularHours, locale)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
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
              <TableCell className="text-right tabular-nums">
                {formatHours(pay.totalHours, locale)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
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
                <div className="flex items-center justify-end gap-2">
                  {row.status !== APPROVAL_STATUS.approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onApprove(row.employeeId)}
                      className="bg-success-bg text-success border-success-border hover:bg-success-bg hover:text-success"
                    >
                      {t('approval.actions.approve')}
                    </Button>
                  )}
                  {row.status === APPROVAL_STATUS.approved ? (
                    <span className="flex items-center gap-1.5">
                      <Lock className="text-subtle size-3.5" />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => onReject(row.employeeId)}
                      >
                        {t('approval.actions.reopen')}
                      </Button>
                    </span>
                  ) : (
                    row.status !== APPROVAL_STATUS.rejected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => onReject(row.employeeId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {t('approval.actions.reject')}
                      </Button>
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
