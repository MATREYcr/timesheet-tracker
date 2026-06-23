'use client';

import {
  APPROVAL_STATUS,
  EMPLOYEE_STATUS,
  getCurrentWeekStart,
  type Employee,
  type TimeEntry,
} from '@timesheet/shared';
import { CalendarOff, Lock, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmployeeCombobox } from '@/components/employee-combobox';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { QueryError } from '@/components/query-error';
import { TableSkeleton } from '@/components/table-skeleton';
import { WeekPicker } from '@/components/week-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ENTER } from '@/lib/motion';
import { useTimeEntries, useWeekApproval } from '../hooks';
import { TimeEntriesTable } from './time-entries-table';
import { TimeEntryFormDialog } from './time-entry-form-dialog';

export function TimeEntriesScreen() {
  const t = useTranslations();
  const [selected, setSelected] = useState<Employee | undefined>(undefined);
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | undefined>(undefined);

  const employeeId = selected?.id;
  const entries = useTimeEntries(employeeId, weekStart);
  const approval = useWeekApproval(employeeId, weekStart);

  const isInactive = selected?.status === EMPLOYEE_STATUS.inactive;
  const isLocked = approval.data?.status === APPROVAL_STATUS.approved;
  const canAdd = Boolean(employeeId) && !isInactive && !isLocked;

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (entry: TimeEntry) => {
    setEditing(entry);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('timeEntries.title')}
        description={t('timeEntries.subtitle')}
      >
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:gap-4">
          <EmployeeCombobox
            value={selected}
            onChange={setSelected}
            placeholder={t('timeEntries.selectEmployee')}
            className="w-full sm:w-64"
          />
          <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
          <Button
            onClick={openCreate}
            disabled={!canAdd}
            className="h-10 w-full px-5 sm:w-auto"
          >
            <Plus className="size-4" />
            {t('timeEntries.add')}
          </Button>
        </div>
      </PageHeader>

      {isInactive && (
        <Alert variant="info">
          <CalendarOff className="size-4" />
          <AlertTitle>{t('timeEntries.inactive.title')}</AlertTitle>
          <AlertDescription>
            {t('timeEntries.inactive.description')}
          </AlertDescription>
        </Alert>
      )}
      {isLocked && (
        <Alert variant="info">
          <Lock className="size-4" />
          <AlertTitle>{t('timeEntries.locked.title')}</AlertTitle>
          <AlertDescription>
            {t('timeEntries.locked.description')}
          </AlertDescription>
        </Alert>
      )}

      {!employeeId ? (
        <EmptyState
          icon={<Users />}
          title={t('timeEntries.empty.noEmployee')}
          description={t('timeEntries.empty.noEmployeeHint')}
        />
      ) : entries.isPending ? (
        <TableSkeleton />
      ) : entries.isError ? (
        <QueryError onRetry={() => entries.refetch()} />
      ) : entries.data.length === 0 ? (
        <EmptyState
          icon={<CalendarOff />}
          title={t('timeEntries.empty.noEntries')}
          description={t('timeEntries.empty.noEntriesHint')}
        />
      ) : (
        <div
          className={`bg-card overflow-hidden rounded-xl border shadow-sm ${ENTER}`}
        >
          <TimeEntriesTable
            entries={entries.data}
            locked={isLocked}
            onEdit={openEdit}
          />
        </div>
      )}

      {employeeId && (
        <TimeEntryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          employeeId={employeeId}
          weekStart={weekStart}
          entry={editing}
        />
      )}
    </div>
  );
}
