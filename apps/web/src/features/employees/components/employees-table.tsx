'use client';

import { EMPLOYEE_STATUS, type Employee } from '@timesheet/shared';
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
import { formatCurrency } from '@/lib/format';
import { useLocale } from '@/i18n/use-locale';
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
  const { t } = useTranslation();
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
          t(
            isActive
              ? 'employees.toast.deactivated'
              : 'employees.toast.reactivated',
          ),
        ),
    });
  };

  return (
    <Table
      aria-label={t('employees.title')}
      containerClassName={containerClassName}
      className="min-w-160 table-fixed"
    >
      <TableHeader>
        <TableRow>
          <TableHead>{t('employees.columns.name')}</TableHead>
          <TableHead>{t('employees.columns.rate')}</TableHead>
          <TableHead>{t('employees.columns.status')}</TableHead>
          <TableHead>{t('employees.columns.actions')}</TableHead>
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
                    {t('employees.actions.edit')}
                  </Button>
                  <ConfirmDialog
                    title={t(
                      isActive
                        ? 'employees.confirm.deactivate.title'
                        : 'employees.confirm.reactivate.title',
                    )}
                    description={t(
                      isActive
                        ? 'employees.confirm.deactivate.description'
                        : 'employees.confirm.reactivate.description',
                    )}
                    confirmLabel={t(
                      isActive
                        ? 'employees.actions.deactivate'
                        : 'employees.actions.reactivate',
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
                          ? 'employees.actions.deactivate'
                          : 'employees.actions.reactivate',
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
