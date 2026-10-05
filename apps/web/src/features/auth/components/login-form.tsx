'use client';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { signInSchema, type SignInInput } from '@timesheet/shared';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { authErrorKey, type AuthErrorKey } from '../errors';
import { useAfterAuthPath } from '../hooks';
import { AuthField } from './auth-field';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const next = useAfterAuthPath();
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: standardSchemaResolver(signInSchema) });

  const onSubmit = async (values: SignInInput) => {
    setErrorKey(null);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setErrorKey(authErrorKey(error));
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('login.title')}</CardTitle>
        <CardDescription>{t('login.description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          <FieldGroup>
            {errorKey && (
              <Alert variant="destructive">
                <AlertDescription>{t(`errors.${errorKey}`)}</AlertDescription>
              </Alert>
            )}
            <AuthField
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              label={t('fields.email')}
              error={errors.email}
              {...register('email')}
            />
            <AuthField
              id="password"
              type="password"
              autoComplete="current-password"
              label={t('fields.password')}
              error={errors.password}
              {...register('password')}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            {t('login.submit')}
          </Button>
          <p className="text-muted-foreground text-sm">
            {t('login.noAccount')}{' '}
            <Link
              href={{
                pathname: '/register',
                query: next === '/' ? {} : { next },
              }}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {t('login.toRegister')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
