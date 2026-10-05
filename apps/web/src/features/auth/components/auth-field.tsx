'use client';

import { isAuthValidationKey } from '@timesheet/shared';
import { useTranslations } from 'next-intl';
import type { ComponentProps } from 'react';
import type { FieldError as FormFieldError } from 'react-hook-form';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  hint?: string;
  error?: FormFieldError;
};

// Shared schema messages are keys (see AUTH_VALIDATION); translate them here.
export function AuthField({
  id,
  label,
  hint,
  error,
  ...inputProps
}: AuthFieldProps) {
  const t = useTranslations('auth.validation');
  const raw = error?.message;
  const message = raw && isAuthValidationKey(raw) ? t(raw) : raw;
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={!!error} {...inputProps} />
      {hint && !error && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={[message ? { message } : undefined]} />
    </Field>
  );
}
