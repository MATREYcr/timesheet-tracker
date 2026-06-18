'use client';

import type { Employee } from '@timesheet/shared';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { TablePagination } from '@/components/table-pagination';
import { useEmployees } from '../hooks';
import { EmployeeFormDialog } from './employee-form-dialog';
import { EmployeesTable } from './employees-table';

const SKELETON_ROWS = 4;

export function EmployeesScreen() {
  const { t } = useTranslation();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);

  const { data, isPending, isError, refetch } = useEmployees(
    includeInactive,
    page,
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
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('employees.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('employees.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={includeInactive}
              onCheckedChange={(checked) => {
                setIncludeInactive(checked);
                setPage(1);
              }}
            />
            <Label htmlFor="show-inactive">{t('employees.showInactive')}</Label>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('employees.add')}
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{t('common.errorBody')}</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </AlertAction>
        </Alert>
      ) : data.data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>{t('employees.empty.title')}</EmptyTitle>
            <EmptyDescription>
              {t('employees.empty.description')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              {t('employees.add')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <EmployeesTable
            employees={data.data}
            onEdit={openEdit}
            containerClassName="min-h-0 flex-1 overflow-auto"
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
