'use client';

import {
  getWeekEnd,
  timeEntryFormSchema,
  type TimeEntry,
  type TimeEntryFormInput,
} from '@timesheet/shared';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTimeEntry, useUpdateTimeEntry } from '../hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  weekStart: string;
  /** Presence switches the dialog to edit mode. */
  entry?: TimeEntry;
}

export function TimeEntryFormDialog({
  open,
  onOpenChange,
  employeeId,
  weekStart,
  entry,
}: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(entry);
  const create = useCreateTimeEntry();
  const update = useUpdateTimeEntry();

  const weekEnd = getWeekEnd(weekStart);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeEntryFormInput>({
    resolver: standardSchemaResolver(timeEntryFormSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      entry
        ? { date: entry.date, hours: entry.hours }
        : { date: weekStart, hours: undefined },
    );
  }, [open, entry, weekStart, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (entry) {
        await update.mutateAsync({ id: entry.id, body: values });
        toast.success(t('timeEntries.toast.updated'));
      } else {
        await create.mutateAsync({ employeeId, ...values });
        toast.success(t('timeEntries.toast.created'));
      }
      onOpenChange(false);
    } catch {
      // Error toast is handled globally; keep the dialog open so the user can retry.
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {t(isEdit ? 'timeEntries.form.editTitle' : 'timeEntries.form.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {t(
                isEdit
                  ? 'timeEntries.form.editDescription'
                  : 'timeEntries.form.createDescription',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">{t('timeEntries.form.date')}</Label>
              <Input
                id="date"
                type="date"
                min={weekStart}
                max={weekEnd}
                {...register('date')}
              />
              {errors.date && (
                <p className="text-destructive text-sm">{errors.date.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hours">{t('timeEntries.form.hours')}</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                inputMode="decimal"
                {...register('hours', { valueAsNumber: true })}
              />
              {errors.hours && (
                <p className="text-destructive text-sm">
                  {errors.hours.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t(
                isEdit
                  ? 'timeEntries.form.submitEdit'
                  : 'timeEntries.form.submitCreate',
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
