'use client';

import type { Employee } from '@timesheet/shared';
import { Pencil, UserCheck, UserX } from 'lucide-react';
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
import { ApiError } from '@/lib/http';
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
  const isMutating = deactivate.isPending || reactivate.isPending;

  const toggleStatus = async (employee: Employee) => {
    const isActive = employee.status === 'active';
    try {
      if (isActive) {
        await deactivate.mutateAsync(employee);
        toast.success(t('employees.toast.deactivated'));
      } else {
        await reactivate.mutateAsync(employee);
        toast.success(t('employees.toast.reactivated'));
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('common.error'));
    }
  };

  return (
    <Table>
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
          const isActive = employee.status === 'active';
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
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(employee)}
                  >
                    <Pencil className="size-4" />
                    {t('employees.actions.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isMutating}
                    onClick={() => toggleStatus(employee)}
                  >
                    {isActive ? (
                      <UserX className="size-4" />
                    ) : (
                      <UserCheck className="size-4" />
                    )}
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
