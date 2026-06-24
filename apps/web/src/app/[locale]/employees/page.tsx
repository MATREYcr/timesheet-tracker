import { setRequestLocale } from 'next-intl/server';
import { EmployeesScreen } from '@/features/employees/components/employees-screen';

export default async function EmployeesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EmployeesScreen />;
}
