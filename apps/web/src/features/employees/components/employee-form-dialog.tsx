'use client';

import {
  createEmployeeSchema,
  type CreateEmployeeInput,
  type Employee,
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
import { ApiError } from '@/lib/http';
import { useCreateEmployee, useUpdateEmployee } from '../hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presence switches the dialog to edit mode. */
  employee?: Employee;
}

const EMPTY: Partial<CreateEmployeeInput> = {
  firstName: '',
  lastName: '',
  hourlyRate: undefined,
};

export function EmployeeFormDialog({ open, onOpenChange, employee }: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(employee);
  const create = useCreateEmployee();
  const update = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeInput>({
    resolver: standardSchemaResolver(createEmployeeSchema),
    defaultValues: EMPTY,
  });

  // Sync form state whenever the dialog opens (load the employee for edit,
  // or clear it for create).
  useEffect(() => {
    if (!open) return;
    reset(
      employee
        ? {
            firstName: employee.firstName,
            lastName: employee.lastName,
            hourlyRate: employee.hourlyRate,
          }
        : EMPTY,
    );
  }, [open, employee, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (employee) {
        await update.mutateAsync({ id: employee.id, body: values });
        toast.success(t('employees.toast.updated'));
      } else {
        await create.mutateAsync(values);
        toast.success(t('employees.toast.created'));
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('common.error'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {t(isEdit ? 'employees.form.editTitle' : 'employees.form.createTitle')}
            </DialogTitle>
            <DialogDescription>
              {t(
                isEdit
                  ? 'employees.form.editDescription'
                  : 'employees.form.createDescription',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">{t('employees.form.firstName')}</Label>
              <Input id="firstName" autoFocus {...register('firstName')} />
              {errors.firstName && (
                <p className="text-destructive text-sm">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">{t('employees.form.lastName')}</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-destructive text-sm">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">{t('employees.form.hourlyRate')}</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                {...register('hourlyRate', { valueAsNumber: true })}
              />
              {errors.hourlyRate && (
                <p className="text-destructive text-sm">
                  {errors.hourlyRate.message}
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
                  ? 'employees.form.submitEdit'
                  : 'employees.form.submitCreate',
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
