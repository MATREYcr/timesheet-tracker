'use client';

import { EMPLOYEE_STATUS, type Employee } from '@timesheet/shared';
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
import { formatCurrency } from '@/lib/format';
import { useLocale } from '@/i18n/use-locale';
import { useDeactivateEmployee, useReactivateEmployee } from '../hooks';
import { EmployeeStatusBadge } from './employee-status-badge';

interface Props {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
}

export function EmployeesTable({ employees, onEdit }: Props) {
  const { t } = useTranslation();
  const locale = useLocale();
  const deactivate = useDeactivateEmployee();
  const reactivate = useReactivateEmployee();
  // Only the row whose status is currently being toggled, so we don't disable
  // every other row's action while one request is in flight.
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
    <Table aria-label={t('employees.title')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('employees.columns.name')}</TableHead>
          <TableHead className="text-right">
            {t('employees.columns.rate')}
          </TableHead>
          <TableHead>{t('employees.columns.status')}</TableHead>
          <TableHead className="text-right">
            {t('employees.columns.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => {
          const isActive = employee.status === EMPLOYEE_STATUS.active;
          return (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">
                {employee.firstName} {employee.lastName}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(employee.hourlyRate, locale)}
              </TableCell>
              <TableCell>
                <EmployeeStatusBadge status={employee.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2 text-sm">
                  <Button
                    variant="link"
                    className="text-primary h-auto p-0"
                    onClick={() => onEdit(employee)}
                  >
                    {t('employees.actions.edit')}
                  </Button>
                  <span className="text-border">·</span>
                  <Button
                    variant="link"
                    disabled={pendingId === employee.id}
                    onClick={() => toggleStatus(employee)}
                    className="text-muted-foreground hover:text-foreground h-auto p-0 no-underline hover:no-underline"
                  >
                    {t(
                      isActive
                        ? 'employees.actions.deactivate'
                        : 'employees.actions.reactivate',
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
