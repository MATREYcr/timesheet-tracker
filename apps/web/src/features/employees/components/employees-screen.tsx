'use client';

import type { Employee } from '@timesheet/shared';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmployeeCombobox } from '@/components/employee-combobox';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { QueryError } from '@/components/query-error';
import { TablePagination } from '@/components/table-pagination';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ENTER } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useEmployees } from '../hooks';
import { EmployeeFormDialog } from './employee-form-dialog';
import { EmployeesTable } from './employees-table';

export function EmployeesScreen() {
  const t = useTranslations();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selected, setSelected] = useState<Employee | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);

  const { data, isPending, isError, refetch } = useEmployees(
    includeInactive,
    page,
    10,
    selected?.id,
  );

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('employees.title')}
        description={t('employees.subtitle')}
      >
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <EmployeeCombobox
            value={selected}
            onChange={(employee) => {
              setSelected(employee);
              setPage(1);
            }}
            allLabel={t('common.allEmployees')}
            className="w-full sm:w-64"
          />
          <div className="border-border bg-background dark:border-input dark:bg-input/30 flex h-10 items-center gap-2 rounded-lg border px-3">
            <Switch
              id="show-inactive"
              checked={includeInactive}
              onCheckedChange={(checked) => {
                setIncludeInactive(checked);
                setPage(1);
              }}
            />
            <Label htmlFor="show-inactive" className="cursor-pointer">
              {t('employees.showInactive')}
            </Label>
          </div>
          <Button onClick={openCreate} className="h-10 w-full px-5 sm:w-auto">
            <Plus className="size-4" />
            {t('employees.add')}
          </Button>
        </div>
      </PageHeader>

      {isPending ? (
        <TableSkeleton />
      ) : isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={t('employees.empty.title')}
          description={t('employees.empty.description')}
        >
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('employees.add')}
          </Button>
        </EmptyState>
      ) : (
        <div
          className={cn(
            'bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm',
            ENTER,
          )}
        >
          <EmployeesTable
            employees={data.data}
            onEdit={openEdit}
            containerClassName="max-h-[calc(100dvh-20rem)] overflow-auto"
          />
          <TablePagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editing}
      />
    </div>
  );
}
