'use client';

import {
  APPROVAL_STATUS,
  EMPLOYEE_STATUS,
  getCurrentWeekStart,
  type TimeEntry,
} from '@timesheet/shared';
import { CalendarOff, Lock, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeekPicker } from '@/components/week-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '../../employees/hooks';
import { useTimeEntries, useWeekApproval } from '../hooks';
import { EmployeeSelect } from './employee-select';
import { TimeEntriesTable } from './time-entries-table';
import { TimeEntryFormDialog } from './time-entry-form-dialog';

const SKELETON_ROWS = 4;

export function TimeEntriesScreen() {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | undefined>(undefined);

  // The selector needs the whole roster (incl. inactive), not a page.
  const employees = useEmployees(true, 1, 100);
  const entries = useTimeEntries(employeeId, weekStart);
  const approval = useWeekApproval(employeeId, weekStart);

  const roster = employees.data?.data ?? [];
  const selected = roster.find((e) => e.id === employeeId);
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('timeEntries.title')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('timeEntries.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <EmployeeSelect
          employees={roster}
          value={employeeId}
          onChange={setEmployeeId}
        />
        <div className="flex items-center gap-3">
          <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
          <Button onClick={openCreate} disabled={!canAdd}>
            <Plus className="size-4" />
            {t('timeEntries.add')}
          </Button>
        </div>
      </div>

      {isInactive && (
        <Alert>
          <CalendarOff className="size-4" />
          <AlertTitle>{t('timeEntries.inactive.title')}</AlertTitle>
          <AlertDescription>
            {t('timeEntries.inactive.description')}
          </AlertDescription>
        </Alert>
      )}
      {isLocked && (
        <Alert>
          <Lock className="size-4" />
          <AlertTitle>{t('timeEntries.locked.title')}</AlertTitle>
          <AlertDescription>
            {t('timeEntries.locked.description')}
          </AlertDescription>
        </Alert>
      )}

      {!employeeId ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>{t('timeEntries.empty.noEmployee')}</EmptyTitle>
            <EmptyDescription>
              {t('timeEntries.empty.noEmployeeHint')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : entries.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : entries.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => entries.refetch()}
            >
              {t('common.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : entries.data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarOff />
            </EmptyMedia>
            <EmptyTitle>{t('timeEntries.empty.noEntries')}</EmptyTitle>
            <EmptyDescription>
              {t('timeEntries.empty.noEntriesHint')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
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
