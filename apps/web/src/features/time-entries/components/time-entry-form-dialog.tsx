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
import { useTranslations } from 'next-intl';
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateTimeEntry, useUpdateTimeEntry } from '../hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  weekStart: string;
  entry?: TimeEntry;
}

export function TimeEntryFormDialog({
  open,
  onOpenChange,
  employeeId,
  weekStart,
  entry,
}: Props) {
  const t = useTranslations('timeEntries');
  const tCommon = useTranslations('common');
  const isEdit = Boolean(entry);
  const create = useCreateTimeEntry();
  const update = useUpdateTimeEntry();
  const isSaving = create.isPending || update.isPending;

  const weekEnd = getWeekEnd(weekStart);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
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

  const onSubmit = handleSubmit((values) => {
    const onSuccess = () => {
      toast.success(t(entry ? 'toast.updated' : 'toast.created'));
      onOpenChange(false);
    };
    if (entry) {
      update.mutate({ id: entry.id, body: values }, { onSuccess });
    } else {
      create.mutate({ employeeId, ...values }, { onSuccess });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {t(isEdit ? 'form.editTitle' : 'form.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {t(isEdit ? 'form.editDescription' : 'form.createDescription')}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field data-invalid={!!errors.date}>
              <FieldLabel htmlFor="date">{t('form.date')}</FieldLabel>
              <Input
                id="date"
                type="date"
                min={weekStart}
                max={weekEnd}
                aria-invalid={!!errors.date}
                {...register('date')}
              />
              <FieldError errors={[errors.date]} />
            </Field>

            <Field data-invalid={!!errors.hours}>
              <FieldLabel htmlFor="hours">{t('form.hours')}</FieldLabel>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                inputMode="decimal"
                aria-invalid={!!errors.hours}
                {...register('hours', { valueAsNumber: true })}
              />
              <FieldError errors={[errors.hours]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {t(isEdit ? 'form.submitEdit' : 'form.submitCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
