import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The form reads ?next= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
