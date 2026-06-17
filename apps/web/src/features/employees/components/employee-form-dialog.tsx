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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateEmployee, useUpdateEmployee } from '../hooks';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const isSaving = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: standardSchemaResolver(createEmployeeSchema),
    defaultValues: EMPTY,
  });

  // RHF keeps values between opens, so re-seed the form each time it opens.
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

  const onSubmit = handleSubmit((values) => {
    const onSuccess = () => {
      toast.success(
        t(employee ? 'employees.toast.updated' : 'employees.toast.created'),
      );
      onOpenChange(false);
    };
    if (employee) {
      update.mutate({ id: employee.id, body: values }, { onSuccess });
    } else {
      create.mutate(values, { onSuccess });
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

          <FieldGroup className="py-4">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="firstName">
                {t('employees.form.firstName')}
              </FieldLabel>
              <Input
                id="firstName"
                autoFocus
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="lastName">
                {t('employees.form.lastName')}
              </FieldLabel>
              <Input
                id="lastName"
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>

            <Field data-invalid={!!errors.hourlyRate}>
              <FieldLabel htmlFor="hourlyRate">
                {t('employees.form.hourlyRate')}
              </FieldLabel>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                aria-invalid={!!errors.hourlyRate}
                {...register('hourlyRate', { valueAsNumber: true })}
              />
              <FieldError errors={[errors.hourlyRate]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
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
