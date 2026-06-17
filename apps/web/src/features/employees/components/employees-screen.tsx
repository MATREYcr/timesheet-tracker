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
import { useEmployees } from '../hooks';
import { EmployeeFormDialog } from './employee-form-dialog';
import { EmployeesTable } from './employees-table';

const SKELETON_ROWS = 4;

export function EmployeesScreen() {
  const { t } = useTranslation();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>(undefined);

  const { data, isPending, isError, refetch } = useEmployees(includeInactive);

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
              onCheckedChange={setIncludeInactive}
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
      ) : data.length === 0 ? (
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
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <EmployeesTable employees={data} onEdit={openEdit} />
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
