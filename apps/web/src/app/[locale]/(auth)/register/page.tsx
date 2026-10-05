import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { RegisterForm } from '@/features/auth/components/register-form';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // useSearchParams (for ?next=) needs a Suspense boundary.
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
