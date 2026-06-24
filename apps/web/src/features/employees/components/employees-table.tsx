'use client';

import { EMPLOYEE_STATUS, type Employee } from '@timesheet/shared';
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
import { formatCurrency } from '@/lib/format';
import { ITEM_ENTER, staggerDelay } from '@/lib/motion';
import { useDeactivateEmployee, useReactivateEmployee } from '../hooks';
import { EmployeeStatusBadge } from './employee-status-badge';

interface Props {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  containerClassName?: string;
}

export function EmployeesTable({
  employees,
  onEdit,
  containerClassName,
}: Props) {
  const t = useTranslations('employees');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const deactivate = useDeactivateEmployee();
  const reactivate = useReactivateEmployee();

  const pendingId =
    (deactivate.isPending ? deactivate.variables?.id : undefined) ??
    (reactivate.isPending ? reactivate.variables?.id : undefined);

  const toggleStatus = (employee: Employee) => {
    const isActive = employee.status === EMPLOYEE_STATUS.active;
    const mutation = isActive ? deactivate : reactivate;
    mutation.mutate(employee, {
      onSuccess: () =>
        toast.success(
          t(isActive ? 'toast.deactivated' : 'toast.reactivated'),
        ),
    });
  };

  return (
    <Table
      aria-label={t('title')}
      containerClassName={containerClassName}
      className="min-w-160 table-fixed"
    >
      <TableHeader>
        <TableRow>
          <TableHead>{t('columns.name')}</TableHead>
          <TableHead>{t('columns.rate')}</TableHead>
          <TableHead>{t('columns.status')}</TableHead>
          <TableHead>{t('columns.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee, i) => {
          const isActive = employee.status === EMPLOYEE_STATUS.active;
          return (
            <TableRow
              key={employee.id}
              className={ITEM_ENTER}
              style={staggerDelay(i)}
            >
              <TableCell className="font-medium">
                {employee.firstName} {employee.lastName}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCurrency(employee.hourlyRate, locale)}
              </TableCell>
              <TableCell>
                <EmployeeStatusBadge status={employee.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => onEdit(employee)}
                  >
                    {t('actions.edit')}
                  </Button>
                  <ConfirmDialog
                    title={t(
                      isActive
                        ? 'confirm.deactivate.title'
                        : 'confirm.reactivate.title',
                    )}
                    description={t(
                      isActive
                        ? 'confirm.deactivate.description'
                        : 'confirm.reactivate.description',
                    )}
                    confirmLabel={t(
                      isActive
                        ? 'actions.deactivate'
                        : 'actions.reactivate',
                    )}
                    destructive={isActive}
                    onConfirm={() => toggleStatus(employee)}
                  >
                    <Button
                      size="sm"
                      variant={isActive ? 'destructive' : 'ghost'}
                      disabled={pendingId === employee.id}
                      className={
                        isActive
                          ? undefined
                          : 'bg-muted text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
                      }
                    >
                      {t(
                        isActive
                          ? 'actions.deactivate'
                          : 'actions.reactivate',
                      )}
                    </Button>
                  </ConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
